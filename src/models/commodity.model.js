const mongoose = require('mongoose')
const Schema = mongoose.Schema

const commoditySchema = new Schema(
  {
    name: { type: String },
    bags: { type: Array, default: [] },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
)

const commodityModel = mongoose.model('Commodity', commoditySchema)

module.exports = commodityModel
