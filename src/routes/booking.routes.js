const express = require('express')

const bookingController = require('../controllers/booking.controller')

const authorizeUser = require('../middlewares/roleMiddleware')
const {
  validateCreateBooking,
  validateAcceptBooking,
  validateRejectBooking,
  validateGetBookingsByWarehouseId,
  validateGetBookingById,
} = require('../validators/booking.validator')

/**
 * @url /api/booking
 */

const bookingRouter = express.Router()

bookingRouter.post(
  '/create/:id',
  authorizeUser(['Warehouse owner', 'admin', 'manager']),
  validateCreateBooking,
  bookingController.createBooking,
)

bookingRouter.put(
  '/:id/accept',
  authorizeUser(['Warehouse owner', 'admin', 'manager']),
  validateAcceptBooking,
  bookingController.acceptBooking,
)

bookingRouter.put(
  '/:id/reject',
  authorizeUser(['Warehouse owner', 'admin', 'manager']),
  validateRejectBooking,
  bookingController.rejectBooking,
)

bookingRouter.get(
  '/',
  authorizeUser(['Warehouse owner', 'admin', 'manager', 'Farmer']),
  bookingController.getAllBookings,
)

bookingRouter.get(
  '/owner-warehouses/all-bookings',
  authorizeUser(['Warehouse owner', 'admin', 'manager']),
  bookingController.getAllBookingsOfWarehousesOwnedByOwner,
)

bookingRouter.get(
  '/warehouse/:warehouseId',
  validateGetBookingsByWarehouseId,
  bookingController.getBookingsByWarehouseId,
)

bookingRouter.get(
  '/booking/:bookingId',
  validateGetBookingById,
  bookingController.getBookingById,
)

bookingRouter.post(
  '/farmer/:warehouseId',
  authorizeUser(['Warehouse owner', 'admin', 'manager', 'Farmer']),
  bookingController.createwarehouseBooking,
)

bookingRouter.post('/cancel/:bookingId', bookingController.cancelBooking)

bookingRouter.get(
  '/farmer/allData',
  authorizeUser(['Warehouse owner', 'admin', 'manager']),
  bookingController.getAllFarmerBookings,
)

bookingRouter.get(
  '/rejected-count',
  authorizeUser(['Warehouse owner', 'admin', 'manager', 'Farmer']),
  bookingController.getRejectedBookingCounts,
)

bookingRouter.get(
  '/accepted-count',
  authorizeUser(['Warehouse owner', 'admin', 'manager', 'Farmer']),
  bookingController.getAcceptedBookingCounts,
)

bookingRouter.get(
  '/total-booking/count',
  authorizeUser(['Warehouse owner', 'admin', 'manager', 'Farmer']),
  bookingController.getAllBookingCounts,
)

bookingRouter.get(
  '/pending-count',
  authorizeUser(['Warehouse owner', 'admin', 'manager', 'Farmer']),
  bookingController.getPendingBookingCounts,
)

bookingRouter.get(
  '/totalGoods-count',
  authorizeUser(['Warehouse owner', 'admin', 'manager', 'Farmer']),
  bookingController.getTotalGoods,
)

bookingRouter.get(
  '/current-booking/count',
  authorizeUser(['Warehouse owner', 'admin', 'manager', 'Farmer']),
  bookingController.GetCurrentBookings,
)

bookingRouter.get(
  '/get/booking/:warehouseid',
  authorizeUser(['Warehouse owner', 'admin', 'manager']),
  bookingController.getBookingByWarehouseObjectId,
)

bookingRouter.get(
  '/grade-by-booking/:bookingId',
  authorizeUser(['Warehouse owner', 'admin', 'manager']),
  bookingController.getGradeDetailsByBookingId,
)

bookingRouter.get(
  '/bookingId',
  authorizeUser(['Warehouse owner', 'admin', 'manager']),
  bookingController.fetchBookingByBookingId,
)

bookingRouter.get(
  '/all-bookings',
  authorizeUser(['Warehouse owner', 'admin', 'manager']),
  bookingController.Bookings,
)

module.exports = bookingRouter
