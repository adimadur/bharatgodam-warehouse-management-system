// deposit.routes.js
const express = require('express')

const depositController = require('../controllers/deposit.controller')

const authorizeUser = require('../middlewares/roleMiddleware')
const {
  validateAddDeposit,
  validateGetDepositByBookingId,
  validateGetDepositById,
} = require('../validators/deposit.validator')

const depositRouter = express.Router()

depositRouter.post(
  '/add',
  authorizeUser(['Warehouse owner', 'admin', 'manager']),
  validateAddDeposit,
  depositController.addDeposit,
)

depositRouter.get(
  '/',
  authorizeUser(['Warehouse owner', 'admin', 'manager']),
  depositController.getAllDeposit,
)

depositRouter.get(
  '/farmer',
  authorizeUser(['Farmer']),
  depositController.getAllDepositsForBooking,
)

depositRouter.get(
  '/booking/:bookingId',
  validateGetDepositByBookingId,
  depositController.getDepositByBookingId,
)

depositRouter.get(
  '/:depositId',
  validateGetDepositById,
  depositController.getDepositById,
)

depositRouter.get('/status/:status', depositController.getDepositbyStatus)

// Get Transactions (ID - 10)
depositRouter.get(
  '/transactions/get-transactions',
  authorizeUser(['Warehouse owner', 'admin', 'manager']),
  depositController.getTransactionDetails,
)

depositRouter.post(
  '/upload-images/:depositId',
  authorizeUser(['Warehouse owner', 'admin', 'manager']),
  depositController.uploadImagesForDeposit,  
)

module.exports = depositRouter
