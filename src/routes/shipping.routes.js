const express = require('express')

const shippingController = require('../controllers/shipping.controller')

const authorizeUser = require('../middlewares/roleMiddleware')
const {
  validateAddShipping,
  validateGetShippingById,
  validateGetWithdrawalId,
  validateUpdateShipping,
  validateGetShippingByWithdrawalId,
} = require('../validators/shipping.validator')

const ShippingRouter = express.Router()

/**
 * @url /api/shipping
 */

//ML API
ShippingRouter.get(
  '/fetch-all',
  authorizeUser(['Warehouse owner', 'admin', 'manager', 'Farmer']),
  shippingController.fetchAllDetails,
)

//Live Feed
ShippingRouter.get(
  '/live-feed',
  authorizeUser(['Warehouse owner', 'admin', 'manager', 'Farmer']),
  shippingController.LiveFeed,
)

ShippingRouter.post(
  '/:warehouseId/:bookingId',
  authorizeUser(['Warehouse owner', 'admin', 'manager', 'Farmer']),
  validateAddShipping,
  shippingController.addShipping,
)

ShippingRouter.post('/send-otp', shippingController.sendOtpToFarmer)

ShippingRouter.post('/verify-otp', shippingController.verifyOtp)

//getAllWithdrawl data
ShippingRouter.get('/getWithdrawl', shippingController.getAllWithDrawlData)

ShippingRouter.get(
  '/shipping/:id',
  validateGetShippingById,
  shippingController.getShippingById,
)
ShippingRouter.get(
  '/:id/withdrawlid',
  validateGetWithdrawalId,
  shippingController.getWithdrawlId,
)

ShippingRouter.get(
  '/:withdrawlId',
  validateGetShippingByWithdrawalId,
  shippingController.getShippingByWithdrawlId,
)

//ML API
ShippingRouter.post(
  '/fetch-booking',
  authorizeUser(['Warehouse owner', 'admin', 'manager', 'Farmer']),
  shippingController.readRecordByBookingId,
)

//ML_API
ShippingRouter.post(
  '/fetch-withdrwal',
  authorizeUser(['Warehouse owner', 'admin', 'manager', 'Farmer']),
  shippingController.readRecordByWithdrawalId,
)

ShippingRouter.put(
  '/update/:id',
  validateUpdateShipping,
  shippingController.updateShipping,
)

module.exports = ShippingRouter

// withdrawal template mail
