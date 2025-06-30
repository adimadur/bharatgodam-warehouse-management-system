const mongoose = require('mongoose')

const loanSchema = new mongoose.Schema(
  {
    User: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
    loanId: { type: String, unique: true },
    pledge: { type: String },
    loanType: { type: String },
    loanAmount: { type: Number },
    loanTerm: { type: String },
    interestRate: { type: Number },
    totalAmount: { type: Number },
    disbursementDate: { type: String },
    maturityDate: { type: String },
    status: {
      isLoanApplied: { type: Boolean, default: false },
      isLoanRequested: { type: Boolean, default: false },
      isLoanApproved: { type: Boolean, default: false },
      isLoanDisbursed: { type: Boolean, default: false },
      isLoanActive: { type: Boolean, default: false },
      isLoanClosed: { type: Boolean, default: false },
      isLoanRejected: { type: Boolean, default: false },
      isLoanTerminated: { type: Boolean, default: false },
    },
    acceptedLoanDetails: {
      loanAmount: { type: Number },
      interestRate: { type: Number },
      repaymentTerms: { type: String },
    },
    reasonOfRejection: { type: String, default: '' },
  },
  { timestamps: true },
)

const LoanModel = mongoose.model('Loan', loanSchema)

module.exports = LoanModel
