const { CustomError } = require('../middlewares/errorhandler.middleware')
const Deposit = require('../models/DepositModel')
const aws = require('aws-sdk')
const Booking = require('../models/Bookingmodel')
const { transporter } = require('../utils/email')
const moment = require('moment')
const DepositModel = require('../models/DepositModel')
require('dotenv').config()
const s3 = require('../utils/aws')
const upload = require('../middlewares/fileupload.middleware')
const dayjs = require('dayjs')
const NotificationModel = require('../models/notification.model')

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
exports.addGrade = async (req, res, next) => {
  try {
    const userId = req.user.userId
    const { depositId } = req.params
    const {
      assignerName,
      gradeDate,
      images,
      foreignMatter,
      otherFoodGrain,
      other,
      damagedGrain,
      immatureGrain,
      weevilledGrain,
      grade,
    } = req.body
    if (!depositId) {
      throw new CustomError('Enter the Deposit Id', 400)
    }
    const deposit = await Deposit.findById(depositId)
    if (!deposit) {
      throw new CustomError('Doposit not found', 404)
    }

    const booking = await Booking.findById(deposit.bookingId)
    if (!booking) {
      throw new CustomError('Booking not found', 404)
    }

    const depositDate = dayjs(
      deposit.depositDate.toString(),
      'YYYYMMDD',
    ).startOf('day')
    const expiraryDate = dayjs(booking.toDate.toString(), 'YYYYMMDD').startOf(
      'day',
    )
    const gradingDate = dayjs(gradeDate).startOf('day')

    if (
      gradingDate.isBefore(depositDate) ||
      gradingDate.isAfter(expiraryDate)
    ) {
      throw new CustomError(
        'Grading Date must be between Deposit Date and Expiry Date of the Booking',
        400,
      )
    }

    deposit.assignerName = assignerName
    deposit.gradeDate = gradeDate
    deposit.images = images
    deposit.foreignMatter = foreignMatter
    deposit.otherFoodGrain = otherFoodGrain
    deposit.other = other
    deposit.damagedGrain = damagedGrain
    deposit.immatureGrain = immatureGrain
    deposit.weevilledGrain = weevilledGrain
    deposit.grade = grade
    deposit.gradeAddedBy = userId

    const updatedDeposit = await deposit.save()
    const BookingData = await Booking.findById(deposit.bookingId)
    if (!BookingData) {
      throw new CustomError('Booking not found', 404)
    }
    const message = `Grading Completed: \nCommodity:${deposit.commodityName}\nGrade:${deposit.grade}`
    const params = {
      Message: message,
      PhoneNumber: BookingData.Mobile_no,
    }
    if (BookingData.email) {
      const mailOptions = {
        from: process.env.GMAIL_USER,
        to: booking.email,
        subject: 'Welcome to BharatGodam | Update on Grading',
        html: `<p>Grading Completed Successfully:</p>
               <br>
               <br>
               <p>Grade: <strong>${deposit.grade}</strong></p>`,
      }

      try {
        await transporter.sendMail(mailOptions)
        console.log('Email sent successfully')
      } catch (emailError) {
        throw new CustomError(emailError, 500)
      }
    } else if (BookingData.Mobile_no) {
      try {
        await sns.publish(params).promise()
        console.log('SMS sent successfully')
      } catch (smsError) {
        throw new CustomError(smsError, 500)
      }
    } else {
      console.log('do nothing')
    }

    deposit.status = 'Finished'
    const savedDeposit = await deposit.save()

    BookingData.isBookingGraded = true
    BookingData.gradeDetails = savedDeposit.toObject()
    BookingData.expiryDateOfDeposit = savedDeposit.expiraryDate
    await BookingData.save()

    if (BookingData.user) {
      await NotificationModel.create({
        userId: BookingData.user,
        message: `Grading and expiry date confirmation for your booking ${BookingData.bookingId} is completed please accept or reject this request`,
        type: 'info',
        status: 'sent',
      })
    }

    return res
      .status(200)
      .json({ data: updatedDeposit, message: 'Graded Commodity Successfully' })
  } catch (error) {
    next(error)
  }
}

exports.searchDeposit = async (req, res, next) => {
  try {
    let { commodityName, depositDate, expiraryDate, slotNumber, sortByGrade } =
      req.query
    if (depositDate) {
      depositDate = moment(depositDate, 'DD-MM-YYYY').toDate()
    }
    if (expiraryDate) {
      expiraryDate = moment(expiraryDate, 'DD-MM-YYYY').toDate()
    }

    let query = {}

    if (commodityName) {
      query.commodityName = new RegExp(commodityName, 'i')
    }

    if (depositDate) {
      query.depositDate = { $gte: depositDate }
    }

    if (expiraryDate) {
      query.expiraryDate = { $lte: expiraryDate }
    }

    if (slotNumber) {
      query.slotNumber = slotNumber
    }

    let deposits = await Deposit.find(query)

    const gradeOrder = ['grade-I', 'grade-II', 'grade-III']
    const sortGrades = (a, b) => {
      const indexA = gradeOrder.indexOf(a.grade)
      const indexB = gradeOrder.indexOf(b.grade)
      return indexA - indexB
    }

    if (sortByGrade) {
      if (sortByGrade === 'asc') {
        deposits = deposits.sort(sortGrades)
      } else if (sortByGrade === 'desc') {
        deposits = deposits.sort((a, b) => sortGrades(b, a))
      }
    }

    return res.status(200).json({
      success: true,
      count: deposits.length,
      data: deposits,
      error: null,
    })
  } catch (error) {
    next(error)
  }
}

exports.getAllGrade = async (req, res, next) => {
  try {
    const userId = req.user.userId
    const getallGrade = await DepositModel.find({ gradeAddedBy: userId })
    res.status(200).json({
      data: getallGrade,
      message: 'data fetched successfully',
    })
  } catch (error) {
    next(error)
  }
}

exports.addImagesForGrading = async (req, res, next) => {
  upload.fields([{ name: 'images', maxCount: 10 }])(req, res, async (error) => {
    if (error) {
      throw new CustomError(error)
    }

    try {
      const userId = req.user.userId

      const depositId = req.params.id
      const deposit = await Deposit.findById(depositId)

      if (!deposit) {
        return res.status(404).json({ error: 'Deposit not found' })
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

      if (req.files.images) {
        const images = []
        for (const file of req.files.images) {
          const imageData = await uploadToS3(file, 'deposit_images')
          images.push(imageData)
        }
        deposit.images = deposit.images || []
        deposit.images = deposit.images.concat(images)
      }

      await deposit.save()
      res
        .status(200)
        .json({ data: deposit, message: 'Images uploaded successfully' })
    } catch (err) {
      next(err)
    }
  })
}
