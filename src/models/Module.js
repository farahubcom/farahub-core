const pick = require("lodash/pick");
const mongoose = require("mongoose");
const { Doc } = require("@farahub/framework/facades");

const { ObjectId } = mongoose.Types;

class Module {

    /**
     * Get the module herediataries
     * 
     * @returns {Module[]}
     */
    async getHereditary() {
        let result = [this];

        if (this.dependencies && this.dependencies.length > 0) {
            const Module = this.model('Module');
            await Promise.all(
                this.dependencies.map(
                    async moduleId => {
                        const module = await Doc.resolve(moduleId, Module);
                        const hereditary = await module.getHereditary();
                        result = [...result, ...hereditary];
                    }
                )
            )
        }

        return result;
    }

    /**
     * Create new or update an existing module
     * 
     * @param {Object} data module data created
     * @param {string} data.identifier module identifier
     * @param {string} data.name module name
     * @param {string} data.monthlyCost module monthly cost in toman
     * @param {string} moduleId modifying module id
     * @return {Module} modified module
     */
    static async createOrUpdate(data, moduleId, { inject, connection }) {
        try {
            const Module = this.model('Module');

            // create instance
            const module = moduleId ?
                await Module.findById(
                    ObjectId(moduleId)
                ) : new Module();

            // assign name, description & readme
            Object.keys(
                pick(data, [
                    'name',
                    'description',
                    'readme'
                ])
            ).forEach(key => {
                if (data[key]) {
                    module[key] = {
                        'fa-IR': data[key]
                    };
                }
            });

            // assign monthlyCost
            module.monthlyCost = undefined;
            if (data.monthlyCost) {
                module.monthlyCost = {
                    'IRR': data.monthlyCost
                };
            }

            // assign other fields
            Object.keys(
                pick(data, [
                    'micro',
                    'identifier',
                    'maintenance',
                    'hourlyCostFactorPercent',
                    'trimesterlyDiscount',
                    'semiannuallyDiscount',
                    'annuallyDiscount',
                ])
            ).forEach(key => {
                module[key] = data[key];
            });

            // assign dependencies if exist
            if (data.dependencies && data.dependencies.length > 0) {
                module.dependencies = data.dependencies.map(dependency => dependency.id);
                // module.dependencies = await Promise.all(
                //     data.dependencies.map(
                //         async dependency => {
                //             dependency = await Doc.resolve(dependency, Module);

                //             return dependency.id;
                //             // module.dependencies = module.dependencies ? [...module.dependencies, dependency.id] : [dependency.id];
                //         }
                //     )
                // )
            }

            // assign categories if exist
            if (data.categories && data.categories.length > 0) {
                module.categories = data.categories.map(category => category.id);
                // const Category = this.model('Category');
                // module.categories = await Promise.all(
                //     data.categories.map(
                //         async category => {
                //             category = await Doc.resolve(category, Category);

                //             return category.id;
                //             // module.categories = module.categories ? [...module.categories, category.id] : [category.id];
                //         }
                //     )
                // )
            }

            // inject pre save hooks
            await inject('preSave', { module, data })

            // save document
            await module.save();

            // inject post save hooks
            await inject('postSave', { module, data })

            // return modified module
            return module;
        } catch (error) {
            throw error;
        }
    }

    //
}

module.exports = Module;