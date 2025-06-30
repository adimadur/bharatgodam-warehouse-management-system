const Joi = require('joi')
const mongoose = require('mongoose')

// Utility function to check for valid MongoDB ObjectId
const isValidObjectId = (value, helpers) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.message('Invalid MongoDB ID')
  }
  return value
}

const addGradeSchema = Joi.object({
  assignerName: Joi.string().required(),
  date: Joi.date().iso().optional(),
  images: Joi.array().optional(),
  foreignMatter: Joi.number().optional(),
  otherFoodGrain: Joi.number().optional(),
  other: Joi.number().optional(),
  damagedGrain: Joi.number().optional(),
  immatureGrain: Joi.number().optional(),
  weevilledGrain: Joi.number().optional(),
  grade: Joi.string().required(),
}).unknown()

exports.validateAddGrade = (req, res, next) => {
  const { error } = addGradeSchema.validate(req.body)
  if (error) {
    return res.status(400).json({ message: error.details[0].message })
  }
  next()
}
