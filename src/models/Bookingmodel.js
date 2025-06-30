const dayjs = require('dayjs')
const { toNumber } = require('lodash')
const { Schema, model } = require('mongoose')
const warehouseModel = require('./warehouse.model')
const {
  Types: { ObjectId },
} = Schema

const formattedDate = toNumber(dayjs().format('YYYYMMDD').toString())
const formattedTime = toNumber(dayjs().format('HHmmss').toString())

const schema = new Schema(
  {
    user: { type: ObjectId, ref: 'User', required: true },
    bookingId: { type: String, unique: true },
    warehouse: { type: ObjectId, ref: 'Warehouse', required: true },
    fromDate: { type: Number, required: true, default: formattedDate },
    fromTime: { type: Number, required: true, default: formattedTime },
    fromTimestamp: {
      type: Number,
      required: true,
      default: new Date().getTime(),
    },
    toDate: { type: Number, required: true, default: formattedDate },
    toTime: { type: Number, required: true, default: formattedTime },
    toTimestamp: {
      type: Number,
      required: true,
      default: new Date().getTime(),
    },
    Mobile_no: { type: String },
    email: { type: String },
    name: { type: String },
    productname: { type: String },
    requestcapacity: { type: Number },
    reason_of_rejected: { type: String },
    isItemInWarehouse: { type: Boolean, default: false },
    isItemOutForTransport: { type: Boolean, default: false },
    total_price: { type: String },
    pending_price: { type: String },
    totalWeight: { type: Number },
    distance: { type: Number },
    distancePrice: { type: Number },
    distanceTotal: { type: Number },
    status: { type: String, default: 'Pending' },
    isAccepted: { type: Boolean, default: false },
    acceptedBy: { type: ObjectId, ref: 'User' },
    isRejected: { type: Boolean, default: false },
    rejectedBy: { type: ObjectId, ref: 'User' },
    shippingDetails: [
      {
        type: ObjectId,
        ref: 'Shipping',
      },
    ],
    isBookingWithdrawn: { type: Boolean, default: false },
    isBookingDeposited: { type: Boolean, default: false },
    depositId: { type: Schema.Types.ObjectId, ref: 'Deposit' },
    isBookingWeighbridgeAdded: { type: Boolean, default: false },
    weighbridgeId: { type: Schema.Types.ObjectId, ref: 'weighbridge' },
    isBookingGraded: { type: Boolean, default: false },
    gradeDetails: { type: Schema.Types.Mixed, ref: 'Deposit' },
    expiryDateOfDeposit: { type: String },
    reasonOfRejected: { type: Array },
    items: [
      {
        commodity: { type: Schema.Types.ObjectId, ref: 'Warehouse.Commodity' },
        price_perday: { type: Number },
        quantity: { type: Number },
        total_price: { type: Number },
      },
    ],
    noOfBags: { type: String },
    bagSize: { type: String },
    bookedBy: { type: String },
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
  },
  { timestamps: true },
)
schema.pre('save', async function (next) {
  if (this.isNew) {
    try {
      if (!this.pending_price) {
        this.pending_price = this.total_price
      }
      const warehouse = await warehouseModel
        .findById(this.warehouse)
        .populate('Commodity')
      if (!warehouse) {
        return next(new Error('Warehouse not found'))
      }

      const fromDate = dayjs(this.fromDate.toString())
      const toDate = dayjs(this.toDate.toString())
      const days = toDate.diff(fromDate, 'day') + 1

      let totalBookingPrice = 0

      this.items.forEach((item) => {
        const commodity = warehouse.Commodity.id(item.commodity)
        if (!commodity) {
          throw new Error(`Commodity with ID ${item.commodity} not found`)
        }

        const pricePerDay = commodity.price_perday
        const quantity = item.quantity

        const total_price = pricePerDay * quantity * days
        item.price_perday = pricePerDay
        item.total_price = total_price

        totalBookingPrice += total_price
      })

      this.total = totalBookingPrice
    } catch (err) {
      return next(err)
    }
  }
  next()
})
const BookingModel = model('Booking', schema)
module.exports = BookingModel
