const mongoose = require('mongoose')

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },

    message: {
      type: String,
    },

    type: {
      type: String,
      enum: ['info', 'warning', 'error', 'success'],
      default: 'info',
    },

    status: {
      type: String,
      enum: ['sent', 'delivered', 'read'],
      default: 'sent',
    },

    metadata: {
      type: Map,
      of: String,
    },

    messageStatus: {
      type: String,
      enum: ['read', 'unread'],
      default: 'unread',
    },
  },
  { timestamps: true },
)

const NotificationModel = mongoose.model('Notification', notificationSchema)

module.exports = NotificationModel
