const Shipping = require('../models/shipping.model')
const Booking = require('../models/Bookingmodel')
const { v4: uuidv4 } = require('uuid')
const aws = require('aws-sdk')
const { CustomError } = require('../middlewares/errorhandler.middleware')
require('dotenv').config()
const ml_authorization = process.env.ML_API_AUTHORIZATION
const baseurlML = process.env.ML_API_BASE_URL
const axios = require('axios')
const { UserModel } = require('../models/user.model')
const { generateOTP } = require('../utils/otpGenerator.utils')
const DepositModel = require('../models/DepositModel')
const NotificationModel = require('../models/notification.model')
const { transporter } = require('../utils/email')
const dayjs = require('dayjs')

// AWS Config
const AccessKeyId = process.env.AWS_ACCESSKEY
const SecreteAccessKey = process.env.AWS_SECRET_ACCESS_KEY
const Region = process.env.AWS_REGION

aws.config.update({
  accessKeyId: AccessKeyId,
  secretAccessKey: SecreteAccessKey,
  region: Region,
})

const sns = new aws.SNS()

exports.sendOtpToFarmer = async (req, res, next) => {
  try {
    const phone = req.body.phone

    const findPhone = await UserModel.findOne({ phone: phone })
    if (!findPhone) {
      throw new CustomError('user not found', 404)
    }

    const otp = generateOTP()

    const params = {
      Message: `Hello Welcome to BharatGodam. Your OTP for Shipping is ${otp}`,
      PhoneNumber: phone,
    }

    sns.publish(params, async (err, data) => {
      if (err) {
        next(new CustomError('Something went wrong', 500))
      } else {
        console.log('OTP sent successfully', data)
      }
    })
    findPhone.shippingOtp = otp
    await findPhone.save()
    res.status(200).json({ message: 'otp sent successfully' })
  } catch (error) {
    next(error)
  }
}

exports.verifyOtp = async (req, res, next) => {
  try {
    const { phone, otp } = req.body

    const user = await UserModel.findOne({ phone: phone })
    if (!user) {
      throw new CustomError('User not found', 404)
    }

    const storedOtp = user.shippingOtp

    if (otp === storedOtp) {
      user.shippingOtp = null
      await user.save()
      res.status(200).json({ message: 'OTP verified successfully' })
    } else {
      throw new CustomError('Invalid OTP', 400)
    }
  } catch (error) {
    next(error)
  }
}

exports.addShipping = async (req, res, next) => {
  try {
    const warehouseId = req.params.warehouseId
    const bookingId = req.params.bookingId
    const userId = req.user.userId

    const shippingData = {
      ...req.body,
      warehouse: warehouseId,
      bookingId: bookingId,
    }

    const newShipping = new Shipping({
      ...shippingData,
      status: 'In Transit',
      User: userId,
    })
    const savedShipping = await newShipping.save()
    const booking = await Booking.findById(bookingId)

    const bookdetails = booking.bookingId

    const findDeposit = await DepositModel.findById(booking.depositId)

    if (req.body.commodity[0].quantity > findDeposit.totalWeight) {
      throw new CustomError('Insufficient Weight', 400)
    }

    let shippingId = ''

    if (req.body.withdrawlStatus === 'partial') {
      const existingShipping = await Shipping.find({ bookingId: bookingId })
      const newShippingIndex = existingShipping.length + 1
      shippingId = `${bookdetails}.${newShippingIndex}`

      const updateBooking = await Booking.findOneAndUpdate(
        { _id: bookingId },
        {
          $set: {
            totalWeight: booking.totalWeight - req.body.commodity[0].quantity,
            isBookingWithdrawn:
              booking.totalWeight - req.body.commodity[0].quantity === 0
                ? true
                : false,
          },
          $push: { shippingDetails: savedShipping._id },
        },
      )
    } else {
      const updatedBooking = await Booking.findOneAndUpdate(
        { _id: bookingId },
        {
          $set: {
            isBookingWithdrawn: true,
            totalWeight: booking.totalWeight - req.body.commodity[0].quantity,
          },
          $push: { shippingDetails: savedShipping._id },
        },
        { new: true },
      )
    }

    newShipping.shippingId = shippingId

    await newShipping.save()

    // Compare current date with toDate
    const currentDate = parseInt(dayjs().format('YYYYMMDD'))
    if (currentDate > booking.toDate) {
      booking.total_price = (parseFloat(booking.total_price) + 1000).toFixed(2)
      await booking.save()
    }

    if (booking.user) {
      await NotificationModel.create({
        userId: booking.user,
        message: `Withdrawl successful for the bookingId ${booking.bookingId}.`,
        type: 'info',
        status: 'sent',
      })
    }

    const responseMessage =
      currentDate > booking.toDate
        ? 'Shipment added successfully. Amount increased by 1000 due to late shipping.'
        : 'Shipment added successfully.'

    res.status(201).json({ data: savedShipping, message: responseMessage })
  } catch (error) {
    next(error)
  }
}

exports.getShippingById = async (req, res, next) => {
  try {
    const shipping = await Shipping.findById(req.params.id).populate(
      'bookingId',
    )
    if (!shipping) {
      throw new CustomError('Shipment not found', 400)
    }
    res
      .status(200)
      .json({ data: shipping, message: 'Shippment by Id fetched Successfully' })
  } catch (error) {
    next(error)
  }
}

exports.getAllWithDrawlData = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query

    let filter = {}

    const parseDate = (yyyymmdd) => {
      const year = parseInt(yyyymmdd.substring(0, 4), 10)
      const month = parseInt(yyyymmdd.substring(4, 6), 10) - 1
      const day = parseInt(yyyymmdd.substring(6, 8), 10)
      return new Date(year, month, day)
    }

    if (startDate && endDate) {
      const start = parseDate(startDate)
      const end = parseDate(endDate)

      start.setHours(0, 0, 0, 0)
      end.setHours(23, 59, 59, 999)

      filter.createdAt = {
        $gte: start,
        $lte: end,
      }
    }

    const getAllData = await Shipping.find(filter).populate(
      'warehouse bookingId',
    )

    const filteredData = getAllData.filter((data) => {
      return data.bookingId && !data.bookingId.isBookingWithdrawn
    })

    res.status(200).json({
      data: filteredData,
      message: 'Withdrawal data fetched successfully!',
    })
  } catch (error) {
    next(error)
  }
}

exports.getWithdrawlId = async (req, res, next) => {
  try {
    const shipping = await Shipping.findById(req.params.id)
    const booking = await Booking.findById(shipping.bookingId)
    if (!shipping) {
      throw new CustomError('Shipment not found', 400)
    }
    if (!shipping.withdrawlId) {
      shipping.withdrawlId = uuidv4()
      booking.isBookingWithdrawn = true
      await booking.save()
      await shipping.save()
    }
    res.status(200).json({
      data: shipping.withdrawlId,
      message: 'Withdrawl Id Generated Successfully',
    })
  } catch (error) {
    next(error)
  }
}

exports.updateShipping = async (req, res, next) => {
  try {
    const updatedShipping = await Shipping.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true },
    )
    if (!updatedShipping) {
      throw new CustomError('Shipment not found', 400)
    }
    res.status(200).json({
      data: updatedShipping,
      message: 'Shippment Updated Successfully',
    })
  } catch (error) {
    next(error)
  }
}

exports.getShippingByWithdrawlId = async (req, res, next) => {
  try {
    const withdrawlId = req.params.withdrawlId
    const shipping = await Shipping.findOne({ withdrawlId })

    if (!shipping) {
      throw new CustomError('Shipment not found', 400)
    }

    res
      .status(200)
      .json({ data: shipping, message: 'Shippment by Withdrawl Id Fetched' })
  } catch (error) {
    next(error)
  }
}

exports.fetchAllDetails = async (req, res, next) => {
  try {
    const response = await axios.get(baseurlML, {
      headers: {
        Authorization: ml_authorization,
      },
    })

    const mlData = response.data

    const findBooking = await Booking.findOne({
      bookingId: mlData['Booking ID'],
    })

    if (!findBooking) {
      throw new CustomError('Booking not found', 400)
    }

    const sacksCountFromML = mlData['Sacks Counting']
    const commodityFromML = mlData['Commodity']

    if (parseInt(sacksCountFromML, 10) !== parseInt(findBooking.noOfBags, 10)) {
      return res.status(400).json({
        message: `Sacks count mismatch. ML API reported ${sacksCountFromML} sacks, but the booking has ${findBooking.noOfBags} bags.`,
      })
    }

    const bookingCommodityName = findBooking.Commodity[0]?.name
    if (commodityFromML !== bookingCommodityName) {
      return res.status(400).json({
        message: `Commodity mismatch. ML API reported ${commodityFromML}, but the booking has ${bookingCommodityName}.`,
      })
    }

    if (findBooking.user) {
      await NotificationModel.create({
        userId: findBooking.user,
        message: `Sacks counts and Commodity validated successfully with the booking ${findBooking.bookingId}`,
        type: 'info',
        status: 'sent',
      })
    }

    if (findBooking.email) {
      const mailOptions = {
        from: process.env.GMAIL_USER,
        to: booking.email,
        subject: 'Welcome to BharatGodam | Update on Booking',
        html: `<p>Sacks counts and Commodity validated successfully with the booking ${findBooking.bookingId}</p>`,
      }

      try {
        await transporter.sendMail(mailOptions)
        console.log('Email sent successfully')
      } catch (emailError) {
        throw new CustomError(emailError, 500)
      }
    }

    res.json({ data: response.data, message: 'ML data fetched successfully' })
  } catch (error) {
    next(error)
  }
}

exports.readRecordByBookingId = async (req, res, next) => {
  const { bookingId } = req.body

  try {
    if (!bookingId) {
      throw new CustomError('bookingId ID is required', 400)
    }

    const findBooking = await Booking.findOne({
      bookingId: bookingId,
    })

    if (!findBooking) {
      throw new CustomError('Booking not found', 400)
    }

    const response = await axios.post(
      baseurlML,
      {
        BookingID: bookingId,
      },
      {
        headers: {
          Authorization: ml_authorization,
          'Content-Type': 'application/json',
        },
      },
    )

    const mlData = response.data

    const sacksCountFromML = mlData['Sacks Counting']
    const commodityFromML = mlData['Commodity']

    if (parseInt(sacksCountFromML, 10) !== parseInt(findBooking.noOfBags, 10)) {
      return res.status(400).json({
        message: `Sacks count mismatch. ML API reported ${sacksCountFromML} sacks, but the booking has ${findBooking.noOfBags} bags.`,
      })
    }

    const bookingCommodityName = findBooking.Commodity[0]?.name
    if (commodityFromML !== bookingCommodityName) {
      return res.status(400).json({
        message: `Commodity mismatch. ML API reported ${commodityFromML}, but the booking has ${bookingCommodityName}.`,
      })
    }

    if (findBooking.user) {
      await NotificationModel.create({
        userId: findBooking.user,
        message: `Sacks counts and Commodity validated successfully with the booking ${bookingId}`,
        type: 'info',
        status: 'sent',
      })
    }

    if (findBooking.email) {
      const mailOptions = {
        from: process.env.GMAIL_USER,
        to: findBooking.email,
        subject: 'Welcome to BharatGodam | Update on Booking',
        html: `<p>Sacks counts and Commodity validated successfully with the booking ${findBooking.bookingId}</p>`,
      }

      try {
        await transporter.sendMail(mailOptions)
        console.log('Email sent successfully')
      } catch (emailError) {
        throw new CustomError(emailError, 500)
      }
    }

    res.status(200).json({
      data: mlData,
      message:
        'Sacks counts and Commodity validated successfully with the booking',
    })
  } catch (error) {
    next(error)
  }
}

exports.readRecordByWithdrawalId = async (req, res, next) => {
  const { WithdrawalID } = req.body

  try {
    if (!WithdrawalID) {
      throw new CustomError('Withdrawl ID is required', 400)
    }

    const findWithdrawl = await Shipping.findById(WithdrawalID).populate(
      'bookingId',
    )

    if (!findWithdrawl) {
      throw new CustomError('Withdrawl not found', 400)
    }

    const response = await axios.post(
      baseurlML,
      {
        WithdrawlID: WithdrawalID,
      },
      {
        headers: {
          Authorization: ml_authorization,
          'Content-Type': 'application/json',
        },
      },
    )

    const mlData = response.data

    const sacksCountFromML = mlData['Sacks Counting']
    const commodityFromML = mlData['Commodity']

    if (
      parseInt(sacksCountFromML, 10) !== parseInt(findWithdrawl.totalBags, 10)
    ) {
      return res.status(400).json({
        message: `Sacks count mismatch. ML API reported ${sacksCountFromML} sacks, but the Withdrawl has ${findWithdrawl.totalBags} bags.`,
      })
    }

    const withdrawCommodityName = findWithdrawl.commodity[0]?.itemName
    if (commodityFromML !== withdrawCommodityName) {
      return res.status(400).json({
        message: `Commodity mismatch. ML API reported ${commodityFromML}, but the withdrawl has ${withdrawCommodityName}.`,
      })
    }

    if (findWithdrawl.User) {
      await NotificationModel.create({
        userId: findWithdrawl.User,
        message:
          'Sacks counts and Commodity validated successfully with the withdraw',
        type: 'info',
        status: 'sent',
      })
    }

    if (findWithdrawl.bookingId.email) {
      const mailOptions = {
        from: process.env.GMAIL_USER,
        to: findWithdrawl.bookingId.email,
        subject: 'Welcome to BharatGodam | Update on Booking',
        html: `<p>Sacks counts and Commodity validated successfully with the withdraw ${findWithdrawl.bookingId}</p>`,
      }

      try {
        await transporter.sendMail(mailOptions)
        console.log('Email sent successfully')
      } catch (emailError) {
        throw new CustomError(emailError, 500)
      }
    }

    res.status(200).json({
      data: response.data,
      message:
        'Sacks counts and Commodity validated successfully with the withdraw',
    })
  } catch (error) {
    next(error)
  }
}

exports.LiveFeed = async (req, res, next) => {
  try {
    const livefeed = await axios.get(process.env.ML_LIVE_FEED_BASEURL)

    const responseBody = JSON.parse(livefeed.data.body)
    const videoUrl = responseBody.video_url

    res
      .status(200)
      .json({ video_url: videoUrl, message: 'Live feed fetched successfully' })
  } catch (error) {
    next(error)
  }
}
