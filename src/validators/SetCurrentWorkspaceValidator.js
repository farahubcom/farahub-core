const mongoose = require("mongoose");
const { Doc } = require("@farahub/framework/facades");

const { ObjectId } = mongoose.Types;


class SetCurrentWorkspaceValidator {

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
            workspaceId: {
                in: ["params"],
                isMongoId: {
                    bail: true
                },
                custom: {
                    options: (value, { req }) => {
                        const Workspace = this.app.connection.model('Workspace');
                        return Doc.resolve(value, Workspace).then(workspace => {
                            if (!workspace)
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

    /**
     * Custom validation formatter
     * 
     * @returns {func}
     */
    toResponse(res, { errors }) {
        return res.status(404).json({
            ok: false,
            message: 'Person not found'
        })
    }
}

module.exports = SetCurrentWorkspaceValidator;