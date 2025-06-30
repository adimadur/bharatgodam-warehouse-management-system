const express = require('express')

const weighBridgeController = require('../controllers/weighbridge.controller')
const authorizeUser = require('../middlewares/roleMiddleware')

const weighBridgeRouter = express.Router()

/**
 * @url /api/weighbridge
 */

weighBridgeRouter.post(
  '/add',
  authorizeUser(['Warehouse owner', 'admin', 'manager']),
  weighBridgeController.addWeighBridgeData,
)

weighBridgeRouter.get(
  '/:id',
  authorizeUser(['Warehouse owner', 'admin', 'manager']),
  weighBridgeController.getWeighbridgeDataById,
)

weighBridgeRouter.get(
  '/',
  authorizeUser(['Warehouse owner', 'admin', 'manager']),
  weighBridgeController.fetchAllWeighBridge,
)

weighBridgeRouter.put(
  '/:id',
  authorizeUser(['Warehouse owner', 'admin', 'manager']),
  weighBridgeController.updateWeighBridge,
)

weighBridgeRouter.delete(
  '/:id',
  authorizeUser(['Warehouse owner', 'admin', 'manager']),
  weighBridgeController.deleteWeighBridge,
)

module.exports = weighBridgeRouter
