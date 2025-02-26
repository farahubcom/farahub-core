const { Controller } = require('@farahub/framework/foundation');
const { Auth, Injection, Validator, Workspace } = require('@farahub/framework/facades');
const MembershipOptionsValidator = require('../validators/MembershipOptionsValidator');
const MembershipTaskbarValidator = require('../validators/MembershipTaskbarValidator');
const setWith = require('lodash/setWith');
const clone = require('lodash/clone');


class MembershipController extends Controller {

    /**
     * The controller name
     * 
     * @var string
     */
    name = 'Membership';

    /**
     * The controller base path
     * 
     * @var string
     */
    basePath = '/membership';

    /**
     * The controller routes
     * 
     * @var array
     */
    routes = [
        {
            type: 'api',
            method: 'post',
            path: '/options',
            handler: 'options',
        },
        {
            type: 'api',
            method: 'post',
            path: '/taskbar',
            handler: 'taskbar',
        },
    ];

    /**
     * Update memberhip options
     * 
     * @return {func[]} responses
     */
    options() {
        return [
            Auth.authenticate('jwt', { session: false }),
            Workspace.resolve(this.app),
            Injection.register(this.module, 'membership.options'),
            Validator.validate(new MembershipOptionsValidator()),
            async function (req, res, next) {
                try {

                    const data = req.body;

                    // resolve membership
                    const membership = await req.workspace.membership(req.user);

                    // update options
                    Object.keys(data).forEach((key) => {
                        membership.options = setWith(clone(membership.options), key, data[key], clone)
                        // membership.options.set(key, data[key]);
                    });

                    // save changes
                    await membership.save();

                    return res.json({ ok: true, options: membership.options });
                } catch (error) {
                    next(error);
                }
            }
        ]
    }

    /**
     * Update membership taskbar pins
     * 
     * @return {func[]} responses
     */
    taskbar() {
        return [
            Auth.authenticate('jwt', { session: false }),
            Workspace.resolve(this.app),
            Injection.register(this.module, 'membership.taskbar'),
            Validator.validate(new MembershipTaskbarValidator()),
            async function (req, res, next) {
                try {
                    const { tabBarPins } = req.body;

                    // resolve membership
                    const membership = await req.workspace.membership(req.user);

                    // assign pins
                    membership.tabBarPins = tabBarPins;

                    // save changes
                    await membership.save();

                    return res.json({ ok: true, tabBarPins: membership.tabBarPins });
                } catch (error) {
                    next(error);
                }
            }
        ]
    }
}

module.exports = MembershipController;