const Joi = require('joi')
const mongoose = require('mongoose')

// Utility function to check for valid MongoDB ObjectId
const isValidObjectId = (value, helpers) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.message('Invalid MongoDB ID')
  }
  return value
}

const createWarehouseSchema = Joi.object({
  warehouse_name: Joi.string().required(),
  warehouse_id: Joi.string().required(),
  locality_area: Joi.string().required(),
  landmark: Joi.string().optional(),
  pincode: Joi.string()
    .length(6)
    .pattern(/^[0-9]+$/)
    .required()
    .messages({
      'string.length': 'Pincode must be 6 digits',
      'any.required': 'Pincode is required',
    }),
  city: Joi.string().required(),
  State: Joi.string().required(),
  mobile_number: Joi.string(),
  total_capacity: Joi.number().required(),
  filled_capacity: Joi.number().required(),
  remainingCapacity: Joi.number().optional(),
  wdra_certificate: Joi.array().optional(),
  wdra_certified: Joi.boolean().optional(),
  Facilities: Joi.array().optional(),
  main_photo: Joi.array().optional(),
  other_photo: Joi.array().optional(),
  manager: Joi.string().custom(isValidObjectId).optional().messages({
    'any.required': 'Manager ID must be a valid ObjectId',
  }),
  Commodity: Joi.array()
    .items(
      Joi.object({
        name: Joi.string().required(),
        AddedBy: Joi.string().custom(isValidObjectId).optional(),
        price_perday: Joi.array().items(
          Joi.object({
            weight: Joi.string().required(),
            price: Joi.number().required(),
          }).required(),
        ),
      }),
    )
    .optional(),
  logo: Joi.string().optional(),
  bank_accounts: Joi.array().optional(),
  isActive: Joi.boolean().optional(),
  isArchived: Joi.boolean().optional(),
}).unknown()

// Validator Function
exports.validateCreateWarehouse = (req, res, next) => {
  const { error } = createWarehouseSchema.validate(req.body)
  if (error) {
    return res.status(400).json({ message: error.details[0].message })
  }
  next()
}
