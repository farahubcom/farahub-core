const join = require("lodash/join");

class User {

    /**
     * Get user membership of specific workspace
     * 
     * @param {Workspace} workspace workspace
     * @return {Membership} workspace memebership
     */
    membership(workspace) {
        return this.model('Membership').findOne({ user: this.id, workspace: workspace.id });
    }

    /**
     * Get user memberships
     * 
     * @param {object} filter query filter
     * @return {Membership[]} workspace memberships
     */
    memberships(filter = {}) {
        return this.model('Membership').find({ user: this.id, ...filter });
    }

    /**
     * Set the user current workspace
     * 
     * @param {Workspace} workspace
     * @return void
     */
    async setCurrentWorkspace(workspace) {
        this.currentWorkspace = workspace.id;
        await this.save();
    }


    /**
     * Get user full name
     * 
     * @return string|null
     */
    get fullName() {
        return Boolean(this.firstName) || Boolean(this.lastName) ?
            join([this.firstName, this.lastName], ' ') :
            null;
    };

    //
}

module.exports = User;