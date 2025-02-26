
const Workspace = require('./Workspace')
const Membership = require('./Membership')
const Module = require('./Module')
const User = require('./User')
const Invoice = require('./Invoice')
const StoragePlan = require('./StoragePlan')


const schemas = {
    Membership,
    Workspace,
    Invoice,
    Module,
    User,
    StoragePlan,
}

module.exports = schemas;