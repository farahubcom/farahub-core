const mongoose = require("mongoose");
const mongooseLeanVirtuals = require('mongoose-lean-virtuals');

const { Schema } = mongoose;
const { ObjectId } = mongoose.Types;


const UserSchema = new Schema({
    firstName: String,
    lastName: String,
    avatar: String,
    bornAt: Date,
    currentWorkspace: { type: ObjectId, ref: 'Workspace' }
}, { timestamps: true });

UserSchema.pre('save', function (next) {
    this.wasNew = this.isNew;
    next();
});

// UserSchema.post('save', async function (user) {
//     try {
//         if (this.wasNew) {
//             const Workspace = this.model('Workspace');

//             // resolve category document
//             const Category = this.model('Category')
//             const category = await Category.getOneByLabel('workspace', { identifier: 'personal' });

//             // create personal workspace
//             const workspace = await Workspace.createNew({
//                 category,
//                 name: {
//                     "fa-IR": "فضای کار من",
//                     "en-US": "Personal workspace"
//                 }
//             });

//             // add member to workspace
//             const Role = this.model('Role');
//             const role = await Doc.resolveByIdentifier('owner', Role);
//             await workspace.addMember(user, role, {
//                 options: {
//                     showWalkthrough: false
//                 }
//             });

//             // set workspace as user current
//             await user.setCurrentWorkspace(workspace);
//         }
//     } catch (error) {
//         throw error;
//     }
// });

UserSchema.plugin(mongooseLeanVirtuals);

module.exports = UserSchema;