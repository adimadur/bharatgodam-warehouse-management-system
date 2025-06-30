const Joi = require('joi')
const mongoose = require('mongoose')

// Utility function to check for valid MongoDB ObjectId
const isValidObjectId = (value, helpers) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.message('Invalid MongoDB ID')
  }
  return value
}

const createBookingSchema = Joi.object({
  user: Joi.string().custom(isValidObjectId).optional(),
  warehouse: Joi.string().custom(isValidObjectId).optional(),
  mobile_no: Joi.string().required(),
  email: Joi.string().email().required(),
  productname: Joi.string().required(),
  requestcapacity: Joi.number().required(),
  totalWeight: Joi.number().required(),
  distance: Joi.number().required(),
  distancePrice: Joi.number().required(),
  distanceTotal: Joi.number().required(),
}).unknown()

exports.validateCreateBooking = (req, res, next) => {
  const { error } = createBookingSchema.validate(req.body)
  if (error) {
    return res.status(400).json({ message: error.details[0].message })
  }
  next()
}

const acceptBookingSchema = Joi.object({
  id: Joi.string().custom(isValidObjectId).required(),
}).unknown()

exports.validateAcceptBooking = (req, res, next) => {
  const { error } = acceptBookingSchema.validate(req.params)
  if (error) {
    return res.status(400).json({ message: error.details[0].message })
  }
  next()
}

const rejectBookingSchema = Joi.object({
  id: Joi.string().custom(isValidObjectId).required(),
  reasonOfRejected: Joi.string().required(),
}).unknown()

exports.validateRejectBooking = (req, res, next) => {
  const { error } = rejectBookingSchema.validate({ ...req.params, ...req.body })
  if (error) {
    return res.status(400).json({ message: error.details[0].message })
  }
  next()
}

const getBookingsByWarehouseIdSchema = Joi.object({
  warehouseId: Joi.string().custom(isValidObjectId).required(),
}).unknown()

exports.validateGetBookingsByWarehouseId = (req, res, next) => {
  const { error } = getBookingsByWarehouseIdSchema.validate(req.params)
  if (error) {
    return res.status(400).json({ message: error.details[0].message })
  }
  next()
}

const getBookingByIdSchema = Joi.object({
  bookingId: Joi.string().custom(isValidObjectId).required(),
}).unknown()

exports.validateGetBookingById = (req, res, next) => {
  const { error } = getBookingByIdSchema.validate(req.params)
  if (error) {
    return res.status(400).json({ message: error.details[0].message })
  }
  next()
}
