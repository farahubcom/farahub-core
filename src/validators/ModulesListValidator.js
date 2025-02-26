const mongoose = require("mongoose");

const { ObjectId } = mongoose.Types;



class ModulesListValidator {

    /**
     * The validator rules
     * 
     * @returns {object}
     */
    rules() {
        return {
            query: {
                in: ["query"],
                optional: true,
                isString: true
            },
            sort: {
                in: ["query"],
                optional: true,
                isString: true
            },
            page: {
                in: ["query"],
                optional: true,
                isInt: true,
                toInt: true
            },
            perPage: {
                in: ["query"],
                optional: true,
                isInt: true,
                toInt: true
            },
            includeMicros: {
                in: ["query"],
                optional: true,
                isBoolean: true,
                toBoolean: true
            },
            includeInMaintenance: {
                in: ["query"],
                optional: true,
                isBoolean: true,
                toBoolean: true
            },
            categories: {
                in: ["query"],
                optional: true,
                isString: true,
                customSanitizer: {
                    options: (value, { req }) => {
                        if (!value) return '';
                        return value.split(',').filter(Boolean).map(v => ObjectId(v))
                    }
                }
            },
            //
        }
    }
}

module.exports = ModulesListValidator;