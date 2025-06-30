const express = require('express')

const loanController = require('../controllers/loan.controller')
const authorizeUser = require('../middlewares/roleMiddleware')

const loanRouter = express.Router()

/**
 * @url /api/loan
 */

loanRouter.post(
  '/apply',
  authorizeUser(['Warehouse owner', 'admin', 'manager', 'Farmer']),
  loanController.applyforLoan,
)

loanRouter.get(
  '/get-loan-status',
  authorizeUser(['Warehouse owner', 'admin', 'manager', 'Farmer', 'Pledge']),
  loanController.getUserLoanStatus,
)

loanRouter.get(
  '/get-loan-summary',
  authorizeUser(['Warehouse owner', 'admin', 'manager', 'Farmer', 'Pledge']),
  loanController.getLoanSummary,
)

loanRouter.get(
  '/all-loans',
  authorizeUser(['Warehouse owner', 'admin', 'manager', 'Farmer', 'Pledge']),
  loanController.getAllLoanDetails,
)

loanRouter.get(
  '/request-loans',
  authorizeUser(['Warehouse owner', 'admin', 'manager', 'Farmer', 'Pledge']),
  loanController.fetchLoanRequests,
)

loanRouter.put(
  '/accept-loan/:loanId',
  authorizeUser(['Warehouse owner', 'admin', 'manager', 'Farmer', 'Pledge']),
  loanController.acceptLoan,
)

loanRouter.put(
  '/reject-loan/:loanId',
  authorizeUser(['Warehouse owner', 'admin', 'manager', 'Farmer', 'Pledge']),
  loanController.rejectLoan,
)

loanRouter.get(
  '/get-bank-user-details',
  authorizeUser(['Warehouse owner', 'admin', 'manager', 'Pledge']),
  loanController.bankUserDetails,
)

module.exports = loanRouter
