const { Controller } = require('@farahub/framework/foundation');
const { Auth, Injection, Validator, Lang, FileExplorer, Workspace } = require('@farahub/framework/facades');
const WorkspacesListValidator = require('../validators/WorkspacesListValidator');
const map = require('lodash/map');
const WorkspaceOptionsValidator = require('../validators/WorkspaceOptionsValidator');
const setWith = require('lodash/setWith');
const clone = require('lodash/clone');
const split = require('lodash/split');
const WorkspaceSettingsValidator = require('../validators/WorkspaceSettingsValidator');


class WorkspaceController extends Controller {

    /**
     * The controller name
     * 
     * @var string
     */
    name = 'Workspace';

    /**
     * The controller base path
     * 
     * @var string
     */
    basePath = '/workspace';

    /**
     * The controller routes
     * 
     * @var array
     */
    routes = [
        {
            type: 'api',
            method: 'get',
            path: '/modules',
            handler: 'modules',
        },
        {
            type: 'api',
            method: 'get',
            path: '/options',
            handler: 'getOptions',
        },
        {
            type: 'api',
            method: 'post',
            path: '/options',
            handler: 'updateOptions',
        },
        {
            type: 'api',
            method: 'get',
            path: '/quotes',
            handler: 'quotes',
        },
        {
            type: 'api',
            method: 'post',
            path: '/public/explorer',
            handler: 'explorer',
        },
        {
            type: 'api',
            method: 'post',
            path: '/settings',
            handler: 'updateSettings',
        },
        // {
        //     type: 'api',
        //     method: 'post',
        //     path: '/public/explorer/read-directory',
        //     handler: 'readDirectory',
        // },
        // {
        //     type: 'api',
        //     method: 'post',
        //     path: '/public/explorer/read-file',
        //     handler: 'readFile',
        // },
        // {
        //     type: 'api',
        //     method: 'post',
        //     path: '/public/explorer/write-file',
        //     handler: 'writeFile',
        // },
        // {
        //     type: 'api',
        //     method: 'post',
        //     path: '/public/explorer/create',
        //     handler: 'createFileOrFolder',
        // },
    ];

    /**
     * File explorer instance
     * 
     * @var FileExplorer
     */
    // _explorer = new FileExplorer(this.app, this.app.publicPath);


    /**
     * Get list or all workspace modules
     * 
     * @param {*} req request
     * @param {*} res response
     * 
     * @return void
     */
    modules() {
        return [
            Auth.authenticate('jwt', { session: false }),
            Workspace.resolve(this.app),
            Injection.register(this.module, 'workspaces.details'),
            Validator.validate(new WorkspacesListValidator()),
            async function (req, res, next) {
                try {

                    const Module = this.app.connection.model('Module');

                    const modules = await req.workspace.getCurrentModules();

                    const args = req.query;

                    let search = {
                        _id: { $in: map(modules, 'id') },
                        ...((args && args.whereHasPermissions) && {
                            'permissions.0': { $exists: true }
                        })
                        //
                    }

                    const sort = args && args.sort ? args.sort : "-createdAt";

                    const query = Module.find(search)
                        .populate([
                            { path: 'dependencies', select: '-__v' },
                            { path: 'categories', select: '-__v' },
                            { path: 'workspacesCategories', select: '-__v' },
                            { path: 'permissions', select: '-__v' },
                        ])

                    query.sort(sort);

                    const total = await Module.find(search).count();

                    if (args && args.page > -1) {
                        const perPage = args.perPage || 25;
                        query.skip(args.page * perPage)
                            .limit(perPage)
                    }

                    let data = await query.lean({ virtuals: true });

                    data = Lang.translate(data);

                    return res.json({ ok: true, data, total })
                } catch (error) {
                    next(error);
                }
            }
        ]
    }

    /**
     * Get workspace options
     * 
     * @return {func[]} responses
     */
    getOptions() {
        return [
            Auth.authenticate('jwt', { session: false }),
            Workspace.resolve(this.app),
            Injection.register(this.module, 'workspace.options'),
            Validator.validate(new WorkspaceOptionsValidator()),
            async function (req, res, next) {
                try {

                    const args = req.query;
                    const options = args.keys && split(args.keys, ',').length > 0 ?
                        req.workspace.getOptions(split(args.keys, ',')) :
                        req.workspace.options;

                    return res.json({ ok: true, options });
                } catch (error) {
                    next(error);
                }
            }
        ]
    }

    /**
     * Update workspace options
     * 
     * @return {func[]} responses
     */
    updateOptions() {
        return [
            Auth.authenticate('jwt', { session: false }),
            Workspace.resolve(this.app),
            Injection.register(this.module, 'workspace.options'),
            Validator.validate(new WorkspaceOptionsValidator()),
            async function (req, res, next) {
                try {

                    const data = req.body;

                    // update options
                    Object.keys(data).forEach((key) => {
                        req.workspace.options = setWith(clone(req.workspace.options), key, data[key], clone)
                    });

                    // save changes
                    await req.workspace.save();

                    return res.json({ ok: true, options: req.workspace.options });
                } catch (error) {
                    next(error);
                }
            }
        ]
    }

    /**
     * Get workspace storage quotes
     * 
     * @return void
     */
    quotes() {
        return [
            Auth.authenticate('jwt', { session: false }),
            Workspace.resolve(this.app),
            Injection.register(this.module, 'main.quotes'),
            async function (req, res, next) {
                try {
                    const capacity = await req.workspace.getStorageCapacity();
                    const usedSpace = await req.workspace.getStorageUsedSpace(this.app);
                    const freeSpace = capacity - usedSpace;

                    return res.json({ ok: true, data: { capacity, usedSpace, freeSpace } })
                } catch (error) {
                    next(error);
                }
            }
        ]
    }

    /**
     * Update workspace settings
     * 
     * @return {func[]} responses
     */
    updateSettings() {
        return [
            Auth.authenticate('jwt', { session: false }),
            Workspace.resolve(this.app),
            Injection.register(this.module, 'workspace.settings'),
            Validator.validate(new WorkspaceSettingsValidator()),
            async function (req, res, next) {
                try {
                    const data = req.body;

                    // console.log(data);
                    req.workspace.name.set('fa-IR', data.name);

                    // inject pre save hooks
                    await req.inject('preSave', { data, workspace: req.workspace });

                    // save changes
                    await req.workspace.save();

                    // inject post save hooks
                    await req.inject('postSave', { data, workspace: req.workspace });

                    return res.json({ ok: true });
                } catch (error) {
                    next(error);
                }
            }
        ]
    }

    /**
     * Get workspace specific public path content
     * 
     * @return {func[]} responses
     */
    explorer() {
        return [
            Auth.authenticate('jwt', { session: false }),
            Workspace.resolve(this.app),
            Injection.register(this.module, 'workspace.getPublicPath'),
            // Validator.validate(new WorkspaceOptionsValidator()),
            async function (req, res, next) {
                try {

                    const { handler, params } = req.body;

                    const explorer = new FileExplorer(this.app, this.app.publicPath);
                    const result = await explorer.dispatch(handler, ...params);

                    return res.json({
                        ok: true,
                        ...result
                    });

                } catch (error) {
                    next(error);
                }
            }
        ]
    }
}

module.exports = WorkspaceController;