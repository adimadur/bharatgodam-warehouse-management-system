const commodityModel = require('../models/commodity.model')
const { CustomError } = require('../middlewares/errorhandler.middleware')

exports.addCommodity = async (req, res, next) => {
  try {
    const { name, bags } = req.body
    if (!name || !bags) {
      throw new CustomError('Name and Bags must be provided', 400)
    }
    const commodity = await commodityModel.create({
      name: name.toLowerCase(),
      bags,
      active: true,
    })
    if (!commodity) {
      throw new CustomError('There was an issue in creating a commodity', 400)
    }

    res.status(200).json({
      message: 'Commodity Added Successfully!',
      data: commodity,
    })
  } catch (error) {
    next(error)
  }
}

exports.addBagToCommodity = async (req, res, next) => {
  try {
    const { commodityId } = req.params
    const commodity = await commodityModel.findById(commodityId)
    const { bagSize } = req.body
    if (!bagSize) {
      throw new CustomError('bagSize must be provided', 400)
    }

    if (!commodity) {
      throw new CustomError('Commodity not found', 404)
    }

    const bag = [...commodity.bags, bagSize]
    commodity.bags = bag
    await commodity.save()

    res.status(200).json({
      message: `Bag Size ${bagSize} was added successfully to commodity ${commodity.name}`,
      data: commodity,
    })
  } catch (error) {
    next(error)
  }
}

exports.getAllCommodities = async (req, res, next) => {
  try {
    const commodities = await commodityModel.find()
    if (!commodities || commodities.length === 0) {
      throw new CustomError('No Commodities Found', 404)
    }

    res.status(200).json({
      message: 'Commodities fetched successfully',
      data: commodities,
    })
  } catch (error) {
    next(error)
  }
}
