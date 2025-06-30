const mongoose = require('mongoose')
const Schema = require('mongoose')
const {
  Types: { ObjectId },
} = Schema

const weighBridgeSchema = new mongoose.Schema(
  {
    booking_id: { type: ObjectId, ref: 'Booking', required: true },
    User: { type: ObjectId, ref: 'User', required: true },
    today_date: { type: String },
    time: { type: String },
    gross_weight: { type: Number },
    gross_weight_unit: { type: String },
    tore_weight: { type: Number },
    tore_weight_unit: { type: String },
    net_weight: { type: Number },
    net_weight_unit: { type: String },
    truck_number: { type: String },
    driver_name: { type: String },
  },
  {
    timestamps: true,
  },
)

const weightBridgeModel = mongoose.model('weighbridge', weighBridgeSchema)
module.exports = weightBridgeModel
