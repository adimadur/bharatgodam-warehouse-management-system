const jwt = require('jsonwebtoken')
const { CustomError } = require('../middlewares/errorhandler.middleware')
require('dotenv').config()
const secretKey = process.env.JWT_SECRET

const authorizeUser = (allowedRoles) => {
  return (req, res, next) => {
    try {
      const authHeader = req.headers.authorization
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new CustomError(
          'Authorization token not found or incorrect format',
          401,
        )
      }

      const token = authHeader.split(' ')[1]
      const decoded = jwt.verify(token, secretKey)
      const { role, _id: userId } = decoded.data

      if (!allowedRoles.includes(role)) {
        throw new CustomError('Unauthorized access', 403)
      }

      req.user = { userId, role }
      next()
    } catch (error) {
      next(error)
    }
  }
}

module.exports = authorizeUser
