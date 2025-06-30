const joi = require('joi')

const signupWithPhoneSchema = joi.object({ phone: joi.number().required() })

exports.validateSignUpWithPhone = (req, res, next) => {
  const { error } = signupWithPhoneSchema.validate(req.body)
  if (error) {
    return res.status(400).json({ message: error.details[0].message })
  }
  next()
}

const signupWithEmailSchema = joi
  .object({ email: joi.string().email().required() })
  .unknown()

exports.validateSignUpWithEmail = (req, res, next) => {
  const { error } = signupWithEmailSchema.validate(req.body)
  if (error) {
    return res.status(400).json({ message: error.details[0].message })
  }
  next()
}

const otpSchema = joi
  .object({
    otp: joi.number().required(),
  })
  .unknown()

exports.validateOtp = (req, res, next) => {
  const { error } = otpSchema.validate(req.body)
  if (error) {
    return res.status(400).json({ message: error.details[0].message })
  }
  next()
}
