const { CustomError } = require('../middlewares/errorhandler.middleware')
const BookingModel = require('../models/Bookingmodel')
const { UserModel } = require('../models/user.model')
const LoanModel = require('../models/loan.model')
const { generateLoanId } = require('../utils/otpGenerator.utils')
const NotificationModel = require('../models/notification.model')

exports.applyforLoan = async (req, res, next) => {
  try {
    const user = req.user.userId
    const { bookingId, pledge, loanAmount, interestRate } = req.body

    if (!bookingId) {
      throw new CustomError('bookingId is required', 400)
    }

    const findBooking = await BookingModel.findById(bookingId)
    if (!findBooking) {
      throw new CustomError('Booking not found', 404)
    }

    const formattedPledge = pledge.toLowerCase().trim()

    const existingLoanForPledge = await LoanModel.findOne({
      bookingId,
      pledge: formattedPledge,
    })
    if (existingLoanForPledge) {
      throw new CustomError(
        'Loan already applied for this booking with the same pledge.',
        400,
      )
    }

    const approvedLoan = await LoanModel.findOne({
      bookingId,
      'status.isLoanApproved': true,
    })
    if (approvedLoan) {
      throw new CustomError(
        'Loan already approved for this booking. Further loans cannot be applied.',
        400,
      )
    }

    let loanId
    let isUnique = false
    while (!isUnique) {
      loanId = generateLoanId()
      const existingLoan = await LoanModel.findOne({ loanId })
      if (!existingLoan) {
        isUnique = true
      }
    }

    const parsedLoanAmount = Number(loanAmount)
    const parsedInterestRate = Number(interestRate)
    if (isNaN(parsedLoanAmount) || isNaN(parsedInterestRate)) {
      throw new CustomError('Invalid loanAmount or interestRate', 400)
    }

    const totalAmount =
      Math.round(
        (parsedLoanAmount + (parsedLoanAmount * parsedInterestRate) / 100) *
          100,
      ) / 100

    const applyLoan = await LoanModel.create({
      User: user,
      bookingId: findBooking._id,
      loanId,
      totalAmount,
      pledge: formattedPledge,
      ...req.body,
      status: {
        isLoanApplied: true,
        isLoanRequested: true,
        isLoanApproved: false,
        isLoanDisbursed: false,
        isLoanActive: false,
        isLoanClosed: false,
        isLoanTerminated: false,
      },
    })

    if (!applyLoan) {
      throw new CustomError('Loan not applied', 400)
    }

    await NotificationModel.create({
      userId: user,
      message: 'Loan has been submitted successfully.',
      type: 'info',
      status: 'sent',
    })

    res
      .status(200)
      .json({ message: 'Loan applied successfully', data: applyLoan })
  } catch (error) {
    next(error)
  }
}

exports.getUserLoanStatus = async (req, res, next) => {
  try {
    const loans = await LoanModel.find(
      { User: req.user.userId },
      'bookingId loanId status',
    )

    if (loans.length === 0) {
      return res.status(404).json({
        message: 'No Loans found for this user.',
      })
    }

    res.status(200).json({
      message: 'Loans found successfully.',
      data: loans,
    })
  } catch (error) {
    next(error)
  }
}

exports.getLoanSummary = async (req, res, next) => {
  try {
    const borrower = await UserModel.findById(
      req.user.userId,
      'firstName lastName name',
    ).lean()
    const borrowerName =
      borrower.name || `${borrower.firstName || ''} ${borrower.lastName || ''}`

    const loans = await LoanModel.find(
      { User: req.user.userId },
      'loanId loanType loanAmount loanTerm interestRate totalAmount disbursementDate maturityDate',
    ).lean()

    if (!loans || loans.length === 0) {
      return res.status(404).json({
        message: 'No Loans found for this User.',
      })
    }

    return res.status(200).json({
      message: 'Loan Summary fetched successfully',
      data: { borrowerName, loans },
    })
  } catch (error) {
    next(error)
  }
}

exports.getAllLoanDetails = async (req, res, next) => {
  try {
    const loans = await LoanModel.find(
      {},
      'User bookingId loanAmount status createdAt updatedAt',
    ).lean()

    if (!loans || loans.length === 0) {
      throw new CustomError('No Loans found.', 404)
    }

    const loanDetails = await Promise.all(
      loans.map(async (loan) => {
        const populatedBooking = await BookingModel.findById(loan.bookingId)
          .populate({
            path: 'warehouse',
            select: 'warehouse_name warehouse_id',
          })
          .lean()

        if (!populatedBooking) {
          console.error(`Booking not found for loanId: ${loan._id}`)
          return null
        }

        const user = await UserModel.findById(
          loan.User,
          'firstName lastName isKycDone',
        ).lean()

        if (!user) {
          console.error(`User not found for loanId: ${loan._id}`)
          return null
        }

        const userName = `${user.firstName || ''} ${user.lastName || ''}`.trim()

        const commodity =
          populatedBooking.Commodity.length > 0
            ? populatedBooking.Commodity[0].name
            : 'N/A'

        return {
          loanId: loan._id,
          Name: userName,
          isKycDone: user.isKycDone,
          warehouseName: populatedBooking.warehouse?.warehouse_name || 'N/A',
          warehouseId: populatedBooking.warehouse?.warehouse_id || 'N/A',
          commodity: commodity,
          startDate: populatedBooking.fromDate,
          endDate: populatedBooking.toDate,
          totalWeight: populatedBooking.totalWeight,
          noOfBags: populatedBooking.noOfBags,
          bagSize: populatedBooking.bagSize,
          loanAmount: loan.loanAmount,
          status: loan.status,
          createdAt: loan.createdAt,
          updatedAt: loan.updatedAt,
        }
      }),
    )

    const filteredLoanDetails = loanDetails.filter((detail) => detail !== null)

    res.status(200).json({
      data: filteredLoanDetails,
      message: 'Loan details fetched successfully',
    })
  } catch (error) {
    next(error)
  }
}

exports.fetchLoanRequests = async (req, res, next) => {
  try {
    const loans = await LoanModel.find({ 'status.isLoanRequested': true })

    res
      .status(200)
      .json({ data: loans, message: 'Loan requests fetched successfully' })
  } catch (error) {
    next(error)
  }
}

exports.acceptLoan = async (req, res, next) => {
  try {
    const loanId = req.params.loanId
    const { loanAmount, interestRate, repaymentTerms } = req.body

    if (!loanAmount || !interestRate) {
      throw new CustomError('loanAmount and interestRate are required', 404)
    }

    const loan = await LoanModel.findById(loanId)

    if (!loan) {
      throw new CustomError('Loan not found', 404)
    }

    if (loan.status.isLoanApproved) {
      throw new CustomError('Loan is already accepted', 400)
    }

    loan.acceptedLoanDetails.loanAmount = loanAmount
    loan.acceptedLoanDetails.interestRate = interestRate
    loan.acceptedLoanDetails.repaymentTerms = repaymentTerms
    loan.status.isLoanApproved = true
    loan.status.isLoanRejected = false

    await loan.save()

    // Terminate all other loans for the same booking
    await LoanModel.updateMany(
      {
        bookingId: loan.bookingId,
        _id: { $ne: loan._id }, // Exclude the accepted loan
      },
      {
        $set: {
          'status.isLoanTerminated': true,
        },
      },
    )

    await NotificationModel.create({
      userId: loan.User,
      message: 'Loan has been Approved successfully.',
      type: 'info',
      status: 'sent',
    })
    res.status(200).json({
      message: 'Loan has been approved successfully',
      data: loan,
    })
  } catch (error) {
    next(error)
  }
}

exports.rejectLoan = async (req, res, next) => {
  try {
    const loanId = req.params.loanId
    const { reasonOfRejection } = req.body

    if (!reasonOfRejection) {
      throw new CustomError('Reason of rejection is required', 400)
    }

    const loan = await LoanModel.findById(loanId)

    if (!loan) {
      throw new CustomError('Loan not found', 404)
    }
    if (loan.status.isLoanRejected) {
      throw new CustomError('Loan is already Rejected', 400)
    }

    loan.status.isLoanRejected = true
    loan.status.isLoanApproved = false

    loan.reasonOfRejection = reasonOfRejection
    await loan.save()

    res.status(200).json({
      message: 'Loan has been rejected successfully',
      data: loan,
    })
  } catch (error) {
    next(error)
  }
}

// For Admin Panel (ID - 10)
exports.bankUserDetails = async (req, res, next) => {
  try {
    const loans = await LoanModel.find().populate({
      path: 'User',
      select: 'profilePicture firstName lastName',
    })

    if (!loans || loans.length === 0) {
      throw new CustomError('No Loans found', 404)
    }

    const loanDetails = loans.map((loan) => ({
      userDetails: {
        firstName: loan.User?.firstName || 'N/A',
        lastName: loan.User?.lastName || 'N/A',
        profilePicture: loan.User?.profilePicture || 'N/A',
      },
      bookingId: loan.bookingId,
      loanId: loan.loanId,
      pledge: loan.pledge,
      loanType: loan.loanType,
      loanAmount: loan.loanAmount,
      loanTerm: loan.loanTerm,
      interestRate: loan.interestRate,
      totalAmount: loan.totalAmount,
      disbursementDate: loan.disbursementDate,
      maturityDate: loan.maturityDate,
      status: loan.status,
      acceptedLoanDetails: loan.acceptedLoanDetails,
      reasonOfRejection: loan.reasonOfRejection,
      createdAt: loan.createdAt,
      updatedAt: loan.updatedAt,
    }))

    res.status(200).json({
      message: 'Loan details fetched successfully',
      data: loanDetails,
    })
  } catch (error) {
    next(error)
  }
}
