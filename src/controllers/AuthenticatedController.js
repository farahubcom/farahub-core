const { Controller } = require('@farahub/framework/foundation');
const { Auth, Workspace, Lang, Injection, Validator, Doc } = require('@farahub/framework/facades');
const AuthenticatedWorkspacesValidator = require('../validators/AuthenticatedWorkspacesValidator');
const SetCurrentWorkspaceValidator = require('../validators/SetCurrentWorkspaceValidator');
const map = require('lodash/map');
const uniqBy = require('lodash/uniqBy');


class AuthenticatedController extends Controller {

    /**
     * The controller name
     * 
     * @var string
     */
    name = 'Authenticated';

    /**
     * The controller base path
     * 
     * @var string
     */
    basePath = '/self';

    /**
     * The controller routes
     * 
     * @var array
     */
    routes = [
        {
            type: 'api',
            method: 'get',
            path: '/access',
            handler: 'getAccess',
        },
        {
            type: 'api',
            method: 'get',
            path: '/workspaces',
            handler: 'workspaces',
        },
        {
            type: 'api',
            method: 'post',
            path: '/workspaces/:workspaceId/setAsCurrent',
            handler: 'setAsCurrent',
        },
    ];

    /**
     * Get user roles and permissions
     * 
     * @param {*} req request
     * @param {*} res response
     * 
     * @return void
     */
    getAccess() {
        return [
            Auth.authenticate('jwt', { session: false }),
            Workspace.resolve(this.app),
            Injection.register(this.module, 'authenticated.getAccess'),
            // Validator.validate(new AuthenticatedWorkspacesValidator()),
            async function (req, res, next) {
                try {
                    const Permission = this.app.connection.model('Permission');

                    let membership = await req.workspace.membership(req.user);
                    const permissions = map(uniqBy((await membership.getPermissions(Permission)), 'id'), 'identifier');

                    let membershipObject = await req.workspace
                        .membership(req.user)
                        .populate({ path: 'roles', select: 'name identifier' })
                        .lean({ virtuals: true });

                    let roles = membershipObject.roles;

                    roles = Lang.translate(roles);

                    const { workspace, user, wsConnection: connection } = req;
                    const injectedParams = await req.inject('params', {
                        roles,
                        permissions,
                        user,
                        workspace,
                        connection,
                        membership,
                        Permission,
                    });


                    return res.json({
                        ok: true,
                        roles,
                        permissions,
                        ...(Object.assign({},
                            ...injectedParams
                        ))
                    })
                } catch (error) {
                    next(error);
                }
            }
        ]
    }

    /**
     * Get workspaces list or user workspaces
     * 
     * @param {*} req request
     * @param {*} res response
     * 
     * @return void
     */
    workspaces() {
        return [
            Auth.authenticate('jwt', { session: false }),
            Injection.register(this.module, 'authenticated.workspaces'),
            Validator.validate(new AuthenticatedWorkspacesValidator()),
            async function (req, res, next) {
                try {

                    const Workspace = this.app.connection.model('Workspace');

                    const args = req.query;

                    const memberships = await req.user.memberships();

                    let search = {
                        _id: { $in: map(memberships, 'workspace') }
                        //
                    };

                    const sort = args && args.sort ? args.sort : "-createdAt";

                    const query = Workspace
                        .find(search)
                        .populate([
                            { path: 'category' }
                        ])

                    query.sort(sort);

                    const total = await Workspace.find(search).count();

                    if (args && args.page > -1) {
                        const perPage = args.perPage || 25;
                        query.skip(args.page * perPage)
                            .limit(perPage)
                    }

                    let data = await query.lean({ virtuals: true });

                    data = await Promise.all(
                        data.map(
                            async workspace => {

                                const membership = await req.user
                                    .membership(workspace)
                                    .populate([
                                        { path: 'roles', select: 'identifier name' }
                                    ])
                                    .select('options')
                                    .lean({ virtuals: true });


                                return {
                                    ...workspace,
                                    membership
                                }
                            }
                        )
                    )

                    data = Lang.translate(data);

                    return res.json({ ok: true, data, total })
                } catch (error) {
                    next(error);
                }
            }
        ]
    }

    /**
     * Change user current workspace
     * 
     * @param {*} req request
     * @param {*} res response
     * 
     * @return void
     */
    setAsCurrent() {
        return [
            Auth.authenticate('jwt', { session: false }),
            Injection.register(this.module, 'authenticated.setAsCurrent'),
            Validator.validate(new SetCurrentWorkspaceValidator(this.app)),
            async function (req, res, next) {
                try {

                    const { workspaceId } = req.params;

                    const Workspace = this.app.connection.model('Workspace');

                    const workspace = await Doc.resolve(workspaceId, Workspace);
                    const membership = await req.user.membership(workspace);

                    if (!workspace || !membership) {
                        return res.status(404).json({
                            ok: false,
                            message: 'No such workspace or membership'
                        })
                    }

                    await req.user.setCurrentWorkspace(workspace);

                    return res.json({ ok: true })
                } catch (error) {
                    next(error);
                }
            }
        ]
    }
}

module.exports = AuthenticatedController;