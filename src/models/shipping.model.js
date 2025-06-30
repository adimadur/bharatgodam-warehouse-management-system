const mongoose = require('mongoose')
const Schema = require('mongoose')
const {
  Types: { ObjectId },
} = Schema

const shippingSchema = new mongoose.Schema(
  {
    bookingId: { type: ObjectId, ref: 'Booking', required: true },
    warehouse: { type: ObjectId, ref: 'Warehouse', required: true },
    User: { type: ObjectId, ref: 'User', required: true },
    shippingId: { type: String },
    withdrawlId: { type: String },
    truckNumber: { type: String },
    driverName: { type: String },
    commodity: [
      {
        itemName: { type: String },
        quantity: { type: Number },
      },
    ],
    totalBags: { type: Number, default: 0 },
    status: { type: String },
    images: [],
    otp: { type: String },
  },
  { timestamps: true },
)

const shippingModule = mongoose.model('Shipping', shippingSchema)
module.exports = shippingModule
