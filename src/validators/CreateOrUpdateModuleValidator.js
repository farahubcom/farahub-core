const mongoose = require("mongoose");
const fs = require('fs');
const { Doc } = require("@farahub/framework/facades");

const { ObjectId } = mongoose.Types;


class CreateOrUpdateModuleValidator {

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
            name: {
                in: ["body"],
                isString: {
                    bail: true
                },
                notEmpty: {
                    bail: true,
                    errorMessage: 'ورود نام ماژول اجباری است'
                }
            },
            identifier: {
                in: ["body"],
                isString: true,
                notEmpty: {
                    bail: true,
                    errorMessage: 'شناسه ماژول اجباری است'
                },
                custom: {
                    options: (value, { req }) => {

                        if (!fs.existsSync(this.app.getModulesPath(value))) {
                            throw new Error('مسیری با این شناسه وجود ندارد.');
                        }

                        return true;
                        // const Module = this.app.model('Module');
                        // return Doc.resolveByIdentifier(value, Module).then(module => {
                        //     if (module) {
                        //         return Promise.reject('شناسه قبلا ثبت شده است.');
                        //     };

                        //     return true;
                        // });
                    }
                },
            },
            description: {
                in: ["body"],
                isString: true,
                optional: true
            },
            readme: {
                in: ["body"],
                isString: true,
                optional: true
            },
            micro: {
                in: ["body"],
                isBoolean: true,
                toBoolean: true
            },
            maintenance: {
                in: ["body"],
                isBoolean: true,
                toBoolean: true
            },
            monthlyCost: {
                in: ["body"],
                optional: true,
                customSanitizer: {
                    options: (value, { req }) => {
                        if (value === "") return 0;
                        return value;
                    }
                },
                toInt: true,
                isInt: true,
            },
            annuallyDiscount: {
                in: ["body"],
                optional: true,
                customSanitizer: {
                    options: (value, { req }) => {
                        if (value === "") return 0;
                        return value;
                    }
                },
                toInt: true,
                isInt: true,
            },
            dependencies: {
                in: ["body"],
                optional: true,
                isArray: true
            },
            'dependencies.*': {
                in: ["body"],
                custom: {
                    options: (value, { req }) => {
                        const Module = this.app.model('Module');

                        return Doc.resolve(value, Module).then(module => {
                            if (!module) {
                                return Promise.reject('Module not exist');
                            };
                        });
                    }
                },
                customSanitizer: {
                    options: (value, { req }) => {
                        const Module = this.app.model('Module');

                        return Doc.resolve(value, Module).then(result => {
                            if (result) return Promise.resolve(result);
                        });
                    }
                }
            },
            categories: {
                in: ["body"],
                optional: true,
                isArray: true
            },
            'categories.*': {
                in: ["body"],
                custom: {
                    options: (value, { req }) => {
                        const Category = this.app.model('Category');

                        return Doc.resolve(value, Category).then(category => {
                            if (!category) {
                                return Promise.reject('Category not exist');
                            };
                        });
                    }
                },
                customSanitizer: {
                    options: (value, { req }) => {
                        const Category = this.app.model('Category');

                        return Doc.resolve(value, Category).then(result => {
                            if (result) return Promise.resolve(result);
                        });
                    }
                }
            },
        }
    }
}

module.exports = CreateOrUpdateModuleValidator;