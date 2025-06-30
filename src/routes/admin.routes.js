const express = require('express')

const multer = require('multer')

const upload = multer({ dest: 'uploads/' })

const adminController = require('../controllers/admin.controller')

const authorizeUser = require('../middlewares/roleMiddleware')

const AdminRouter = express.Router()

AdminRouter.post(
  '/verify-kyc',
  authorizeUser(['admin']),
  adminController.verifyKycController,
)

AdminRouter.post(
  '/bulk-upload',
  upload.single('file'),
  adminController.bulkUploadWarehouses,
)

AdminRouter.get(
  '/all-kyc',
  authorizeUser(['admin']),
  adminController.getAllKycDocuments,
)

AdminRouter.get(
  '/getAll/users',
  authorizeUser(['admin']),
  adminController.getUsersWithNonAdminRole,
)

AdminRouter.get(
  '/fetchAll-warehouses',
  authorizeUser(['admin']),
  adminController.getAllWarehousesByAdmin,
)

AdminRouter.get(
  '/fetchAll-capacity',
  authorizeUser(['Warehouse owner', 'admin', 'manager']),
  adminController.getTotalCapacitiesAndRemainingCapacities,
)

AdminRouter.get(
  '/get-Userlist',
  authorizeUser(['Warehouse owner', 'admin', 'manager']),
  adminController.getCountsByRole,
)

AdminRouter.get(
  '/fetch-futureBookings',
  authorizeUser(['admin']),
  adminController.getAllFutureBookings,
)

AdminRouter.delete(
  '/delete/:userId',
  authorizeUser(['admin']),
  adminController.deleteUserByAdmin,
)

AdminRouter.post('/bank', authorizeUser(['admin']), adminController.addBank)

AdminRouter.get(
  '/all-bank-users',
  authorizeUser(['admin']),
  adminController.fetchAllBankUsers,
)

AdminRouter.put(
  '/add-bank-user/:bankId',
  authorizeUser(['admin']),
  adminController.addBankUser,
)

AdminRouter.get(
  '/get-all-bookings',
  authorizeUser(['admin']),
  adminController.getAllBookings,
)

AdminRouter.post(
  '/add-warehouse',
  authorizeUser(['admin']),
  adminController.addWarehouse,
)

AdminRouter.get(
  '/get-all-banks',
  authorizeUser(['Warehouse owner', 'admin', 'manager', 'Farmer']),
  adminController.fetchAllBanks,
)

AdminRouter.post(
  '/single-upload/:warehouseId',
  upload.single('file'),
  adminController.updateWarehouseFromCsv,
)

AdminRouter.post(
  '/user-upload',
  upload.single('file'),
  adminController.bulkUploadUsers,
)

AdminRouter.put(
  '/update-bank-status',
  authorizeUser(['Warehouse owner', 'admin', 'manager', 'Farmer']),
  adminController.updatebankStatus,
)

AdminRouter.get(
  '/post-harvest-loan',
  authorizeUser(['Warehouse owner', 'admin', 'manager', 'Farmer']),
  adminController.postHarvestLoan,
)

module.exports = AdminRouter
