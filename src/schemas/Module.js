const mongoose = require("mongoose");
const mongooseLeanVirtuals = require('mongoose-lean-virtuals');

const { Schema } = mongoose;
const { ObjectId } = mongoose.Types;


const ModuleSchema = new Schema({
    identifier: { type: String, unique: true, required: true, lowercase: true },
    picture: String,
    name: { type: Map, of: String },
    categories: [{ type: ObjectId, ref: 'Category' }],
    workspacesCategories: [{ type: ObjectId, ref: 'Category' }],
    dependencies: [{ type: ObjectId, ref: 'Module' }],
    permissions: [{ type: ObjectId, ref: 'Permission' }],
    micro: Boolean,
    description: { type: Map, of: String },
    monthlyCost: { type: Map, of: Number },

    // Determine if module is in maintenance
    // maintenanced module will not showen in store and can not subscribed
    maintenance: Boolean,

    // percentage amount increased base on monthly cost
    // 720 (30 (days) * 24 (hours)) / monthlyCost + (monthlyCost * (hourlyCostFactorPercent / 100))
    hourlyCostFactorPercent: Number,

    // discount percent for 3 months base on monthly cost
    trimesterlyDiscount: Number,

    // discount percent for 6 months base on monthly cost
    semiannuallyDiscount: Number,

    // discount percent for a year base on monthly cost
    annuallyDiscount: Number,
    readme: { type: Map, of: String },
    defaultTabBarPins: [String],
    defaultHomePath: String,
}, {

    /**
     * Name of the collection
     * 
     * @var string
     */
    collection: "core:modules",
    
    /**
     * Enable collection timestamps
     * 
     * @var bool
     */
    timestamps: true, 
});

ModuleSchema.plugin(mongooseLeanVirtuals);

module.exports = ModuleSchema;