const { Schema, model } = require('mongoose')

const {
  Types: { ObjectId },
} = Schema

const invoiceSchema = new Schema(
  {
    bookingId: { type: ObjectId, ref: 'Booking' },
    User: { type: ObjectId, ref: 'User', required: true },
    invoice_no: { type: String },
    invoice_due_date: { type: String },
    transportation_charge: { type: Number },
    service_cost: { type: Number },
    grading_charge: { type: Number },
    expirydate_charge: { type: Number },
    trackingid: { type: String },
    estimated_truck_arrival: { type: String },
    partial_payment: { type: Number },
    past_payment: { type: Number },
    pending_payment: { type: Number },
    fumigation_cost: { type: Number },
    expiry_date_monitoring_charge: { type: Number },
    status: { type: String, default: 'Pending' },
    invoiceMarkedPaidBy: { type: ObjectId, ref: 'User' },
    invoice_type: { type: String, enums: ['bill', 'invoice'] },
  },
  { timestamps: true },
)

const InvoiceModel = model('invoice', invoiceSchema)
module.exports = InvoiceModel
