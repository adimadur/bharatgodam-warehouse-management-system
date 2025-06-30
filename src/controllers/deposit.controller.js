const DepositModel = require('../models/DepositModel')
const Warehouse = require('../models/warehouse.model')
const Booking = require('../models/Bookingmodel')
const { CustomError } = require('../middlewares/errorhandler.middleware')
const BookingModel = require('../models/Bookingmodel')
const { UserModel } = require('../models/user.model')
const dayjs = require('dayjs')
const weightBridgeModel = require('../models/weighbridge.model')

exports.addDeposit = async (req, res, next) => {
  try {
    const userId = req.user.userId
    const {
      bookingId,
      depositDate,
      slotNumber,
      revalidationDate,
      expiraryDate,
      commodityType,
      commodityName,
    } = req.body

    if (!bookingId) {
      throw new CustomError('Please Enter booking Id', 400)
    }

    const BookingData = await Booking.findById(bookingId)
    if (!BookingData) {
      throw new CustomError('Booking not found', 404)
    }

    const weighbridgeData = await weightBridgeModel.findOne({
      booking_id: bookingId,
    })
    if (!weighbridgeData) {
      throw new CustomError('Weighbridge data not found for this booking', 400)
    }

    const bookingDate = dayjs(String(BookingData.fromDate))
    const currentDate = dayjs()
    const sevenDaysAfterBooking = bookingDate.add(7, 'day')

    if (currentDate.isAfter(sevenDaysAfterBooking)) {
      BookingData.status = 'Expired'
      await BookingData.save()
      throw new CustomError('Booking has expired', 400)
    }

    if (BookingData.isBookingDeposited === false) {
      const WarehouseData = await Warehouse.findById(BookingData.warehouse)

      if (!WarehouseData) {
        throw new CustomError('Warehouse not found', 404)
      }

      if (
        dayjs(String(depositDate)).isSame(
          dayjs(String(weighbridgeData.today_date)),
        )
      ) {
        if (
          commodityType === 'non-exchangeCommodity' &&
          (!revalidationDate || !expiraryDate)
        ) {
          throw new CustomError(
            'Revalidation date and Expiry date must be provided for non-exchangeCommodity',
            400,
          )
        }

        if (revalidationDate && expiraryDate) {
          const depositDateObj = dayjs(depositDate)
          const revalidationDateObj = dayjs(revalidationDate)
          const expiraryDateObj = dayjs(expiraryDate)

          if (
            revalidationDateObj.isBefore(depositDateObj) ||
            revalidationDateObj.isAfter(expiraryDateObj)
          ) {
            throw new CustomError(
              'Revalidation date must be within deposit date and expiry date',
              400,
            )
          }
        }

        const newDeposit = new DepositModel({
          User: userId,
          bookingId,
          depositDate,
          slotNumber,
          revalidationDate,
          expiraryDate,
          commodityType,
          commodityName,
          warehouseName: WarehouseData.warehouse_name,
          totalWeight: BookingData.totalWeight,
          totalAmount: BookingData.total_price,
        })

        const savedDeposit = await newDeposit.save()

        BookingData.isBookingDeposited = true
        BookingData.depositId = savedDeposit._id
        await BookingData.save()
        return res
          .status(200)
          .json({ data: savedDeposit, message: 'Deposit Added Successfully' })
      } else {
        throw new CustomError(
          'Deposit date must match the weighbridge date',
          400,
        )
      }
    } else {
      throw new CustomError('Booking already deposited', 400)
    }
  } catch (error) {
    console.log(error)
    next(error)
  }
}

exports.getAllDeposit = async (req, res, next) => {
  try {
    const userId = req.user.userId
    const user = await UserModel.findById(userId)
    if (!user) {
      return new CustomError('User not found', 404)
    }
    let deposits = []
    if (user.role === 'manager') {
      const managedWarehouses = user.managedWarehouse.map(
        (warehouse) => warehouse._id,
      )
      const bookings = await Booking.find({
        $or: [{ warehouse: { $in: managedWarehouses } }, { user: userId }],
      }).populate('warehouse')

      const bookingIds = bookings.map((booking) => booking._id)

      deposits = await DepositModel.find({
        bookingId: { $in: bookingIds },
      }).populate('bookingId')
    } else {
      deposits = await DepositModel.find({ User: userId }).populate('bookingId')
    }
    const filteredDeposits = []
    for (const deposit of deposits) {
      const booking = await BookingModel.findById(deposit.bookingId)
      if (booking && !booking.isBookingWithdrawn) {
        filteredDeposits.push(deposit)
      }
    }
    return res.status(200).json({
      data: filteredDeposits,
      message: 'Deposit Data Fetched Successfully',
    })
  } catch (error) {
    next(error)
  }
}

exports.getAllDepositsForBooking = async (req, res, next) => {
  try {
    const userId = req.user.userId

    const bookings = await BookingModel.find({ user: userId })

    if (!bookings || bookings.length === 0) {
      return res
        .status(404)
        .json({ message: 'No bookings found for this user.' })
    }

    const bookingIds = bookings.map((booking) => booking._id)

    const deposits = await DepositModel.find({
      bookingId: { $in: bookingIds },
    }).populate('bookingId')

    res.status(200).json({
      data: deposits,
      message: 'Deposit data fetched successfully.',
    })
  } catch (error) {
    next(error)
  }
}

exports.getDepositByBookingId = async (req, res, next) => {
  try {
    const { bookingId } = req.params
    if (!bookingId) {
      throw CustomError('Enter the BookingId', 400)
    }
    const deposit = await DepositModel.find({ bookingId: bookingId })
    return res
      .status(200)
      .json({ data: deposit, message: 'Deposits by BookingID' })
  } catch (error) {
    next(error)
  }
}
exports.getDepositById = async (req, res, next) => {
  try {
    const { depositId } = req.params
    if (!depositId) {
      throw new CustomError('Please enter the deposit id', 400)
    }
    const deposit = await DepositModel.findById(depositId)
    return res
      .status(200)
      .json({ data: deposit, message: 'Deposit by id fetched Successfully' })
  } catch (error) {
    next(error)
  }
}

exports.getDepositbyStatus = async (req, res, next) => {
  try {
    const { status } = req.params

    const deposits = await DepositModel.aggregate([{ $match: { status } }])
    return res.status(200).json({
      data: deposits,
      message: 'Status Deposit Data Fetched Successfully',
    })
  } catch (error) {
    next(error)
  }
}

// Get Transactions (ID - 10)
exports.getTransactionDetails = async (req, res, next) => {
  try {
    const transactions = await DepositModel.find(
      {},
      'warehouseName depositDate slotNumber totalWeight createdAt updatedAt commodityName',
    ).lean()

    if (transactions.length === 0) {
      return res.status(404).json({
        message: 'No Transactions Found',
      })
    }
    res.status(200).json({
      message: 'Transactions Found Successfully',
      data: transactions,
    })
  } catch (error) {
    next(error)
  }
}

exports.uploadImagesForDeposit = async (req, res, next) => {
  upload.array('images', 10)(req, res, async (error) => {
    // Allows uploading up to 10 images
    if (error) {
      return next(new CustomError(error))
    }

    try {
      const { depositId } = req.params

      if (!depositId) {
        throw new CustomError('Deposit ID is required', 400)
      }

      const deposit = await DepositModel.findById(depositId)
      if (!deposit) {
        throw new CustomError('Deposit not found', 404)
      }

      if (!req.files || req.files.length === 0) {
        throw new CustomError('No files uploaded', 400)
      }

      const uploadToS3 = async (file, folder) => {
        const params = {
          Bucket: process.env.AWS_S3_BUCKET,
          Key: `${folder}/${Date.now().toString()}-${file.originalname}`,
          Body: file.buffer,
        }

        const data = await s3.upload(params).promise()
        return data.Location
      }

      const uploadedImages = await Promise.all(
        req.files.map((file) => uploadToS3(file, 'deposit_images')),
      )

      deposit.images = deposit.images.concat(uploadedImages)
      await deposit.save()

      res.status(200).json({
        message: 'Images uploaded successfully',
        data: deposit,
      })
    } catch (err) {
      next(err)
    }
  })
}
