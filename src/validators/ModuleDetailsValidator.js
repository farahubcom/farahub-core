const mongoose = require("mongoose");
const { Doc } = require("@farahub/framework/facades");

const { ObjectId } = mongoose.Types;


class ModuleDetailsValidator {

    /**
     * The application instance
     * 
     * @var Application
     */
    app;

    /**
     * Create validator instance
     * 
     * @param {Application} app
     * @constructor
     */
    constructor(app) {
        this.app = app;
    }

    /**
     * The validator rules
     * 
     * @returns {object}
     */
    rules() {
        return {
            moduleId: {
                in: ["params"],
                isMongoId: {
                    bail: true
                },
                custom: {
                    options: (value, { req }) => {
                        const Module = this.app.connection.model('Module');
                        return Doc.resolve(value, Module).then(module => {
                            if (!module)
                                return Promise.reject(false);
                            return Promise.resolve(true);
                        })
                    },
                    bail: true
                },
                customSanitizer: {
                    options: (value, { req }) => {
                        return ObjectId(value);
                    }
                }
            }
            //
        }
    }
}

module.exports = ModuleDetailsValidator;