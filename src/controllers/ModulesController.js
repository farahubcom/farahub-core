const { Controller } = require('@farahub/framework/foundation');
const { Auth, Injection, Validator, Lang, Doc } = require('@farahub/framework/facades');
const ModulesListValidator = require('../validators/ModulesListValidator');
const CreateOrUpdateModuleValidator = require('../validators/CreateOrUpdateModuleValidator');
const ModuleDetailsValidator = require('../validators/ModuleDetailsValidator');


class ModulesController extends Controller {

    /**
     * The controller name
     * 
     * @var string
     */
    name = 'Modules';

    /**
     * The controller modules
     * 
     * @var string
     */
    basePath = '/modules';

    /**
     * The controller routes
     * 
     * @var array
     */
    routes = [
        {
            type: 'api',
            method: 'get',
            path: '/',
            handler: 'list',
        },
        {
            type: 'api',
            method: 'post',
            path: '/',
            handler: 'createOrUpdate',
        },
        {
            type: 'api',
            method: 'get',
            path: '/:moduleId',
            handler: 'details',
        },
    ];

    /**
     * Get list or user workspaces
     * 
     * @param {*} req request
     * @param {*} res response
     * 
     * @return void
     */
    list() {
        return [
            Auth.authenticate('jwt', { session: false }),
            Injection.register(this.module, 'modules.list'),
            Validator.validate(new ModulesListValidator()),
            async function (req, res, next) {
                try {
                    const Module = this.app.connection.model('Module');

                    // const da = await Module.find();
                    // return res.json(da);

                    const args = req.query;

                    let search = {
                        ...(args && args.includeMicros ? {} : { micro: { $ne: true } }),
                        ...(args && args.includeInMaintenance ? {} : { maintenance: { $ne: true } })
                        //
                    }

                    if (args && args.categories) {
                        search = {
                            ...search,
                            categories: { $in: args.categories }
                        }
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
     * Create new or upadte an existing module
     * 
     * @param {*} req request
     * @param {*} res response
     * 
     * @return void
     */
    createOrUpdate() {
        return [
            Auth.authenticate('jwt', { session: false }),
            Injection.register(this.module, 'authenticated.createOrUpdate'),
            Validator.validate(new CreateOrUpdateModuleValidator(this.app)),
            async function (req, res, next) {
                try {

                    const { inject } = req;

                    const data = req.body;

                    const Module = this.app.connection.model('Module');

                    await Module.createOrUpdate(data, data.id, { inject });

                    return res.json({ ok: true });
                } catch (error) {
                    next(error);
                }
            }
        ]
    }

    /**
     * Get list or user workspaces
     * 
     * @param {*} req request
     * @param {*} res response
     * 
     * @return void
     */
    details() {
        return [
            Auth.authenticate('jwt', { session: false }),
            Injection.register(this.module, 'modules.details'),
            Validator.validate(new ModuleDetailsValidator(this.app)),
            async function (req, res, next) {
                try {
                    const { moduleId } = req.params;

                    const Module = this.app.connection.model('Module');

                    let module = await Doc.resolve(moduleId, Module)
                        .populate([
                            { path: 'dependencies', select: '-__v' },
                            { path: 'categories', select: '-__v' },
                            { path: 'workspacesCategories', select: '-__v' },
                            { path: 'permissions', select: '-__v' },
                        ])
                        .lean({ virtuals: true })

                    module = Lang.translate(module);

                    return res.json({ ok: true, module })
                } catch (error) {
                    next(error);
                }
            }
        ]
    }
}

module.exports = ModulesController;