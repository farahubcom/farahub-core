const { Doc, Obj, Lang } = require("@farahub/framework/facades");
const uniqBy = require('lodash/uniqBy');
const map = require('lodash/map');


const hooks = module => ({
    'Core': {
        'workspaces.addOwner.preSave': async ({ data, user }) => {
            user.firstName = data.first_name;
            user.lastName = data.last_name;
        },
    },
    'Authentication': Obj.expand({
        'main.register.preSave': async ({ user, data }) => {
            user.firstName = data.firstName;
            user.lastName = data.lastName;
        },
        'main.login.params, main.getSelf.params': async ({ user }) => {

            const Workspace = module.app.connection.model('Workspace');
            const Permission = module.app.connection.model('Permission');

            const workspace = await Doc.resolve(user.currentWorkspace, Workspace);

            const membership = await workspace.membership(user);
            const permissions = map(uniqBy((await membership.getPermissions(Permission)), 'id'), 'identifier');


            const membershipObject = await workspace.membership(user)
                .select('options tabBarPins homePath')
                .populate({ path: 'roles', select: 'name identifier' })
                .lean({ virtuals: true });

            const workspaceObject = await Doc.resolve(user.currentWorkspace, Workspace)
                .select('name identifier options')
                .populate({ path: 'category', select: 'name identifier' })
                .lean({ virtuals: true });

            const Module = module.app.connection.model('Module');
            const subscriptions = await workspace.subscriptionsOfType('module', 'active')
                .select("subscribed validFrom validTill")
                .populate([
                    {
                        path: "subscribed",
                        model: Module,
                        select: "name identifier",
                    }
                ])
                .lean({ virtuals: true });


            return {
                workspace: {
                    ...Lang.translate(workspaceObject),
                    subscriptions,
                    membership: {
                        ...Lang.translate(membershipObject),
                        permissions
                    },
                },
            };
        }
    }),
})

module.exports = hooks;