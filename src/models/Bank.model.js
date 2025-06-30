const mongoose = require('mongoose')

const BankSchema = new mongoose.Schema(
  {
    User: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    bankName: { type: String, unique: true },
    ifscCode: {type: String, unique: true},
    status: { type: String },
    AddedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
)

const BankModel = mongoose.model('Bank', BankSchema)

module.exports = BankModel
