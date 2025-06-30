const express = require('express')
const authorizeUser = require('../middlewares/roleMiddleware')
const commodityController = require('../controllers/commodity.controller')
const CommodityRouter = express.Router()

CommodityRouter.post(
  '/add-commodity',
  authorizeUser(['Warehouse owner', 'admin', 'manager', 'Farmer']),
  commodityController.addCommodity,
)

CommodityRouter.post(
  '/add-bag/:commodityId',
  authorizeUser(['Warehouse owner', 'admin', 'manager', 'Farmer']),
  commodityController.addBagToCommodity,
)

CommodityRouter.get(
  '/fetch-all',
  authorizeUser(['Warehouse owner', 'admin', 'manager', 'Farmer']),
  commodityController.getAllCommodities,
)

module.exports = CommodityRouter
