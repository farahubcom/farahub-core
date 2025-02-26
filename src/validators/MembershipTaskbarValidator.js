class MembershipTaskbarValidator {

    /**
     * The validator rules
     * 
     * @returns {object}
     */
    rules() {
        return {
            tabBarPins: {
                isArray: {
                    bail: true
                },
                customSanitizer: {
                    options: (value, { req }) => {
                        return value.filter(Boolean);
                    }
                }
            },
            "tabBarPins.*": {
                isString: true
            }
            //
        }
    }
}

module.exports = MembershipTaskbarValidator;