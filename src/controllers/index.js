const WorkspacesController = require("./WorkspacesController");
const ModulesController = require("./ModulesController");
const AuthenticatedController = require("./AuthenticatedController");
const MembershipController = require("./MembershipController");
const WorkspaceController = require("./WorkspaceController");


const controllers = [
    WorkspacesController,
    ModulesController,
    AuthenticatedController,
    MembershipController,
    WorkspaceController,
];

module.exports = controllers;