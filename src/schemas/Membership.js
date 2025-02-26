const mongoose = require("mongoose");
const mongooseLeanVirtuals = require('mongoose-lean-virtuals');

const { Schema } = mongoose;
const { ObjectId } = mongoose.Types;

const MembershipSchema = new Schema({
    user: { type: ObjectId, ref: 'User' },
    workspace: { type: ObjectId, ref: 'Workspace' },
    password: { type: String, select: false },
    options: Object,
    tabBarPins: [String],
    homePath: String
}, {

    /**
     * Name of the collection
     * 
     * @var string
     */
    collection: "core:memberships",
    
    /**
     * Enable collection timestamps
     * 
     * @var bool
     */
    timestamps: true, 
});

MembershipSchema.plugin(mongooseLeanVirtuals);

module.exports = MembershipSchema;