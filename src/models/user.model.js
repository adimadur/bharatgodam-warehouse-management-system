const mongoose = require('mongoose')
const Schema = require('mongoose')

const {
  Types: { ObjectId },
} = Schema

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      validate: {
        validator: (value) => {
          return !/[^a-zA-Z ]/.test(value)
        },
        message:
          'firstName should only contain alphabetic characters and spaces',
      },
    },
    lastName: {
      type: String,
      validate: {
        validator: (value) => {
          return !/[^a-zA-Z ]/.test(value)
        },
        message:
          'lastName should only contain alphabetic characters and spaces',
      },
    },
    phone: { type: String },
    email: { type: String },
    password: {
      type: String,
    },
    role: {
      type: String,
      enums: [
        'Farmer',
        'Trader',
        'FPO',
        'Warehouse owner',
        'Pledge',
        'admin',
        'manager',
      ],
    },
    profilePicture: {
      type: String,
    },
    Address: {
      pincode: {
        type: String,
      },
      city: {
        type: String,
      },
      state: {
        type: String,
      },
      buildingName: {
        type: String,
      },
      street: {
        type: String,
      },
      landmark: {
        type: String,
      },
    },
    kyc: {
      aadharcard: {
        type: String,
      },
      pancard: {
        type: String,
      },
    },
    isDocumentsVerified: { type: Boolean, default: false },
    isAddressVerified: { type: Boolean, default: false },
    isKycDone: { type: Boolean, default: false },
    isKycPending: { type: Boolean, default: false },
    isAadharVerified: { type: Boolean, default: false },
    isPanVerified: { type: Boolean, default: false },
    kycVerifiedBy: { type: ObjectId, ref: 'User' },
    lastLoginTime: { type: Date, default: Date.now, index: true },
    isEmailVerified: { type: Boolean, default: false },
    isMobileVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: false },
    isArchived: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: false },
    isRejected: { type: Boolean, default: false },
    warehouse: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Warehouse',
      },
    ],
    warehouseWishlist: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Warehouse',
      },
    ],
    managedWarehouse: [
      {
        type: ObjectId,
        ref: 'Warehouse',
        required: function () {
          return this.role === 'manager'
        },
      },
    ],
    shippingOtp: { type: String },
    warehouseOwnerId: {
      type: ObjectId,
      ref: 'User',
      required: function () {
        return this.role === 'manager'
      },
    },
  },
  { timestamps: true },
)

const UserModel = mongoose.model('User', userSchema)

module.exports = { UserModel }
