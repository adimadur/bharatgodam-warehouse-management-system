const Joi = require('joi')
const mongoose = require('mongoose')

// Utility function to check for valid MongoDB ObjectId
const isValidObjectId = (value, helpers) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.message('Invalid MongoDB ID')
  }
  return value
}

const addDepositSchema = Joi.object({
  bookingId: Joi.string().custom(isValidObjectId).required(),
  depositDate: Joi.date().iso().optional(),
  slotNumber: Joi.any().optional(),
  revalidationDate: Joi.date().iso().optional(),
  expiraryDate: Joi.date().iso().optional(),
  commodityType: Joi.string().required(),
}).unknown()

exports.validateAddDeposit = (req, res, next) => {
  const { error } = addDepositSchema.validate(req.body)
  if (error) {
    return res.status(400).json({ message: error.details[0].message })
  }
  next()
}

const getDepositByBookingIdSchema = Joi.object({
  bookingId: Joi.string().custom(isValidObjectId).required(),
}).unknown()

exports.validateGetDepositByBookingId = (req, res, next) => {
  const { error } = getDepositByBookingIdSchema.validate(req.params)
  if (error) {
    return res.status(400).json({ message: error.details[0].message })
  }
  next()
}

const getDepositByIdSchema = Joi.object({
  depositId: Joi.string().custom(isValidObjectId).required(),
}).unknown()

exports.validateGetDepositById = (req, res, next) => {
  const { error } = getDepositByIdSchema.validate(req.params)
  if (error) {
    return res.status(400).json({ message: error.details[0].message })
  }
  next()
}
