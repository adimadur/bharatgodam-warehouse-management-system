const dayjs = require('dayjs')
require('dotenv').config()
const { CustomError } = require('../middlewares/errorhandler.middleware')
const Booking = require('../models/Bookingmodel')
const Warehouse = require('../models/warehouse.model')
const { ObjectId } = require('mongoose').Types
const { UserModel } = require('../models/user.model')
const { getDateRange } = require('../utils/date')
const { generateBookingId } = require('../utils/otpGenerator.utils')
const NotificationModel = require('../models/notification.model')

exports.createBooking = async (req, res, next) => {
  try {
    const userId = req.user.userId
    const id = req.params.id

    const {
      mobile_no,
      email,
      productname,
      requestcapacity,
      totalWeight,
      distance,
      distancePrice,
      distanceTotal,
      fromDate,
      toDate,
      items,
      noOfBags,
    } = req.body

    const warehouseData = await Warehouse.findById(id).populate(
      'User Commodity',
    )
    if (!warehouseData) {
      throw new CustomError(`Warehouse not found`)
    }

    const fromDateParsed = dayjs(fromDate)
    const toDateParsed = dayjs(toDate)
    const currentDate = dayjs()

    if (fromDateParsed.isBefore(currentDate, 'day')) {
      throw new CustomError(
        'Booking date cannot be before the current date',
        400,
      )
    }

    const days = toDateParsed.diff(fromDateParsed, 'day') + 1

    let totalBookingPrice = 0

    const bookingItems = items.map((item) => {
      const commodity = warehouseData.Commodity.find(
        (c) => c.name === item.name,
      )
      if (!commodity) {
        throw new CustomError(
          `Commodity with name ${item.name} not found in warehouse`,
          400,
        )
      }

      const priceInfo = commodity.price_perday.find(
        (price) => price.weight === item.weight,
      )
      if (!priceInfo) {
        throw new CustomError(
          `Price for weight ${item.weight} not found for commodity ${item.name}`,
          400,
        )
      }

      const pricePerDay = priceInfo.price
      const quantity = item.quantity

      const total_price = pricePerDay * quantity * days

      totalBookingPrice += total_price

      return {
        commodity: commodity._id,
        name: commodity.name,
        AddedBy: userId,
        price_perday: commodity.price_perday,
        quantity: quantity,
        total_price: total_price,
      }
    })

    const requestedCapacity = parseInt(requestcapacity, 10)
    if (requestedCapacity > warehouseData.remainingCapacity) {
      throw new CustomError(
        'Not enough remaining capacity in the warehouse',
        400,
      )
    }

    const bookingId = generateBookingId()

    const booking = new Booking({
      user: userId,
      bookingId,
      warehouse: id,
      mobile_no,
      email,
      name: warehouseData.warehouse_name,
      productname,
      requestcapacity: parseInt(requestcapacity, 10),
      totalWeight,
      distance,
      distancePrice,
      distanceTotal,
      fromDate: parseInt(dayjs(fromDate).format('YYYYMMDD')),
      fromTime: parseInt(dayjs(fromDate).format('HHmmss')),
      fromTimestamp: dayjs(fromDate).valueOf(),
      toDate: parseInt(dayjs(toDate).format('YYYYMMDD')),
      toTime: parseInt(dayjs(toDate).format('HHmmss')),
      toTimestamp: dayjs(toDate).valueOf(),
      total_price: totalBookingPrice,
      Commodity: bookingItems,
      noOfBags,
      status: userId === warehouseData.User.toString() ? 'Accepted' : 'Pending',
    })

    const savedBooking = await booking.save()
    res
      .status(201)
      .json({ data: savedBooking, message: 'Booking Created Successfully' })
  } catch (err) {
    if (err.name === 'ValidationError') {
      console.error('Validation Error:', err.errors)
    }
    next(err)
  }
}

exports.acceptBooking = async (req, res, next) => {
  try {
    const userId = req.user.userId
    const bookingId = req.params.id

    const booking = await Booking.findById(bookingId)
    if (!booking) {
      throw new CustomError('Booking not found', 400)
    }

    const warehouse = await Warehouse.findById(booking.warehouse)
    if (!warehouse) {
      throw new CustomError('Associated warehouse not found', 400)
    }

    if (booking.isAccepted) {
      throw new CustomError('Booking is already accepted', 400)
    }

    const requestedCapacity = parseInt(booking.requestcapacity, 10)
    if (requestedCapacity > warehouse.remainingCapacity) {
      throw new CustomError(
        'Not enough remaining capacity in the warehouse',
        400,
      )
    }

    warehouse.filled_capacity += requestedCapacity
    warehouse.remainingCapacity -= requestedCapacity
    await warehouse.save()

    booking.isAccepted = true
    booking.isRejected = false
    booking.acceptedBy = userId
    booking.status = 'Accepted'
    const updatedBooking = await booking.save()

    await NotificationModel.create({
      userId: booking.user,
      message: 'Your Booking has been Accepted.',
      type: 'info',
      status: 'sent',
    })

    res
      .status(200)
      .json({ data: updatedBooking, message: 'Booking Accepted Successfully' })
  } catch (error) {
    next(error)
  }
}

exports.rejectBooking = async (req, res, next) => {
  try {
    const userId = req.user.userId
    const bookingId = req.params.id
    const { reasonOfRejected } = req.body
    const booking = await Booking.findById(bookingId)
    if (!booking) {
      throw new CustomError(`Booking not Found`, 400)
    }
    booking.isRejected = true
    booking.isAccepted = false
    booking.rejectedBy = userId
    booking.reasonOfRejected = reasonOfRejected
    booking.status = 'Rejected'
    const updatedBooking = await booking.save()
    res
      .status(200)
      .json({ data: updatedBooking, message: 'Booking Rejected Successfully' })
  } catch (error) {
    next(error)
  }
}

exports.getAllBookings = async (req, res, next) => {
  try {
    const userId = req.user.userId
    const user = await UserModel.findById(userId)
    if (!user) {
      return next(new CustomError('User not found', 404))
    }
    console.log(user.role)

    let bookings = []
    if (user.role === 'manager') {
      const managedWarehouses = user.managedWarehouse.map(
        (warehouse) => warehouse._id,
      )
      bookings = await Booking.find({
        $or: [{ warehouse: { $in: managedWarehouses } }, { user: userId }],
      }).populate('warehouse')
    } else if (user.role === 'Warehouse owner') {
      const ownedWarehouses = user.warehouse.map((warehouse) => warehouse._id)
      bookings = await Booking.find({
        $or: [{ warehouse: { $in: ownedWarehouses } }, { user: userId }],
      }).populate('warehouse')
    } else {
      bookings = await Booking.find({ user: userId }).populate('warehouse')
    }

    const filteredBookings = bookings.filter(
      (booking) => !booking.isDeposited && !booking.isBookingWithdrawn,
    )
    const bookingsWithUserName = filteredBookings.map((booking) => ({
      ...booking._doc,
      userName: `${user.firstName} ${user.lastName}`,
    }))

    res.status(200).json({
      data: bookingsWithUserName,
      message: 'Bookings fetched successfully',
    })
  } catch (err) {
    next(err)
  }
}

exports.getBookingsByWarehouseId = async (req, res, next) => {
  const { warehouseId } = req.params
  if (!warehouseId) {
    throw new CustomError(`Warehouse not Found`, 400)
  }
  try {
    const bookings = await Booking.find({ warehouse: warehouseId }).populate()
    res.status(200).json({
      data: bookings,
      message: 'Bookings by Warehouse Id fetched',
    })
  } catch (error) {
    next(error)
  }
}

exports.getBookingById = async (req, res, next) => {
  const { bookingId } = req.params

  if (!bookingId) {
    throw new CustomError(`Booking is not Found`)
  }

  try {
    const booking = await Booking.findById(bookingId).populate(
      'user warehouse acceptedBy rejectedBy shippingDetails',
    )
    if (!booking) {
      throw new CustomError('booking not found', 404)
    }
    res.status(200).json({
      data: booking,
      message: 'Bookings by boking Id is fetched',
    })
  } catch (error) {
    next(error)
  }
}

exports.createwarehouseBooking = async (req, res, next) => {
  try {
    const userId = req.user.userId
    const { warehouseId } = req.params
    const {
      fromDate,
      toDate,
      commodity,
      weight,
      unit,
      noOfBags,
      bagSize,
      total_price,
      requestcapacity,
    } = req.body

    const warehouseData = await Warehouse.findById(warehouseId)
    if (!warehouseData) {
      throw new CustomError(`Warehouse not found`, 404)
    }
    const commodityExists = warehouseData.Commodity.some(
      (item) => item.name === commodity,
    )
    if (!commodityExists) {
      throw new CustomError('Commodity not found in the warehouse', 404)
    }

    const requestedCapacity = parseInt(requestcapacity, 10)
    if (isNaN(requestedCapacity)) {
      throw new CustomError('Invalid requested capacity', 400)
    }

    if (requestedCapacity > warehouseData.remainingCapacity) {
      throw new CustomError(
        'Not enough remaining capacity in the warehouse',
        400,
      )
    }

    const bookingId = generateBookingId()

    const booking = new Booking({
      total_price: total_price,
      bookingId,
      user: userId,
      warehouse: warehouseId,
      fromDate,
      toDate,
      totalWeight: weight,
      Commodity: [
        {
          name: commodity,
          AddedBy: userId,
          price_perday: {
            weight: weight.toString() + unit,
            price: warehouseData.Commodity.find(
              (item) => item.name === commodity,
            ).price,
          },
        },
      ],
      noOfBags,
      bagSize,
      bookedBy: 'Farmer',
      requestcapacity,
    })
    await booking.save()

    warehouseData.remainingCapacity -= requestedCapacity
    await warehouseData.save()

    await NotificationModel.create({
      userId: userId,
      message: 'Booking request has sent to Warehouse.',
      type: 'info',
      status: 'sent',
    })

    return res
      .status(200)
      .json({ data: booking, message: 'Booking placed successfully' })
  } catch (err) {
    next(err)
  }
}

exports.cancelBooking = async (req, res, next) => {
  try {
    const { bookingId } = req.params
    const { reason } = req.body
    const booking = await Booking.findById(bookingId)
    booking.status = 'Cancelled'
    booking.reasonOfRejected.push(reason)
    await booking.save()
    return res
      .status(200)
      .json({ data: booking, message: 'Cancelled booking successfully' })
  } catch (error) {
    next(error)
  }
}

exports.getAllFarmerBookings = async (req, res, next) => {
  try {
    const booking = await Booking.find({ bookedBy: 'Farmer' }).populate(
      'warehouse',
    )
    return res.status(200).json({
      data: booking,
      message: 'All warehouse booking fetched successfully',
    })
  } catch (error) {
    next(error)
  }
}

exports.getRejectedBookingCounts = async (req, res, next) => {
  try {
    const userId = req.user.userId
    const userRole = req.user.role
    console.log(userRole)
    const { filter } = req.query
    const { from, to } = getDateRange(filter)
    let query = {
      status: 'Rejected',
      createdAt: { $gte: from, $lte: to },
    }
    if (userRole === 'Warehouse owner' || userRole === 'Farmer') {
      query.user = userId
    } else if (userRole === 'manager') {
      const user = await UserModel.findById(userId).populate('managedWarehouse')
      const managedWarehouseIds = user.managedWarehouse.map(
        (warehouse) => warehouse._id,
      )
      query.$or = [
        { user: userId },
        { warehouse: { $in: managedWarehouseIds } },
      ]
    }
    console.log(query)
    const count = await Booking.countDocuments(query)
    res.status(200).json({ data: count })
  } catch (err) {
    next(err)
  }
}

exports.getAcceptedBookingCounts = async (req, res, next) => {
  try {
    const userId = req.user.userId
    const userRole = req.user.role
    const { filter } = req.query
    const { from, to } = getDateRange(filter)
    let query = {
      status: 'Accepted',
      createdAt: { $gte: from, $lte: to },
    }

    if (userRole === 'Warehouse owner' || userRole === 'Farmer') {
      query.user = userId
    } else if (userRole === 'manager') {
      const user = await UserModel.findById(userId).populate('managedWarehouse')
      const managedWarehouseIds = user.managedWarehouse.map(
        (warehouse) => warehouse._id,
      )
      query.$or = [
        { user: userId },
        { warehouse: { $in: managedWarehouseIds } },
      ]
    }

    const count = await Booking.countDocuments(query)
    res.status(200).json({ data: count })
  } catch (err) {
    next(err)
  }
}

exports.getAllBookingCounts = async (req, res, next) => {
  try {
    const userId = req.user.userId
    const userRole = req.user.role
    const { filter } = req.query
    const { from, to } = getDateRange(filter)
    let query = {
      createdAt: { $gte: from, $lte: to },
    }
    if (userRole === 'Warehouse owner' || userRole === 'Farmer') {
      query.user = userId
    } else if (userRole === 'manager') {
      const user = await UserModel.findById(userId).populate('managedWarehouse')
      const managedWarehouseIds = user.managedWarehouse.map(
        (warehouse) => warehouse._id,
      )
      query.$or = [
        { user: userId },
        { warehouse: { $in: managedWarehouseIds } },
      ]
    }
    const count = await Booking.countDocuments(query)
    res.status(200).json({ data: count })
  } catch (err) {
    next(err)
  }
}

exports.getPendingBookingCounts = async (req, res, next) => {
  try {
    const userId = req.user.userId
    const userRole = req.user.role
    const { filter } = req.query
    const { from, to } = getDateRange(filter)
    let query = {
      status: 'Pending',
      createdAt: { $gte: from, $lte: to },
    }
    if (userRole === 'Warehouse owner' || userRole === 'Farmer') {
      query.user = userId
    } else if (userRole === 'manager') {
      const user = await UserModel.findById(userId).populate('managedWarehouse')
      const managedWarehouseIds = user.managedWarehouse.map(
        (warehouse) => warehouse._id,
      )
      query.$or = [
        { user: userId },
        { warehouse: { $in: managedWarehouseIds } },
      ]
    }
    console.log(query)
    const count = await Booking.countDocuments(query)
    res.status(200).json({ data: count })
  } catch (err) {
    next(err)
  }
}

exports.getTotalGoods = async (req, res, next) => {
  try {
    const userId = req.user.userId
    const userRole = req.user.role
    const userObjectId = new ObjectId(userId)

    const { filter } = req.query

    const { from, to } = getDateRange(filter)
    let matchQuery = {
      createdAt: { $gte: from, $lte: to },
    }
    if (userRole === 'Warehouse owner' || userRole === 'Farmer') {
      matchQuery.user = userObjectId
    } else if (userRole === 'manager') {
      const user = await UserModel.findById(userId).populate('managedWarehouse')
      const managedWarehouseIds = user.managedWarehouse.map(
        (warehouse) => warehouse._id,
      )
      matchQuery.$or = [
        { user: userObjectId },
        { warehouse: { $in: managedWarehouseIds } },
      ]
    }

    const bookingExists = await Booking.exists({ user: userObjectId })
    if (!bookingExists) {
      res.status(200).json({
        data: 0,
        message: '`No bookings found for user ID: ${userId}`',
      })
      return
    }

    const result = await Booking.aggregate([
      {
        $match: matchQuery,
      },
      {
        $group: {
          _id: null,
          totalWeightSum: { $sum: '$totalWeight' },
        },
      },
    ])

    const totalWeightSum = result.length > 0 ? result[0].totalWeightSum : 0

    res.status(200).json({ data: totalWeightSum })
  } catch (err) {
    next(err)
  }
}

exports.GetCurrentBookings = async (req, res, next) => {
  try {
    const userId = req.user.userId
    const userRole = req.user.role
    const { filter } = req.query
    const { from, to } = getDateRange(filter)
    let query = {
      status: 'Accepted',
      isBookingWithdrawn: false,
      createdAt: { $gte: from, $lte: to },
    }
    if (userRole === 'Warehouse owner' || userRole === 'Farmer') {
      query.user = new ObjectId(userId)
    } else if (userRole === 'manager') {
      const user = await UserModel.findById(userId).populate('managedWarehouse')
      const managedWarehouseIds = user.managedWarehouse.map(
        (warehouse) => warehouse._id,
      )
      query.$or = [
        { user: new ObjectId(userId) },
        { warehouse: { $in: managedWarehouseIds } },
      ]
    }
    const count = await Booking.countDocuments(query)

    res.status(200).json({ data: count })
  } catch (error) {
    next(error)
  }
}

exports.getAllBookingsOfWarehousesOwnedByOwner = async (req, res, next) => {
  try {
    const userId = req.user.userId

    const user = await UserModel.findById(userId).populate('warehouse', '_id')
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    const warehouseIds = user.warehouse.map((warehouse) => warehouse._id)

    if (warehouseIds.length === 0) {
      return res
        .status(404)
        .json({ message: 'No warehouses found for this user' })
    }

    const bookings = await Booking.find({
      warehouse: { $in: warehouseIds },
    })
      .populate('warehouse', 'warehouse_name')
      .populate('user', 'name email')

    if (bookings.length === 0) {
      return res
        .status(404)
        .json({ message: 'No bookings found for the owned warehouses' })
    }

    res.status(200).json({
      data: bookings,
      message: 'Bookings retrieved successfully',
    })
  } catch (error) {
    next(error)
  }
}

exports.getBookingByWarehouseObjectId = async (req, res, next) => {
  try {
    const warehouseId = req.params.warehouseid

    const bookings = await Booking.find(
      { warehouse: warehouseId },
      'fromDate fromTime fromTimestamp toDate toTime toTimestamp isBookingWithdrawn isBookingDeposited totalWeight noOfBags bagSize',
    )

    if (bookings.length === 0) {
      return res.status(404).json({ message: 'No Bookings found' })
    }

    return res.status(200).json({
      message: 'Booking Details Fetched successfully',
      data: bookings,
    })
  } catch (error) {
    next(error)
  }
}

// For fetching via Notification (from front-end)
exports.getGradeDetailsByBookingId = async (req, res, next) => {
  const { bookingId } = req.params

  try {
    const booking = await Booking.findOne({ bookingId }).populate(
      'gradeDetails',
    )

    if (!booking) {
      throw new CustomError('Booking not found', 404)
    }

    res.status(200).json({
      bookingId: booking.bookingId,
      gradeDetails: booking.gradeDetails,
    })
  } catch (error) {
    next(error)
  }
}

exports.fetchBookingByBookingId = async (req, res, next) => {
  try {
    const findBooking = await Booking.findOne({
      bookingId: req.query.bookingId,
    }).populate('warehouse user')

    if (!findBooking) {
      throw new CustomError('booking not found', 404)
    }

    res.status(200).json({ data: findBooking })
  } catch (error) {
    next(error)
  }
}

exports.Bookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find({user: req.user.userId})
      .populate('user')
      .populate('warehouse')
    if (!bookings || bookings.length === 0) {
      throw new CustomError('Bookings not found', 404)
    }

    res.status(200).json({
      message: 'Bookings fetched successfully',
      data: bookings,
    })
  } catch (error) {
    next(error)
  }
}
