const InvoiceModel = require('../models/invoices.model')

const {
  generateInvoiceNumber,
  generateTrackingId,
} = require('../utils/otpGenerator.utils')

const Booking = require('../models/Bookingmodel')
const { CustomError } = require('../middlewares/errorhandler.middleware')
const { transporter } = require('../utils/email')
const { UserModel } = require('../models/user.model')
const BookingModel = require('../models/Bookingmodel')

exports.addInvoice = async (req, res, next) => {
  try {
    const user = req.user.userId

    const findBooking = await Booking.findById(req.body.bookingId)
    if (!findBooking) {
      throw new CustomError('booking not found', 404)
    }

    if (
      findBooking.isBookingDeposited === true &&
      findBooking.isBookingWeighbridgeAdded === true &&
      findBooking.isBookingGraded === true
    ) {
      const invoice_no = generateInvoiceNumber()

      const trackingid = generateTrackingId()

      const invoice = await InvoiceModel.create({
        User: user,
        invoice_no,
        trackingid,
        pending_payment: 0,
        bookingId: req.body.bookingId,
        ...req.body,
        invoice_type: 'invoice',
      })

      res
        .status(200)
        .json({ data: invoice, message: 'invoice added successfully' })
    } else {
      throw new CustomError(
        'Grading, Weighbridge and Deposit should be done before adding invoice',
        400,
      )
    }
  } catch (error) {
    next(error)
  }
}

exports.generateBill = async (req, res, next) => {
  try {
    const userId = req.user.userId
    const {
      bookingId,
      partial_payment,
      service_cost,
      fumigation_cost,
      expiry_date_monitoring_charge,
    } = req.body

    const findBooking = await Booking.findById(bookingId)
    if (!findBooking) {
      throw new CustomError('Booking not found', 404)
    }

    const {
      isBookingDeposited,
      isBookingWeighbridgeAdded,
      isBookingGraded,
      total_price,
      pending_price,
    } = findBooking

    if (isBookingDeposited && isBookingWeighbridgeAdded && isBookingGraded) {
      const partialPayment = parseFloat(partial_payment)
      const totalOtherCosts =
        parseFloat(service_cost) +
        parseFloat(fumigation_cost) +
        parseFloat(expiry_date_monitoring_charge)

      if (partialPayment > parseFloat(total_price)) {
        throw new CustomError('Partial payment should be less than total', 400)
      }

      if (partialPayment < totalOtherCosts) {
        throw new CustomError(
          `Your payment cannot be done, as it is less than ${totalOtherCosts}`,
          400,
        )
      }

      let remainingPayment = partialPayment - totalOtherCosts
      let newPendingPrice = parseFloat(pending_price) - remainingPayment

      if (newPendingPrice < 0) {
        newPendingPrice = 0
        throw new CustomError('You are paying more than Pending Payment.', 400)
      }

      findBooking.pending_price = newPendingPrice.toFixed(2)
      await findBooking.save()

      const invoice = await InvoiceModel.create({
        User: userId,
        bookingId,
        service_cost,
        fumigation_cost,
        expiry_date_monitoring_charge,
        past_payment: partialPayment,
        pending_payment: newPendingPrice,
        invoice_type: 'bill',
      })

      res
        .status(200)
        .json({ data: invoice, message: 'Bill generated successfully' })
    } else {
      throw new CustomError(
        'Grading, Weighbridge and Deposit should be done before adding bill/invoice',
        400,
      )
    }
  } catch (error) {
    next(error)
  }
}

exports.markInvoicePaidOrSendRemained = async (req, res, next) => {
  try {
    const invoice = await InvoiceModel.findById(req.params.id)
    if (!invoice) {
      throw new CustomError('invoice not found', 404)
    }

    const findBooking = await Booking.findById(invoice.bookingId)

    const findUser = await UserModel.findById(findBooking.user)

    if (req.body.status === 'paid') {
      invoice.status = 'paid'
      invoice.pending_payment = 0
      await invoice.save()

      res.status(200).json({ message: 'invoice marked as paid' })
    } else {
      if (findUser.email) {
        const mailOptions = {
          from: process.env.GMAIL_USER,
          to: findUser.email,
          subject: 'Welcome to BharatGodam | Update on invoice Bill',
          html: `<p>Your invoice bill is due. This is gentle reminder to pay the due amount</p>
              <br>
             <strong>Regards,</strong>
             <br>
             <strong>Bharat Godam</strong>`,
        }

        try {
          await transporter.sendMail(mailOptions)
          console.log('Email sent successfully')
        } catch (emailError) {
          throw new CustomError(emailError, 500)
        }
      }
      res.status(200).json({ message: 'email notification sent for reminder' })
    }
  } catch (error) {
    next(error)
  }
}

exports.fetchInvoices = async (req, res, next) => {
  try {
    const user = req.user.userId

    const fetchInvoices = await InvoiceModel.find({ User: user }).populate({
      path: 'bookingId',
      populate: {
        path: 'user',
      },
    })

    res.status(200).json({ data: fetchInvoices })
  } catch (error) {
    next(error)
  }
}

exports.fetchOneInvoice = async (req, res, next) => {
  try {
    const user = req.user.userId

    const fetchInvoices = await InvoiceModel.find({
      User: user,
      _id: req.params.Id,
    }).populate({
      path: 'bookingId',
      populate: {
        path: 'user',
      },
    })

    res.status(200).json({ data: fetchInvoices })
  } catch (error) {
    next(error)
  }
}

exports.fetchBillsAndInvoices = async (req, res, next) => {
  try {
    const status = req.query.status
    const invoice_type = req.query.invoice_type
    const fetchInvoiceBill = await InvoiceModel.find({
      status,
      invoice_type,
    }).populate({
      path: 'bookingId',
      populate: [
        {
          path: 'user',
          model: 'User',
        },
        {
          path: 'warehouse',
          model: 'Warehouse',
        },
      ],
    })

    res.status(200).json({ data: fetchInvoiceBill })
  } catch (error) {
    next(error)
  }
}

exports.fetchInvoicesOfFarmer = async (req, res, next) => {
  try {
    const farmerId = req.user.userId

    const bookings = await BookingModel.find({ user: farmerId }).select('_id')

    if (!bookings || bookings.length === 0) {
      throw new CustomError('No bookings found', 404)
    }

    const bookingIds = bookings.map((booking) => booking._id)

    const invoices = await InvoiceModel.find({
      bookingId: { $in: bookingIds },
      invoice_type: 'invoice',
    })
      .populate('User', 'name email')
      .populate('bookingId')

    return res.status(200).json({
      message: 'Invoices fetched successfully',
      invoices,
    })
  } catch (error) {
    next(error)
  }
}

exports.fetchBillsOfFarmer = async (req, res, next) => {
  try {
    const farmerId = req.user.userId

    const bookings = await BookingModel.find({ user: farmerId }).select('_id')

    if (!bookings || bookings.length === 0) {
      throw new CustomError('No bookings found', 404)
    }

    const bookingIds = bookings.map((booking) => booking._id)

    const invoices = await InvoiceModel.find({
      bookingId: { $in: bookingIds },
      invoice_type: 'bill',
    })
      .populate('User', 'firstName email')
      .populate('bookingId')

    return res.status(200).json({
      message: 'Invoices fetched successfully',
      invoices,
    })
  } catch (error) {
    next(error)
  }
}
