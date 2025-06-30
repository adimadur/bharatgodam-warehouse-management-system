const express = require('express')

const wareHouseController = require('../controllers/warehouse.controller')

const authorizeUser = require('../middlewares/roleMiddleware')
const {
  validateCreateWarehouse,
} = require('../validators/warehouse.validators')

const wareHouseRouter = express.Router()

/**
 * @url /api/warehouse
 */

// Create a new warehouse
wareHouseRouter.post(
  '/',
  authorizeUser(['Warehouse owner', 'admin', 'manager']),
  validateCreateWarehouse,
  wareHouseController.createWarehouse,
)

// Read all warehouses
wareHouseRouter.get('/', wareHouseController.getWarehouses)

//search warehouse by filters
wareHouseRouter.get('/search', wareHouseController.searchWarehouse)

wareHouseRouter.get(
  '/owner',
  authorizeUser(['Warehouse owner', 'admin', 'manager']),
  wareHouseController.fetchAllWarehousesbyWarehouseOwnerId,
)

wareHouseRouter.get(
  '/manager-wh',
  authorizeUser(['manager']),
  wareHouseController.fetchAllWarehousesByManagerId,
)

wareHouseRouter.get(
  '/allManagers',
  authorizeUser(['Warehouse owner', 'admin']),
  wareHouseController.fetchallManagers,
)

// Read a single warehouse by ID
wareHouseRouter.get('/:id', wareHouseController.getWarehouseById)

wareHouseRouter.get(
  '/manager/:warehouse',
  wareHouseController.getMangagerByWarehouseId,
)

//add manager by warehouse owner
wareHouseRouter.put(
  '/add-manager',
  authorizeUser(['Warehouse owner', 'admin', 'manager']),
  wareHouseController.addManager,
)

// Update a warehouse by ID
wareHouseRouter.put(
  '/:id',
  authorizeUser(['Warehouse owner', 'admin', 'manager']),
  wareHouseController.updateWarehouse,
)

//Add Commodity
wareHouseRouter.put(
  '/commodity/:id',
  authorizeUser(['Warehouse owner', 'admin', 'manager']),
  wareHouseController.AddCommodity,
)

//Add Commodity in array
wareHouseRouter.put(
  '/commodity/array/:warehouseid',
  authorizeUser(['Warehouse owner', 'admin', 'manager']),
  wareHouseController.AddCommodities,
)

// Delete a warehouse by ID
wareHouseRouter.delete(
  '/:id',
  authorizeUser(['Warehouse owner', 'admin', 'manager']),
  wareHouseController.deleteWarehouse,
)

wareHouseRouter.get(
  '/managers/owner-all-managers',
  authorizeUser(['Warehouse owner']),
  wareHouseController.getMangagerByWarehouseOwnerId,
)

wareHouseRouter.put(
  '/:warehouseId/assign-manager/:managerId',
  authorizeUser(['Warehouse owner']),
  wareHouseController.assignManagerToWarehouse,
)

// For Admin Panel
wareHouseRouter.get(
  '/allWarehouse',
  authorizeUser(['admin']),
  wareHouseController.getAllWarehouses,
)

wareHouseRouter.get(
  '/get/allCommodities',
  authorizeUser(['Warehouse owner', 'admin', 'manager']),
  wareHouseController.getAllCommodities,
)

wareHouseRouter.get(
  '/get/warehouse/:id',
  authorizeUser(['Warehouse owner', 'admin', 'manager']),
  wareHouseController.getWarehouseByWarehouseObjectId,
)

wareHouseRouter.put(
  '/banks/:warehouseId',
  authorizeUser(['Warehouse owner', 'admin', 'manager']),
  wareHouseController.updateBankAccounts,
)

wareHouseRouter.post(
  '/rating',
  authorizeUser(['Warehouse owner', 'admin', 'manager', 'admin']),
  wareHouseController.addOrUpdateRating,
)

wareHouseRouter.post(
  '/add-wishlist/:warehouseId',
  authorizeUser(['Warehouse owner', 'admin', 'manager', 'admin']),
  wareHouseController.addWarehouseToWishlist,
)

wareHouseRouter.get(
  '/get-wishlist',
  authorizeUser(['Warehouse owner', 'admin', 'manager', 'admin']),
  wareHouseController.getWishlistWarehouses,
)

wareHouseRouter.delete(
  '/remove-wishlist/:warehouseId',
  authorizeUser(['Warehouse owner', 'admin', 'manager', 'admin']),
  wareHouseController.removeWarehouseFromWishlist,
)

module.exports = wareHouseRouter
