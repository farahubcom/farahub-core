class Membership {

    /**
     * Get memberhip specific option
     * 
     * @param {string} key
     * @param {any} defaultValue
     * 
     * @returns option value or default value
     */
    getOption(key, defaultValue = null) {
        return this.options.get(key) || defaultValue;
    }
    
    //
}

module.exports = Membership;