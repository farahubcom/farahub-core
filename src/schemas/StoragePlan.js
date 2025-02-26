const mongoose = require("mongoose");
const mongooseLeanVirtuals = require('mongoose-lean-virtuals');

const { Schema } = mongoose;
const { ObjectId } = mongoose.Types;


const StoragePlanSchema = new Schema({
    identifier: { type: String, unique: true, lowercase: true, sparse: true },
    name: { type: Map, of: String, required: true },
    capacity: { type: Number, required: true },
    annuallyCost: { type: Map, of: Number },
    discount: Number
}, {

    /**
     * Name of the collection
     * 
     * @var string
     */
    collection: "core:storage_plans",
    
    /**
     * Enable collection timestamps
     * 
     * @var bool
     */
    timestamps: true, 
});

StoragePlanSchema.pre('save', function (next) {
    this.wasNew = this.isNew;
    next();
});

StoragePlanSchema.plugin(mongooseLeanVirtuals);

module.exports = StoragePlanSchema;