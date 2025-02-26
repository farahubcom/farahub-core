const mongoose = require("mongoose");
const mongooseLeanVirtuals = require('mongoose-lean-virtuals');

const { Schema } = mongoose;
const { ObjectId } = mongoose.Types;


const WorkspaceSchema = new Schema({
    name: { type: Map, of: String },
    identifier: { type: String, unique: true },
    hostname: { type: String, unique: true, sparse: true },
    category: { type: ObjectId, ref: 'Category' },
    description: { type: Map, of: String },
    // options: { type: Map, of: Object },
    options: Object,
    dbUrl: { type: String, select: false },
    picture: String,
}, {

    /**
     * Name of the collection
     * 
     * @var string
     */
    collection: "core:workspaces",
    
    /**
     * Enable collection timestamps
     * 
     * @var bool
     */
    timestamps: true, 
});

WorkspaceSchema.virtual('_memberships', {
    ref: 'Membership',
    localField: '_id',
    foreignField: 'workspace',
});

WorkspaceSchema.plugin(mongooseLeanVirtuals);

module.exports = WorkspaceSchema;