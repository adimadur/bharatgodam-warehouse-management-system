const { CustomError } = require('../middlewares/errorhandler.middleware')
const NotificationModel = require('../models/notification.model')
const { UserModel } = require('../models/user.model')

exports.fetchNotifications = async (req, res, next) => {
  try {
    const user = req.user.userId

    const findUser = await UserModel.findById(user)
    if (!findUser) {
      throw new CustomError('user not found', 404)
    }

    const notifications = await NotificationModel.find({ userId: user })

    res.status(200).json({ data: notifications })
  } catch (error) {
    next(error)
  }
}

exports.updateStatusOfNotification = async (req, res, next) => {
  try {
    const user = req.user.userId

    const id = req.query.id

    const findUser = await UserModel.findById(user)
    if (!findUser) {
      throw new CustomError('user not found', 404)
    }

    await NotificationModel.findByIdAndUpdate(
      id,
      req.body,
      { new: true },
    )

    res.status(200).json({ message: 'notification updated' })
  } catch (error) {
    next(error)
  }
}
