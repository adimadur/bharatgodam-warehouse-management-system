require('dotenv').config()
const mongoose = require('mongoose')
const { CustomError } = require('../middlewares/errorhandler.middleware')
const { UserModel } = require('../models/user.model')
const jwt = require('jsonwebtoken')
const WarehouseModel = require('../models/warehouse.model')
const DepositModel = require('../models/DepositModel')
const BookingModel = require('../models/Bookingmodel')
const NotificationModel = require('../models/notification.model')
const csv = require('csv-parser')
const fs = require('fs')
const BankModel = require('../models/Bank.model')
const bcrypt = require('bcrypt')

exports.getAllKycDocuments = async (req, res, next) => {
  try {
    const users = await UserModel.find({
      $or: [
        { 'kyc.aadharcard': { $exists: true, $ne: null } },
        { 'kyc.pancard': { $exists: true, $ne: null } },
      ],
    }).select('firstName lastName email kyc aadharcard pancard')

    res.status(200).json({
      success: true,
      data: users,
    })
  } catch (error) {
    next(error)
  }
}

exports.verifyKycController = async (req, res, next) => {
  try {
    const { userId, documentType } = req.body

    const Id = req.user.userId
    const user = await UserModel.findById({ _id: userId })
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    if (documentType === 'aadharcard') {
      if (!user.kyc.aadharcard) {
        throw new CustomError('Aadhar card is not uploaded yet!', 400)
      }
      if (user.isAadharVerified === true) {
        throw new CustomError('Aadhaar is already verified', 400)
      }
      user.isAadharVerified = true
      user.kycVerifiedBy = Id
    } else if (documentType === 'pancard') {
      if (!user.kyc.pancard) {
        throw new CustomError('Pan card is not uploaded yet!', 400)
      }
      if (user.isPanVerified === true) {
        throw new CustomError('pan card is already verified', 400)
      }
      user.isPanVerified = true
      user.kycVerifiedBy = Id
    } else {
      throw new CustomError('Invalid Request', 404)
    }

    if (user.isAadharVerified && user.isPanVerified) {
      user.isKycDone = true
      user.isKycPending = false
    }

    await user.save()

    if (user._id) {
      if (user.isAadharVerified === true && user.isPanVerified === true) {
        await NotificationModel.create({
          userId: user._id,
          message: 'KYC verified now you can book warhouses, Thank you.',
          type: 'info',
          status: 'sent',
        })
      }
    }

    res.status(200).json({ message: `${documentType} verified successfully` })
  } catch (err) {
    next(err)
  }
}

exports.getUsersWithNonAdminRole = async (req, res, next) => {
  try {
    const users = await UserModel.find({ role: { $ne: 'admin' } })
    res.status(200).json({ data: users })
  } catch (error) {
    next(error)
  }
}

exports.getAllWarehousesByAdmin = async (req, res, next) => {
  try {
    const FetchAll = await WarehouseModel.find()

    const warehousesWithTotalWeight = FetchAll.map((warehouse) => {
      let totalWeight = 0

      warehouse.Commodity.forEach((commodity) => {
        commodity.price_perday.forEach((price) => {
          const weight = parseFloat(price.weight)
          if (!isNaN(weight)) {
            totalWeight += weight
          }
        })
      })

      return {
        ...warehouse.toObject(),
        totalWeight,
      }
    })

    res.status(200).json({
      data: warehousesWithTotalWeight,
      message: 'All warehouses fetched successfully',
    })
  } catch (error) {
    next(error)
  }
}

exports.getTotalCapacitiesAndRemainingCapacities = async (req, res, next) => {
  try {
    const result = await WarehouseModel.aggregate([
      {
        $group: {
          _id: null,
          totalCapacityMT: { $sum: { $divide: ['$total_capacity', 1000] } },
          totalRemainingCapacityMT: {
            $sum: { $divide: ['$remainingCapacity', 1000] },
          },
        },
      },
    ])

    if (result.length > 0) {
      res.json({
        totalCapacityMT: result[0].totalCapacityMT,
        totalRemainingCapacityMT: result[0].totalRemainingCapacityMT,
      })
    } else {
      res.json({
        totalCapacityMT: 0,
        totalRemainingCapacityMT: 0,
      })
    }
  } catch (error) {
    next(error)
  }
}

exports.getCountsByRole = async (req, res, next) => {
  try {
    const counts = await UserModel.aggregate([
      {
        $group: {
          _id: {
            state: '$Address.state',
            district: '$Address.city',
          },
          totalFarmers: {
            $sum: {
              $cond: [{ $eq: ['$role', 'Farmer'] }, 1, 0],
            },
          },
          totalTraders: {
            $sum: {
              $cond: [{ $eq: ['$role', 'Trader'] }, 1, 0],
            },
          },
          totalFPOs: {
            $sum: {
              $cond: [{ $eq: ['$role', 'FPO'] }, 1, 0],
            },
          },
        },
      },
      {
        $project: {
          state: '$_id.state',
          district: '$_id.district',
          totalFarmers: 1,
          totalTraders: 1,
          totalFPOs: 1,
          _id: 0,
        },
      },
      {
        $sort: {
          state: 1,
          district: 1,
        },
      },
    ])

    res
      .status(200)
      .json({ data: counts, message: 'user list fetched successfully' })
  } catch (error) {
    next(error)
  }
}

exports.getAllFutureBookings = async (req, res, next) => {
  try {
    const findAllBookings = await BookingModel.find({
      isAccepted: true,
      status: 'Accepted',
    })
    if (!findAllBookings) {
      throw new CustomError('no accepted bookings found')
    }

    res
      .status(200)
      .json({ data: findAllBookings, message: 'Accepted bookings fetched' })
  } catch (error) {
    next(error)
  }
}

exports.deleteUserByAdmin = async (req, res, next) => {
  try {
    const { userId } = req.params

    await BookingModel.deleteMany({ user: userId })

    await DepositModel.deleteMany({ User: userId })

    await WarehouseModel.deleteMany({ User: userId })

    const user = await UserModel.findByIdAndDelete({ _id: userId })

    res.status(200).json({ message: 'User deleted successfully' })
  } catch (error) {
    next(error)
  }
}

exports.bulkUploadWarehouses = async (req, res, next) => {
  try {
    const file = req.file
    const warehouses = []

    if (!file) {
      throw new CustomError('No file uploaded', 400)
    }

    const parseBoolean = (value) => value && value.toLowerCase() === 'true'

    fs.createReadStream(file.path)
      .pipe(csv())
      .on('data', (row) => {
        warehouses.push({
          User: mongoose.Types.ObjectId.isValid(row['User (ID)'])
            ? mongoose.Types.ObjectId(row['User (ID)'])
            : null,
          warehouse_name: row['warehouse_name'],
          warehouse_id: row['warehouse_id'],
          locality_area: row['locality_area'],
          landmark: row['landmark'],
          pincode: row['pincode'],
          city: row['city'],
          State: row['State'],
          mobile_number: row['mobile_number'],
          total_capacity: parseFloat(row['total_capacity']) || 0,
          filled_capacity: parseFloat(row['filled_capacity']) || 0,
          remainingCapacity: parseFloat(row['remainingCapacity']) || 0,
          wdra_certificate: row['wdra_certificate']
            ? row['wdra_certificate'].split(',')
            : [],
          wdra_certified: parseBoolean(row['wdra_certified']),
          Facilities: row['Facilities'] ? row['Facilities'].split(',') : [],
          main_photo: row['main_photo'] ? row['main_photo'].split(',') : [],
          other_photo: row['other_photo'] ? row['other_photo'].split(',') : [],
          manager: mongoose.Types.ObjectId.isValid(row['manager (ID)'])
            ? mongoose.Types.ObjectId(row['manager (ID)'])
            : null,
          Commodity: row['Commodity']
            ? row['Commodity'].split('|').map((commodity) => {
                const [name, AddedBy, weight, price] = commodity.split(';')
                return {
                  name,
                  AddedBy: mongoose.Types.ObjectId.isValid(AddedBy)
                    ? mongoose.Types.ObjectId(AddedBy)
                    : null,
                  price_perday: [
                    {
                      weight,
                      price: parseFloat(price) || 0,
                    },
                  ],
                }
              })
            : [],
          logo: row['logo'],
          bank_accounts: row['bank_accounts']
            ? row['bank_accounts'].split(',')
            : [],
          isActive: parseBoolean(row['isActive']),
          isArchived: parseBoolean(row['isArchived']),
          createdAt: row['createdAt'] ? new Date(row['createdAt']) : new Date(),
        })
      })
      .on('end', async () => {
        try {
          await WarehouseModel.insertMany(warehouses)
          res
            .status(200)
            .json({ message: 'Bulk upload successful', warehouses })
        } catch (error) {
          throw new CustomError(error, 500)
        }
      })
  } catch (error) {
    next(error)
  }
}

exports.addBank = async (request, response, next) => {
  try {
    const Admin = request.user.userId

    const bank = await BankModel.create({
      AddedBy: Admin,
      bankName: request.body.bankName.toLowerCase().trim(),
      ifscCode: request.body.ifscCode.toLowerCase().trim(),
      ...request.body,
    })

    response.status(200).json({ message: 'Bank added successfully', bank })
  } catch (error) {
    next(error)
  }
}

exports.fetchAllBankUsers = async (req, res, next) => {
  try {
    const bankUsers = await UserModel.find({ role: 'Pledge' }).lean()

    if (!bankUsers || bankUsers.length === 0) {
      throw new CustomError('No Bank Users found', 404)
    }

    const bankDetails = await BankModel.find({
      User: { $in: bankUsers.map((user) => user._id) },
    })
      .select('bankName User')
      .lean()

    const enrichedBankUsers = bankUsers.map((user) => {
      const bankDetail = bankDetails.find(
        (bank) => bank.User.toString() === user._id.toString(),
      )
      return {
        ...user,
        bankName: bankDetail ? bankDetail.bankName : 'N/A',
      }
    })

    return res.status(200).json({
      data: enrichedBankUsers,
      message: 'Bank users fetched successfully',
    })
  } catch (error) {
    next(error)
  }
}

exports.addBankUser = async (req, res, next) => {
  try {
    const { bankId } = req.params
    const { username, email, password } = req.body
    const bank = await BankModel.findById(bankId)
    if (!bank) {
      throw new CustomError('Bank Not Found', 404)
    }
    const saltRounds = 10
    const hashedPassword = await bcrypt.hash(password, saltRounds)
    const findEmail = await UserModel.findOne({ email: email })
    if (findEmail) {
      throw new CustomError('user already exists', 404)
    }
    const newBankUser = new UserModel({
      firstName: username,
      email,
      password: hashedPassword,
      role: 'Pledge',
      isEmailVerified: true,
    })
    await newBankUser.save()
    const bankUser = await UserModel.findOne({ email: email })
    bank.User = bankUser._id
    await bank.save()

    res.status(200).json({
      pledge: newBankUser,
      message: 'Bank User Added Succesfully',
    })
  } catch (error) {
    next(error)
  }
}

exports.getAllBookings = async (req, res, next) => {
  try {
    const bookings = await BookingModel.find()
    if (!bookings || bookings.length === 0) {
      throw new CustomError('Bookings not found', 404)
    }

    res.status(200).json({
      message: 'All Bookings fetched successfully',
      data: bookings,
    })
  } catch (error) {
    next(error)
  }
}

exports.addWarehouse = async (req, res, next) => {
  try {
    const admin = req.user.userId

    const {
      warehouse_name,
      warehouse_id,
      locality_area,
      landmark,
      pincode,
      city,
      State,
      mobile_number,
      total_capacity,
      filled_capacity,
      wdra_certficate,
      Facilities,
      Photos,
      email,
    } = req.body

    const auth = await UserModel.findOne({ email: email })

    const remainingCapacity = total_capacity - filled_capacity

    const warehouseData = {
      User: auth._id,
      warehouse_name,
      warehouse_id,
      locality_area,
      landmark,
      pincode,
      city,
      State,
      mobile_number,
      total_capacity,
      filled_capacity,
      remainingCapacity,
      wdra_certficate,
      Facilities,
      AddedBy: admin,
    }

    const warehouse = new WarehouseModel(warehouseData)

    await UserModel.findByIdAndUpdate(
      auth._id,
      { $push: { warehouse: warehouse._id } },
      { new: true, useFindAndModify: false },
    )

    await warehouse.save()

    await NotificationModel.create({
      userId: auth._id,
      message: "Warehouse added Successfully. Now let's add some details...",
      type: 'info',
      status: 'sent',
    })

    res
      .status(201)
      .json({ data: warehouse, message: 'warehouse added successfully' })
  } catch (error) {
    next(error)
  }
}

exports.fetchAllBanks = async (req, res, next) => {
  try {
    const banks = await BankModel.find()
    if (!banks || banks.length === 0) {
      throw new CustomError('No Banks found', 404)
    }

    res.status(200).json({
      data: banks,
      message: 'Banks fetched successfully',
    })
  } catch (error) {
    next(error)
  }
}

exports.updateWarehouseFromCsv = async (req, res, next) => {
  try {
    const { warehouseId } = req.params
    const file = req.file

    if (!warehouseId) {
      throw new CustomError('Warehouse ID is required', 400)
    }

    if (!file) {
      throw new CustomError('No file uploaded', 404)
    }

    const warehouses = []
    const parseBoolean = (value) => value && value.toLowerCase() === 'true'

    fs.createReadStream(file.path)
      .pipe(csv())
      .on('data', (row) => {
        warehouses.push({
          User: mongoose.Types.ObjectId.isValid(row['User (ID)'])
            ? mongoose.Types.ObjectId(row['User (ID)'])
            : null,
          warehouse_name: row['warehouse_name'],
          warehouse_id: row['warehouse_id'],
          locality_area: row['locality_area'],
          landmark: row['landmark'],
          pincode: row['pincode'],
          city: row['city'],
          State: row['State'],
          mobile_number: row['mobile_number'],
          total_capacity: parseFloat(row['total_capacity']) || 0,
          filled_capacity: parseFloat(row['filled_capacity']) || 0,
          remainingCapacity: parseFloat(row['remainingCapacity']) || 0,
          wdra_certificate: row['wdra_certificate']
            ? row['wdra_certificate'].split(',')
            : [],
          wdra_certified: parseBoolean(row['wdra_certified']),
          Facilities: row['Facilities'] ? row['Facilities'].split(',') : [],
          main_photo: row['main_photo'] ? row['main_photo'].split(',') : [],
          other_photo: row['other_photo'] ? row['other_photo'].split(',') : [],
          manager: mongoose.Types.ObjectId.isValid(row['manager (ID)'])
            ? mongoose.Types.ObjectId(row['manager (ID)'])
            : null,
          Commodity: row['Commodity']
            ? row['Commodity'].split('|').map((commodity) => {
                const [name, AddedBy, weight, price] = commodity.split(';')
                return {
                  name,
                  AddedBy: mongoose.Types.ObjectId.isValid(AddedBy)
                    ? mongoose.Types.ObjectId(AddedBy)
                    : null,
                  price_perday: [
                    {
                      weight,
                      price: parseFloat(price) || 0,
                    },
                  ],
                }
              })
            : [],
          logo: row['logo'],
          bank_accounts: row['bank_accounts']
            ? row['bank_accounts'].split(',')
            : [],
          isActive: parseBoolean(row['isActive']),
          isArchived: parseBoolean(row['isArchived']),
          createdAt: row['createdAt'] ? new Date(row['createdAt']) : new Date(),
        })
      })
      .on('end', async () => {
        try {
          const warehouseToUpdate = await WarehouseModel.findById(warehouseId)

          if (!warehouseToUpdate) {
            throw new CustomError('Warehouse not found', 404)
          }

          const updatedData = warehouses[0]
          Object.keys(updatedData).forEach((key) => {
            if (updatedData[key] !== undefined) {
              warehouseToUpdate[key] = updatedData[key]
            }
          })

          await warehouseToUpdate.save()

          res.status(200).json({
            message: 'Warehouse updated successfully from CSV',
            data: warehouseToUpdate,
          })
        } catch (error) {
          throw new CustomError(error.message || 'Internal Server Error', 500)
        }
      })
  } catch (error) {
    next(error)
  }
}

exports.bulkUploadUsers = async (req, res, next) => {
  try {
    const file = req.file
    const users = []

    if (!file) {
      throw new CustomError('No file uploaded', 400)
    }

    const validateMandatoryFields = (row) => {
      if (!row.firstName) {
        throw new CustomError('Missing firstName in the CSV file', 400)
      }

      if (!row.phone && !row.email) {
        throw new CustomError('Either phone or email is required', 400)
      }

      if (!row.password) {
        throw new CustomError('Password is mandatory', 400)
      }

      const validRoles = [
        'Farmer',
        'Trader',
        'FPO',
        'Warehouse owner',
        'Pledge',
        'admin',
        'manager',
      ]
      if (!row.role || !validRoles.includes(row.role)) {
        throw new CustomError(`Invalid role provided: ${row.role}`, 400)
      }
    }

    fs.createReadStream(file.path)
      .pipe(csv())
      .on('data', async (row) => {
        try {
          validateMandatoryFields(row)

          const hashedPassword = await bcrypt.hash(row.password, 10)

          users.push({
            firstName: row.firstName,
            lastName: row.lastName || '',
            phone: row.phone || null,
            email: row.email || null,
            password: hashedPassword,
            role: row.role,
            profilePicture: row.profilePicture || '',
            Address: {
              pincode: row.pincode || '',
              city: row.city || '',
              state: row.state || '',
              buildingName: row.buildingName || '',
              street: row.street || '',
              landmark: row.landmark || '',
            },
            kyc: {
              aadharcard: row.aadharcard || '',
              pancard: row.pancard || '',
            },
            isDocumentsVerified: row.isDocumentsVerified === 'true',
            isAddressVerified: row.isAddressVerified === 'true',
            isKycDone: row.isKycDone === 'true',
            isKycPending: row.isKycPending === 'true',
            isAadharVerified: row.isAadharVerified === 'true',
            isPanVerified: row.isPanVerified === 'true',
            isEmailVerified: row.isEmailVerified === 'true',
            isMobileVerified: row.isMobileVerified === 'true',
            isActive: row.isActive === 'true',
            isArchived: row.isArchived === 'true',
            isVerified: row.isVerified === 'true',
            isRejected: row.isRejected === 'true',
            managedWarehouse: row.managedWarehouse
              ? row.managedWarehouse
                  .split(',')
                  .map((id) =>
                    mongoose.Types.ObjectId.isValid(id) ? id : null,
                  )
              : [],
            warehouseOwnerId: mongoose.Types.ObjectId.isValid(
              row.warehouseOwnerId,
            )
              ? row.warehouseOwnerId
              : null,
          })
        } catch (error) {
          console.error(`Error processing row: ${row}, Error: ${error.message}`)
        }
      })
      .on('end', async () => {
        try {
          await UserModel.insertMany(users)
          res.status(200).json({
            message: 'Users Bulk upload successfull',
            users,
          })
        } catch (error) {
          next(error)
        }
      })
  } catch (error) {
    next(error)
  }
}

exports.updatebankStatus = async (req, res, next) => {
  const { status } = req.body
  const bankId = req.params

  const bank = await BankModel.findById(bankId)

  if (!bank) {
    throw new CustomError('Bank not Found!', 404)
  }

  bank.status = status

  await bank.save()

  res.status(200).json({
    message: 'Bank status updated successfully',
    data: bank,
  })
}

exports.postHarvestLoan = async (req, res, next) => {
  try {
    const [pledgeCount, warehouseCount] = await Promise.all([
      BankModel.countDocuments(),
      WarehouseModel.countDocuments(),
    ])

    res.status(200).json({
      pledgeCount,
      warehouseCount,
    })
  } catch (error) {
    next(error)
  }
}
