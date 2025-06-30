const mongoose = require('mongoose')
const Schema = mongoose.Schema
const {
  Types: { ObjectId },
} = Schema
const depositSchema = new Schema(
  {
    User: { type: ObjectId, ref: 'User' },
    gradeAddedBy: { type: ObjectId, ref: 'User' },
    depositDate: { type: Date },
    slotNumber: { type: String },
    revalidationDate: { type: Date },
    expiraryDate: { type: Date },
    commodityName: { type: String },
    commodityType: {
      type: String,
      enum: ['exchangeCommodity', 'non-exchangeCommodity'],
      required: true,
    },
    bookingId: { type: Schema.Types.ObjectId, ref: 'Booking' },
    warehouseName: { type: String },
    totalWeight: { type: Number },
    totalAmount: { type: Number },
    status: { type: String, default: 'Pending' },
    assignerName: { type: String },
    gradeDate: { type: Date },
    images: [],
    foreignMatter: { type: Number },
    otherFoodGrain: { type: Number },
    other: { type: Number },
    damagedGrain: { type: Number },
    immatureGrain: { type: Number },
    weevilledGrain: { type: Number },
    grade: { type: String },
    isWithdrawl: { type: String },
  },
  { timestamps: true },
)

const DepositModel = mongoose.model('Deposit', depositSchema)

module.exports = DepositModel
