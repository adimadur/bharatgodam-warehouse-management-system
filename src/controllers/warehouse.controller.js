require('dotenv').config()
const { CustomError } = require('../middlewares/errorhandler.middleware')
const { UserModel } = require('../models/user.model')
const WarehouseModel = require('../models/warehouse.model')
const Warehouse = require('../models/warehouse.model')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const { default: mongoose } = require('mongoose')
const NotificationModel = require('../models/notification.model')

exports.createWarehouse = async (req, res, next) => {
  try {
    const userId = req.user.userId

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
      manager,
    } = req.body

    if (filled_capacity > total_capacity) {
      throw new CustomError(
        'Filled Capacity should always be less than Total Capacity',
        400,
      )
    }

    const remainingCapacity = total_capacity - filled_capacity

    if (manager) {
      const managerUser = await UserModel.findById({ _id: manager })
      if (!managerUser) {
        throw new CustomError('Manager not found', 404)
      }
    }

    const warehouseData = {
      User: userId,
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
      Photos,
      manager,
    }

    const warehouse = new Warehouse(warehouseData)

    await UserModel.findByIdAndUpdate(
      userId,
      { $push: { warehouse: warehouse._id } },
      { new: true, useFindAndModify: false },
    )

    await warehouse.save()

    await NotificationModel.create({
      userId: userId,
      message: "Warehouse added Successfully. Now let's add some details...",
      type: 'info',
      status: 'sent',
    })

    res
      .status(201)
      .json({ data: warehouse, message: 'warehouse added successfully' })
  } catch (err) {
    if (err instanceof jwt.JsonWebTokenError) {
      throw new CustomError('Invalid Token', 401)
    } else {
      next(err)
    }
  }
}

exports.getWarehouses = async (req, res, next) => {
  try {
    const warehouses = await Warehouse.find().populate('User manager Commodity')
    res
      .status(200)
      .json({ data: warehouses, message: 'warehouse fetched successfully' })
  } catch (err) {
    next(err)
  }
}

exports.getWarehouseById = async (req, res, next) => {
  try {
    const warehouse = await Warehouse.findById(req.params.id).populate(
      'User manager',
    )
    if (!warehouse) {
      throw new CustomError('warehouse not found', 404)
    }
    res
      .status(200)
      .json({ data: warehouse, message: 'warehouse fetched successfully' })
  } catch (err) {
    next(err)
  }
}

exports.updateWarehouse = async (req, res, next) => {
  try {
    const warehouse = await Warehouse.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true },
    )
    if (!warehouse) {
      throw new CustomError('warehouse not found', 404)
    }
    res
      .status(200)
      .json({ data: warehouse, message: 'warehouse updated successfully' })
  } catch (err) {
    next(err)
  }
}

exports.deleteWarehouse = async (req, res, next) => {
  try {
    const warehouse = await Warehouse.findByIdAndDelete(req.params.id)
    if (!warehouse) {
      throw new CustomError('warehouse not found', 404)
    }
    res.status(200).json({ message: 'Warehouse deleted successfully' })
  } catch (err) {
    next(err)
  }
}

exports.AddCommodity = async (req, res, next) => {
  try {
    const userId = req.user.userId
    const { id } = req.params
    const { isActive, isArchived, name, weight, price_perday } = req.body

    if (!name || !weight || !price_perday) {
      throw new CustomError('Name, weight, and price per day are required', 400)
    }

    const warehouse = await WarehouseModel.findById(id)

    if (!warehouse) {
      throw new CustomError('Warehouse not found', 404)
    }

    warehouse.isActive = isActive || false
    warehouse.isArchived = isArchived || false

    const existingCommodity = warehouse.Commodity.find(
      (commodity) =>
        commodity.name === name &&
        commodity.price_perday.some((price) => price.weight === weight),
    )

    if (existingCommodity) {
      const existingPrice = existingCommodity.price_perday.find(
        (price) => price.weight === weight,
      )
      if (existingPrice) {
        existingPrice.price = price_perday
      }
    } else {
      const existingCommodityByName = warehouse.Commodity.find(
        (commodity) => commodity.name === name,
      )

      if (existingCommodityByName) {
        existingCommodityByName.price_perday.push({
          weight,
          price: price_perday,
        })
      } else {
        const newCommodity = {
          name,
          price_perday: [{ weight, price: price_perday }],
          AddedBy: userId,
        }
        warehouse.Commodity.push(newCommodity)
      }
    }
    warehouse.User = userId
    await warehouse.save()

    res
      .status(200)
      .json({ data: warehouse, message: 'Warehouse updated successfully' })
  } catch (error) {
    next(error)
  }
}

exports.searchWarehouse = async (req, res, next) => {
  try {
    const {
      locality_area,
      landmark,
      pincode,
      city,
      State,
      mobile_number,
      startDate,
      endDate,
      commodity_name,
      weight,
      price_perday,
    } = req.query

    if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
      return res
        .status(400)
        .json({ message: 'End date cannot be before start date' })
    }

    const query = {}

    if (locality_area) {
      query.locality_area = { $regex: locality_area, $options: 'i' }
    }

    if (landmark) {
      query.landmark = { $regex: landmark, $options: 'i' }
    }

    if (pincode) {
      query.pincode = pincode
    }

    if (city) {
      query.city = { $regex: city, $options: 'i' }
    }

    if (State) {
      query.State = { $regex: State, $options: 'i' }
    }

    if (mobile_number) {
      query.mobile_number = mobile_number
    }

    if (startDate || endDate) {
      query.createdAt = {}
      if (startDate) {
        query.createdAt.$gte = new Date(startDate)
      }
      if (endDate) {
        const endOfDay = new Date(endDate)
        endOfDay.setHours(23, 59, 59, 999)
        query.createdAt.$lte = endOfDay
      }
      if (Object.keys(query.createdAt).length === 0) {
        delete query.createdAt
      }
    }

    if (commodity_name || weight || price_perday) {
      query.Commodity = {
        $elemMatch: {},
      }
      if (commodity_name) {
        query.Commodity.$elemMatch.name = {
          $regex: commodity_name,
          $options: 'i',
        }
      }
      if (weight) {
        query.Commodity.$elemMatch['price_perday.weight'] = {
          $regex: weight,
          $options: 'i',
        }
      }
      if (price_perday) {
        query.Commodity.$elemMatch['price_perday.price'] = price_perday
      }
    }

    const warehouses = await WarehouseModel.find(query)
    res.status(200).json({ data: warehouses, message: 'Fetched successfully' })
  } catch (error) {
    next(error)
  }
}

exports.fetchAllWarehousesbyWarehouseOwnerId = async (req, res) => {
  try {
    const userId = req.user.userId

    const warehouses = await WarehouseModel.find({ User: userId })
    res.status(200).json({
      data: warehouses,
      message: 'warehouses fetched successfully',
    })
  } catch (error) {
    next(error)
  }
}

exports.fetchAllWarehousesByManagerId = async (req, res, next) => {
  try {
    const userId = req.user.userId
    const warehouses = await WarehouseModel.find({ manager: userId })
    res.status(200).json({
      data: warehouses,
      message: 'warehouses fetched successfully',
    })
  } catch (error) {
    next(error)
  }
}

exports.addManager = async (req, res, next) => {
  try {
    const ownerId = req.user.userId
    const { managerName, email, password } = req.body

    const saltRounds = 10
    const hashedPassword = await bcrypt.hash(password, saltRounds)
    const findEmail = await UserModel.findOne({ email: email })
    console.log(findEmail)
    if (findEmail) {
      throw new CustomError('user already exists', 404)
    }
    const newManager = new UserModel({
      firstName: managerName,
      email,
      password: hashedPassword,
      role: 'manager',
      isEmailVerified: true,
      warehouseOwnerId: ownerId,
    })
    await newManager.save()

    await NotificationModel.create({
      userId: ownerId,
      message: `New Manager created successfully - '${managerName}'`,
      type: 'info',
      status: 'sent',
    })

    res.status(200).json({
      manager: newManager,
      message: 'Manager added successfully',
    })
  } catch (error) {
    next(error)
  }
}

exports.getMangagerByWarehouseId = async (req, res, next) => {
  try {
    const findWarehouse = await WarehouseModel.findById(
      req.params.warehouse,
    ).populate('manager')
    if (!findWarehouse) {
      throw new CustomError('Warehouse not found', 404)
    }
    res.status(200).json({
      data: findWarehouse.manager,
      message: 'Warehouse fetched successfully',
    })
  } catch (error) {
    next(error)
  }
}

exports.AddCommodities = async (req, res, next) => {
  try {
    const userId = req.user.userId
    const { warehouseid } = req.params
    const { isActive, isArchived, commodities } = req.body

    if (
      !commodities ||
      !Array.isArray(commodities) ||
      commodities.length === 0
    ) {
      throw new CustomError(
        'Commodities array is required and must not be empty',
        400,
      )
    }

    const warehouse = await WarehouseModel.findById(warehouseid)

    if (!warehouse) {
      throw new CustomError('Warehouse not found', 404)
    }

    warehouse.isActive = isActive || false
    warehouse.isArchived = isArchived || false

    commodities.forEach(({ name, weight, price_perday }) => {
      if (!name || !weight || !price_perday) {
        throw new CustomError(
          'Name, weight, and price per day are required for each commodity',
          400,
        )
      }

      const existingCommodity = warehouse.Commodity.find(
        (commodity) =>
          commodity.name === name &&
          commodity.price_perday.some((price) => price.weight === weight),
      )

      if (existingCommodity) {
        const existingPrice = existingCommodity.price_perday.find(
          (price) => price.weight === weight,
        )
        if (existingPrice) {
          existingPrice.price = price_perday
        }
      } else {
        const existingCommodityByName = warehouse.Commodity.find(
          (commodity) => commodity.name === name,
        )

        if (existingCommodityByName) {
          existingCommodityByName.price_perday.push({
            weight,
            price: price_perday,
          })
        } else {
          const newCommodity = {
            name,
            price_perday: [{ weight, price: price_perday }],
            AddedBy: userId,
          }
          warehouse.Commodity.push(newCommodity)
        }
      }
    })

    warehouse.User = userId
    await warehouse.save()

    res.status(200).json({
      data: warehouse,
      message: 'Warehouse commodities updated successfully',
    })
  } catch (error) {
    next(error)
  }
}

exports.fetchallManagers = async (req, res, next) => {
  try {
    const userId = req.user.userId
    const warehouses = await Warehouse.aggregate([
      { $match: { User: new mongoose.Types.ObjectId(userId) } },
      {
        $lookup: {
          from: 'users',
          localField: 'manager',
          foreignField: '_id',
          as: 'managerDetails',
        },
      },
      { $unwind: '$managerDetails' },
      {
        $group: {
          _id: '$manager',
          managerDetails: { $first: '$managerDetails' },
        },
      },
      {
        $project: {
          _id: 0,
          managerId: '$_id',
          managerDetails: 1,
        },
      },
    ])

    res.status(200).json({ data: warehouses })
  } catch (err) {
    next(err)
  }
}

exports.getMangagerByWarehouseOwnerId = async (req, res, next) => {
  try {
    const ownerId = req.user.userId
    const managers = await UserModel.find({
      role: 'manager',
      warehouseOwnerId: ownerId,
    })
    return res.status(200).send({ data: managers })
  } catch (err) {
    next(err)
  }
}

exports.assignManagerToWarehouse = async (req, res, next) => {
  try {
    const { warehouseId, managerId } = req.params
    const warehouse = await WarehouseModel.findById(warehouseId)
    if (!warehouse) {
      return res.status(404).send({ message: 'Warehouse not found' })
    }
    const manager = await UserModel.findById(managerId)
    if (!manager) {
      return res.status(404).send({ message: 'Manager not found' })
    }
    if (manager.role !== 'manager') {
      return res.status(404).send({ message: 'User is not a manager' })
    }
    warehouse.manager = managerId
    if (!manager.managedWarehouse.includes(warehouseId)) {
      manager.managedWarehouse.push(warehouseId)
    }
    await warehouse.save()
    await manager.save()

    await NotificationModel.create({
      userId: warehouseId,
      message: `You have added ${manager.firstName} as a Manager`,
      type: 'info',
      status: 'sent',
    })

    await NotificationModel.create({
      userId: managerId,
      message: `You were added as a Manager to warehouse ${warehouse.warehouse_name}`,
      type: 'info',
      status: 'sent',
    })

    res.status(200).send({ message: 'Manager is assigned to warehouse' })
  } catch (err) {
    next(err)
  }
}

// Get all warehouses (ID - 10)
exports.getAllWarehouses = async (req, res, next) => {
  try {
    const warehouses = await WarehouseModel.find(
      {},
      'logo warehouse_name total_capacity remainingCapacity',
    )
    res
      .status(200)
      .json({ data: warehouses, message: 'warehouses fetched successfully' })
  } catch (err) {
    next(err)
  }
}

// Get all Commodities of All Warehouses (ID - 10)
exports.getAllCommodities = async (req, res, next) => {
  try {
    const warehouses = await WarehouseModel.find({}, 'Commodity').lean()

    if (warehouses.length === 0) {
      return res.status(404).json({
        message: 'No Commodities found',
      })
    }

    const allCommodities = warehouses.reduce((acc, onewarehouse) => {
      return acc.concat(onewarehouse.Commodity)
    }, [])

    res.status(200).json({
      message: 'All Commodities found successfully',
      data: allCommodities,
    })
  } catch (error) {
    next(error)
  }
}

// Get a certain Warehouse's details by it's ObjectId (For Warehouse Dashboard)
exports.getWarehouseByWarehouseObjectId = async (req, res, next) => {
  try {
    const warehouseId = req.params.id
    const warehouse = await WarehouseModel.findById(
      warehouseId,
      'total_capacity remainingCapacity Commodity',
    ).lean()
    if (!warehouse) {
      return res
        .status(404)
        .json({ message: 'No Warehouse found for this ObjectId' })
    }

    return res.status(200).json({
      message: 'Warehouse Capacity and Commodities fetched successfully',
      data: warehouse,
    })
  } catch (error) {
    next(error)
  }
}

exports.updateBankAccounts = async (req, res, next) => {
  try {
    if (!req.params.warehouseId || !req.body.bankAccount) {
      return res
        .status(400)
        .json({ message: 'Warehouse ID and bank account details are required' })
    }

    const updatedWarehouse = await WarehouseModel.findByIdAndUpdate(
      req.params.warehouseId,
      { $push: { bank_accounts: req.body.bankAccount } },
      { new: true },
    )

    if (!updatedWarehouse) {
      return res.status(404).json({ message: 'Warehouse not found' })
    }

    res.status(200).json({
      message: 'Bank account added successfully',
      data: updatedWarehouse,
    })
  } catch (error) {
    next(error)
  }
}

const updateAverageRating = async (warehouseId) => {
  const warehouse = await WarehouseModel.findById(warehouseId)
  if (warehouse.ratings.length > 0) {
    const totalRatings = warehouse.ratings.reduce(
      (sum, rating) => sum + rating.rating,
      0,
    )
    const avgRating = totalRatings / warehouse.ratings.length
    warehouse.avgRating = avgRating
    await warehouse.save()
  }
}

exports.addOrUpdateRating = async (req, res, next) => {
  const { warehouseId, rating } = req.body
  const userId = req.user.userId

  try {
    const warehouse = await WarehouseModel.findById(warehouseId)

    if (!warehouse) {
      return res.status(404).json({ message: 'Warehouse not found' })
    }

    const existingRating = warehouse.ratings.find(
      (r) => r.user.toString() === userId.toString(),
    )

    if (existingRating) {
      existingRating.rating = rating
    } else {
      warehouse.ratings.push({ user: userId, rating })
    }

    await warehouse.save()
    await updateAverageRating(warehouseId)

    res.status(200).json({ message: 'Rating added/updated successfully' })
  } catch (error) {
    next(error)
  }
}

exports.addWarehouseToWishlist = async (req, res, next) => {
  try {
    const userId = req.user.userId
    const { warehouseId } = req.params

    // Validate the warehouse ID
    if (!mongoose.Types.ObjectId.isValid(warehouseId)) {
      throw new CustomError('Invalid warehouse ID', 400)
    }

    const user = await UserModel.findById(userId)
    if (!user) {
      throw new CustomError('User not found', 404)
    }

    if (user.warehouseWishlist.includes(warehouseId)) {
      throw new CustomError('Warehouse already in wishlist', 400)
    }

    // Add warehouse to wishlist
    user.warehouseWishlist.push(warehouseId)
    await user.save()

    res.status(200).json({
      message: 'Warehouse added to wishlist successfully',
      data: user.warehouseWishlist,
    })
  } catch (error) {
    next(error)
  }
}

exports.getWishlistWarehouses = async (req, res, next) => {
  try {
    const userId = req.user.userId

    const user = await UserModel.findById(userId).populate({
      path: 'warehouseWishlist',
    })

    if (!user) {
      throw new CustomError('User not found', 404)
    }

    res.status(200).json({
      message: 'Warehouse Wishlist fetched successfully',
      data: user.warehouseWishlist,
    })
  } catch (error) {
    next(error)
  }
}

exports.removeWarehouseFromWishlist = async (req, res, next) => {
  try {
    const userId = req.user.userId
    const { warehouseId } = req.params

    if (!mongoose.Types.ObjectId.isValid(warehouseId)) {
      throw new CustomError('Invalid warehouse ID', 400)
    }

    const user = await UserModel.findById(userId)
    if (!user) {
      throw new CustomError('User not found', 404)
    }

    const index = user.warehouseWishlist.indexOf(warehouseId)
    if (index === -1) {
      throw new CustomError('Warehouse not found in wishlist', 404)
    }

    user.warehouseWishlist.splice(index, 1)
    await user.save()

    res.status(200).json({
      message: 'Warehouse removed from wishlist successfully',
      data: user.warehouseWishlist,
    })
  } catch (error) {
    next(error)
  }
}
