const mongoose = require('mongoose')
const Schema = require('mongoose')
const {
  Types: { ObjectId },
} = Schema

const warehouseSchema = new mongoose.Schema({
  User: { type: ObjectId, ref: 'User' },
  warehouse_name: { type: String },
  warehouse_id: { type: String, unique: true },
  locality_area: { type: String },
  landmark: { type: String },
  pincode: { type: String },
  city: { type: String },
  State: { type: String },
  mobile_number: { type: String },
  total_capacity: { type: Number },
  filled_capacity: { type: Number },
  remainingCapacity: { type: Number },
  wdra_certificate: { type: Array },
  wdra_certified: { type: Boolean, default: false },
  Facilities: { type: Array },
  main_photo: { type: Array },
  other_photo: { type: Array },
  manager: { type: ObjectId, ref: 'User' },
  Commodity: [
    {
      name: { type: String },
      AddedBy: { type: ObjectId, ref: 'User' },
      price_perday: [
        {
          weight: { type: String },
          price: { type: Number },
        },
      ],
    },
  ],
  logo: { type: String },
  bank_accounts: { type: Array },
  ratings: [
    {
      user: { type: ObjectId, ref: 'User' },
      rating: { type: Number, required: true, min: 1, max: 5 },
    },
  ],
  avgRating: { type: Number, default: 0 },
  isActive: { type: Boolean, default: false },
  isArchived: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  AddedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
})

const WarehouseModel = mongoose.model('Warehouse', warehouseSchema)
module.exports = WarehouseModel
