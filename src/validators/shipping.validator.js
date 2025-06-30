const Joi = require('joi')
const mongoose = require('mongoose')

// Utility function to check for valid MongoDB ObjectId
const isValidObjectId = (value, helpers) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.message('Invalid MongoDB ID')
  }
  return value
}

const addShippingSchema = Joi.object({
  warehouseId: Joi.string().custom(isValidObjectId).required(),
  bookingId: Joi.string().custom(isValidObjectId).required(),
}).unknown()

exports.validateAddShipping = (req, res, next) => {
  const { error } = addShippingSchema.validate(req.params)
  if (error) {
    return res.status(400).json({ message: error.details[0].message })
  }
  next()
}

const getShippingByIdSchema = Joi.object({
  id: Joi.string().custom(isValidObjectId).required(),
}).unknown()

exports.validateGetShippingById = (req, res, next) => {
  const { error } = getShippingByIdSchema.validate(req.params)
  if (error) {
    return res.status(400).json({ message: error.details[0].message })
  }
  next()
}

const getWithdrawalIdSchema = Joi.object({
  id: Joi.string().custom(isValidObjectId).required(),
}).unknown()

exports.validateGetWithdrawalId = (req, res, next) => {
  const { error } = getWithdrawalIdSchema.validate(req.params)
  if (error) {
    return res.status(400).json({ message: error.details[0].message })
  }
  next()
}

const updateShippingSchema = Joi.object({
  id: Joi.string().custom(isValidObjectId).required(),
}).unknown()

exports.validateUpdateShipping = (req, res, next) => {
  const { error } = updateShippingSchema.validate(req.params)
  if (error) {
    return res.status(400).json({ message: error.details[0].message })
  }
  next()
}

const getShippingByWithdrawalIdSchema = Joi.object({
  withdrawlId: Joi.string().uuid().required(),
}).unknown()

exports.validateGetShippingByWithdrawalId = (req, res, next) => {
  const { error } = getShippingByWithdrawalIdSchema.validate(req.params)
  if (error) {
    return res.status(400).json({ message: error.details[0].message })
  }
  next()
}
