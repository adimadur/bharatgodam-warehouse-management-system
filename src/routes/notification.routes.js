const express = require('express')

const authorizeUser = require('../middlewares/roleMiddleware')

const NotificationController = require('../controllers/notification.controller')

const NotificationRouter = express.Router()

/**
 * @url /api/notification
 */

NotificationRouter.get(
  '/',
  authorizeUser(['Warehouse owner', 'admin', 'manager', 'Farmer']),
  NotificationController.fetchNotifications,
)

NotificationRouter.patch(
  '/update-status',
  authorizeUser(['Warehouse owner', 'admin', 'manager', 'Farmer']),
  NotificationController.updateStatusOfNotification,
)

module.exports = NotificationRouter
