const mongoose = require("mongoose");
const mongooseLeanVirtuals = require('mongoose-lean-virtuals');

const { Schema } = mongoose;
const { ObjectId } = mongoose.Types;


const InvoiceSchema = new Schema({
    workspace: { type: ObjectId, ref: 'Workspace' },
}, { timestamps: true });

InvoiceSchema.plugin(mongooseLeanVirtuals);

module.exports = InvoiceSchema;