const forOwn = require("lodash/forOwn");
const mongoose = require("mongoose");
const { Doc, getFolderSize } = require("@farahub/framework/facades");
const uniqueSlug = require('unique-slug');
const omit = require("lodash/omit");
const sumBy = require("lodash/sumBy");
const filter = require("lodash/filter");
const map = require("lodash/map");
const toLower = require("lodash/toLower");
const includes = require("lodash/includes");
const setWith = require("lodash/setWith");
const clone = require("lodash/clone");
const get = require("lodash/get");

const { ObjectId } = mongoose.Types;


class Workspace {

    /**
     * Get workspace membership of specific user
     * 
     * @param {User} user user
     * @return {Membership} user memebership
     */
    membership(user) {
        return this.model('Membership').findOne({ workspace: this.id, user: user.id });
    }

    /**
     * Get workspace members
     * 
     * @param {object} filter query filter
     * @return {[Membership]} workspace memberships
     */
    memberships(filter = {}) {
        return this.model('Membership').find({ workspace: this.id, ...filter });
    }

    /**
     * Check if workspace has specific user
     * 
     * @return {bool}
     */
    async hasMember(user) {
        const data = await this.memberships({ user: user.id });
        return data.length > 0;
    }

    /**
     * Set workspace as user current workspace
     * 
     * @param {User} user
     */
    async setAsUserCurrentWorkspace(user) {
        user.currentWorkspace = this.id;
        await user.save();
    }

    /**
     * Get workspace specific option
     * 
     * @param {string} key
     * @param {any} defaultValue
     * 
     * @returns option value or default value
     */
    getOption(key, defaultValue = null) {
        return get(this.options, key, defaultValue);
    }

    /**
     * Get workspace multiple options
     * 
     * @param {string[]|array[]} keys
     * 
     * @returns options values
     */
    getOptions(keys) {
        let self = this;
        let result = {};
        map(keys, (key) => {
            result = {
                ...result,
                [key]: self.getOption(
                    Array.isArray(key) ? key[0] : key,
                    Array.isArray(key) ? key[1] : null
                )
            };
        });
        return result;
    }

    /**
     * Set workspace specific option
     * 
     * @param {string} key
     * @param {any} value
     * 
     * @returns void
     */
    async setOption(key, value) {
        await this.setOptions({ [key]: value });
    }

    /**
     * Set workspace specific options
     * 
     * @param {Object} data
     * 
     * @returns void
     */
    async setOptions(data) {
        var self = this;
        Object.keys(data).forEach(function (key) {
            self.options = setWith(clone(self.options), key, data[key], clone);
        });
        await self.save();
    }

    /**
     * Get workspace current modules 
     * 
     * @return {Promise<Module[]>}
     */
    async getCurrentModules() {
        try {
            const Module = this.model('Module');

            const subscriptions = await this.subscriptionsOfType('module', 'current');

            let modulesIds = [];

            await Promise.all(
                subscriptions.map(
                    async subscription => {
                        const subscribed = await Doc.resolve(subscription.subscribed, Module);
                        const hereditary = await subscribed.getHereditary();
                        modulesIds = [...modulesIds, ...hereditary.map(m => m.identifier)];
                    }
                )
            )

            // remove duplicates modules
            modulesIds = [...new Set(modulesIds)];

            // get modules
            const modules = await Module.find({ identifier: { $in: modulesIds } });

            // return modules
            return modules;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Check if workspace has module as current
     * 
     * @param {string} identifier module identifier
     * 
     * @returns {Promise<bool>}
     */
    async hasCurrentModule(identifier) {
        try {
            return (await this.getCurrentModules()).filter(function (module) {
                return String(module.identifier).toLowerCase() === String(identifier).toLowerCase();
            }).length > 0;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get workspace active modules with their dependencies
     * 
     * @param {Application} application the application instance
     * @return {Promise<Module[]>} resolved modules array
     */
    async resolveModulesHereditary(app) {
        try {
            const currentModules = await this.getCurrentModules();
            const modules = filter(
                app.modules,
                module => includes(
                    map([...map(currentModules, 'identifier'), ...app.defaultModules], toLower),
                    toLower(module.name)
                )
            );

            return modules;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Create workspace connection base on current subscriptions 
     *    
     * @param {Workspace} workspace 
     * @return {Promise<Connection|null>} Created connection
     */
    async createConnection(app) {
        try {
            const workspace = await this.model('Workspace').findById(this.id, '+dbUrl');

            if (!workspace.dbUrl) {
                return null;
            }

            const connection = mongoose.createConnection(workspace.dbUrl);

            const modules = await this.resolveModulesHereditary(app);

            let schemas = {};
            modules.forEach((module) => {
                forOwn(omit(module.schemas, 'injects'), (schema, schemaName) => {

                    if (schemaName in schemas) {
                        schemas[schemaName].add(schema);
                    } else {
                        schemas[schemaName] = schema;
                    }
                })

                if ('injects' in module.schemas) {
                    forOwn(module.schemas['injects'], (moduleSchemas, moduleName) => {
                        forOwn(moduleSchemas, (schema, schemaName) => {
                            if (modules.map(m => m.name).includes(moduleName)) {
                                if (schemaName in schemas) {
                                    schemas[schemaName].add(schema);
                                } else {
                                    schemas[schemaName] = schema;
                                }
                            }
                        })
                    })
                }
            });

            forOwn(schemas, (value, key) => {
                connection.model(key, value);
            });

            return connection;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get workspace connection or create new if not exist
     * 
     * 
     */
    async getOrCreateConnection(app) {
        return app.connections[this.id] ?? await this.createConnection(app);
    }

    /**
     * Get workspace injections for specific module
     * 
     * @param {Module} module the module instance
     * @returns {object} object of injections
     */
    async getInjections(module) {
        try {
            const modules = await this.resolveModulesHereditary(module.app);

            let injections = {};

            modules.forEach((m) => {
                const hooks = typeof (m.hooks) === "function" ?
                    m.hooks(m) :
                    m.hooks;
                if (hooks) {
                    forOwn(hooks, (_injections, _moduleName) => {
                        if (String(_moduleName).toLowerCase() === String(module.name).toLowerCase()) {
                            forOwn(_injections, (value, key) => {
                                injections = {
                                    ...injections,
                                    [key]: [...(injections[key] || []), value]
                                }
                            })
                        }
                    })
                }
            });

            return injections;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Inject base on workspace active modules
     * 
     * @param {Module} module the module instance
     * @param {string} hookName hook name
     * @param {Object} args arguments
     * @returns {mixed}
     */
    async inject(module, hookName, args) {
        try {
            const injections = await this.getInjections(module);

            if (
                Object.keys(injections).map(
                    hook => String(hook).toLowerCase() === String(hookName).toLowerCase()
                ).filter(Boolean).length < 1
            ) return null;

            return await Promise.all(
                injections[hookName].map(
                    async (render, index) => await render({ ...args, key: index })
                )
            );
        } catch (error) {
            throw error;
        }
    }

    /**
     * Create a new workspace
     * 
     * @param {Object} data
     * @param {string|Object} data.name workspace name
     * @param {Category|string} data.category workspace category
     * @return {Workspace} created workspace
     */
    static async createNew(data) {
        try {
            const Workspace = this.model('Workspace');

            // create workspace instance
            const workspace = new Workspace();

            const id = new ObjectId();

            workspace._id = id;

            // assign identifier
            let identifier = data.identifier;
            if (!data.identifier) {
                identifier = uniqueSlug();
                let count = await Workspace.count({ identifier });

                while (count > 0) {
                    identifier = uniqueSlug();
                    count = await Workspace.count({ identifier });
                }
            }
            identifier = identifier.replace(/\s/g, ''); // remove all whitespaces
            workspace.identifier = identifier;

            // assign hostname
            if (data.hostname)
                workspace.hostname = data.hostname;

            // assign dbUrl
            const dbName = identifier.replace(/( )|(-)/g, '_');
            workspace.dbUrl = 'mongodb://127.0.0.1:27017/'.concat(dbName)

            // assign name
            if (data.name) {
                workspace.name = typeof data.name === "string" ? {
                    "fa-IR": data.name
                } : data.name;
            }

            // assign category
            if (data.category) {
                const category = await Doc.resolve(data.category, this.model('Category'));
                workspace.category = category.id;
            }

            // assign default options
            workspace.options = {
                "locale": "fa-IR",
                "currency": "IRR"
            };

            // save workspace
            await workspace.save();

            // return created workspace
            return workspace;
        } catch (error) {
            throw error;
        }
    }


    /**
     * Add new user to the workspace
     * 
     * @param {User} user user to add
     * @param {Role|Role[]} roles the user roles
     * @param {{tabBarPins: string[], options: Object}}
     */
    async addMember(user, roles, { password, options = {}, tabBarPins, homePath } = {}) {

        const Membership = this.model('Membership');

        const membership = new Membership();

        // assign workspace
        membership.workspace = this.id;

        // assign user
        membership.user = user.id;

        // assign password
        membership.password = password;

        // assign roles
        if (roles)
            membership.roles = Array.isArray(roles) ? roles.map(role => role.id) : roles.id;

        // assign options
        membership.options = {
            darkMode: false,
            theme: "default",
            // "background": "url(/static/wallpapers/01.jpg)",
            background: "linear-gradient(to bottom, #24c6dc, #514a9d)",
            displayLanguage: "fa",
            timeZone: "Asia/Tehran",
            showWalkthrough: true,
            ...options
        }

        // assign tabbar pins
        if (tabBarPins)
            membership.tabBarPins = tabBarPins;

        // assign home path
        if (homePath)
            membership.homePath = homePath;

        // save the membership
        await membership.save();
    }

    /**
     * Get workspace storage capacity base on subscriptions
     * 
     */
    async getStorageCapacity() {
        const StoragePlan = this.model('StoragePlan');
        const subscriptions = await this.subscriptionsOfType('StoragePlan', 'current')
            .populate({ path: 'subscribed', model: StoragePlan });

        return sumBy(subscriptions, subscription => subscription.subscribed.capacity);
    }

    /**
     * Get workspace used storage
     * 
     * @param Applicaiton app
     */
    async getStorageUsedSpace(app) {
        return await getFolderSize.loose(app.getAppsPath(this.identifier));
    }

    //
}

module.exports = Workspace;