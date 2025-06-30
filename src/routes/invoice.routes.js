const express = require('express')

const InvoiceController = require('../controllers/invoice.controller')

const authorizeUser = require('../middlewares/roleMiddleware')

const InvoiceRouter = express.Router()

InvoiceRouter.post(
  '/onboard',
  authorizeUser(['Warehouse owner', 'admin', 'manager', 'Farmer']),
  InvoiceController.addInvoice,
)

InvoiceRouter.post(
  '/bill',
  authorizeUser(['Warehouse owner', 'admin', 'manager', 'Farmer']),
  InvoiceController.generateBill,
)

InvoiceRouter.patch(
  '/mark/:id',
  authorizeUser(['Warehouse owner', 'admin', 'manager', 'Farmer']),
  InvoiceController.markInvoicePaidOrSendRemained,
)

InvoiceRouter.get(
  '/fetch-all',
  authorizeUser(['Warehouse owner', 'admin', 'manager', 'Farmer']),
  InvoiceController.fetchInvoices,
)

InvoiceRouter.get(
  '/fetchOne/:Id',
  authorizeUser(['Warehouse owner', 'admin', 'manager', 'Farmer']),
  InvoiceController.fetchOneInvoice,
)

InvoiceRouter.get(
  '/fetch-invoice-bill',
  authorizeUser(['Warehouse owner', 'admin', 'manager', 'Farmer']),
  InvoiceController.fetchBillsAndInvoices,
)

InvoiceRouter.get(
  '/farmer-invoices',
  authorizeUser(['Warehouse owner', 'Farmer', 'manager', 'admin', 'Farmer']),
  InvoiceController.fetchInvoicesOfFarmer,
)

InvoiceRouter.get(
  '/farmer-bills',
  authorizeUser(['Warehouse owner', 'Farmer', 'manager', 'admin', 'Farmer']),
  InvoiceController.fetchBillsOfFarmer,
)

module.exports = InvoiceRouter
