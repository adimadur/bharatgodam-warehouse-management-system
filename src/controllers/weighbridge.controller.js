const { CustomError } = require('../middlewares/errorhandler.middleware')

const BookingModel = require('../models/Bookingmodel')
const shippingModule = require('../models/shipping.model')

const WarehouseModel = require('../models/warehouse.model')

const weightBridgeModel = require('../models/weighbridge.model')

const dayjs = require('dayjs')

exports.addWeighBridgeData = async (req, res, next) => {
  try {
    const {
      booking_id,
      today_date,
      time,
      gross_weight,
      gross_weight_unit,
      tore_weight,
      tore_weight_unit,
      truck_number,
      driver_name,
    } = req.body

    const netWeight = parseFloat(gross_weight) - parseFloat(tore_weight)

    const findBookingId = await BookingModel.findById({
      _id: booking_id,
    }).populate('warehouse', 'items')
    if (!findBookingId) {
      throw new CustomError('booking Id not found', 404)
    }

    if (netWeight > findBookingId.totalWeight) {
      throw new CustomError(
        'Weighbridge weight should match total weight of the booking',
        400,
      )
    }

    const bookingDate = dayjs(String(findBookingId.fromDate))
    const weighbridgeDate = dayjs(String(today_date))
    const sevenDaysAfterBooking = bookingDate.add(7, 'day')

    if (weighbridgeDate.isBefore(bookingDate)) {
      throw new CustomError(
        'Weighbridge date cannot be before the booking date',
        400,
      )
    }
    if (weighbridgeDate.isAfter(sevenDaysAfterBooking)) {
      throw new CustomError(
        'Weighbridge date cannot be more than 7 days after the booking date',
        400,
      )
    }

    if (findBookingId.isBookingWeighbridgeAdded === false) {
      const weighbridgeData = {
        User: req.user.userId,
        booking_id,
        today_date,
        time,
        gross_weight,
        gross_weight_unit,
        tore_weight,
        tore_weight_unit,
        net_weight: netWeight,
        net_weight_unit: 'MT',
        truck_number,
        driver_name,
      }

      findBookingId.isBookingWeighbridgeAdded = true
      findBookingId.isItemInWarehouse = true
      await findBookingId.save()

      const createWeighbridge = new weightBridgeModel(weighbridgeData)
      const savedWeighbridge = await createWeighbridge.save()

      findBookingId.isBookingWeighbridgeAdded = true
      findBookingId.weighbridgeId = savedWeighbridge._id

      if (findBookingId.isBookingWithdrawn === true) {
        findBookingId.isItemInWarehouse = false
      }
      await findBookingId.save()

      res.status(200).json({
        data: createWeighbridge,
        message: 'weighbridge created successful',
      })
    } else {
      throw new CustomError(
        'Weighbridge Data already added for this booking Id',
        400,
      )
    }
  } catch (error) {
    next(error)
  }
}

exports.getWeighbridgeDataById = async (req, res, next) => {
  try {
    const userId = req.user.userId

    const Id = req.params.id

    const findWeighBridge = await weightBridgeModel.findById({
      User: userId,
      _id: Id,
    })

    if (!findWeighBridge) {
      throw new CustomError('Weighbridge not found', 404)
    }

    const findBooking = await BookingModel.findById(
      findWeighBridge.booking_id._id,
    )

    const findWareHouse = await WarehouseModel.findById({
      _id: findBooking.warehouse,
    })

    res.status(200).json({
      weighbridgeData: findWeighBridge,
      booking: findBooking,
      warehouse: findWareHouse,
      message: 'Weighbridge fetched successfully',
    })
  } catch (error) {
    next(error)
  }
}

exports.fetchAllWeighBridge = async (req, res, next) => {
  try {
    const userId = req.user.userId

    const findWeighBridge = await weightBridgeModel
      .find({ User: userId })
      .populate('booking_id')

    res.status(200).json({
      data: findWeighBridge,
      message: 'weighbridge fetched successfully',
    })
  } catch (error) {
    next(error)
  }
}

exports.updateWeighBridge = async (req, res, next) => {
  try {
    const userId = req.user.userId
    const Id = req.params.id
    const body = {
      booking_id: req.body.booking_id,
      today_date: req.body.today_date,
      time: req.body.time,
      gross_weight: req.body.gross_weight,
      gross_weight_unit: req.body.gross_weight_unit,
      tore_weight: req.body.tore_weight,
      tore_weight_unit: req.body.tore_weight_unit,
      truck_number: req.body.truck_number,
      driver_name: req.body.driver_name,
    }
    const updateWeighBridge = await weightBridgeModel.findByIdAndUpdate(
      Id,
      body,
      { new: true },
    )
    updateWeighBridge.User = userId
    await updateWeighBridge.save()
    if (!updateWeighBridge) {
      throw new CustomError('weighbridge not found!', 404)
    }
    res.status(200).json({
      data: updateWeighBridge,
      message: 'weighbridge updated successfully',
    })
  } catch (error) {
    next(error)
  }
}

exports.deleteWeighBridge = async (req, res, next) => {
  try {
    const Id = req.params.id

    const deletedWeighBridge = await weightBridgeModel.findByIdAndDelete(Id)

    if (!deletedWeighBridge) {
      throw new CustomError('Weighbridge not found!', 404)
    }

    res.status(200).json({
      data: deletedWeighBridge,
      message: 'Weighbridge deleted successfully',
    })
  } catch (error) {
    next(error)
  }
}
