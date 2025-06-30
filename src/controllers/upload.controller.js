require('dotenv').config()
const Warehouse = require('../models/warehouse.model')
const s3 = require('../utils/aws')
const upload = require('../middlewares/fileupload.middleware')
const jwt = require('jsonwebtoken')
const { CustomError } = require('../middlewares/errorhandler.middleware')
const secretKey = process.env.JWT_SECRET
const { UserModel } = require('../models/user.model')
const NotificationModel = require('../models/notification.model')

exports.uploadController = async (req, res, next) => {
  upload.fields([
    { name: 'wdra_certificate', maxCount: 1 },
    { name: 'main_photo', maxCount: 10 },
    { name: 'other_photo', maxCount: 10 },
    { name: 'logo', maxCount: 1 },
  ])(req, res, async (error) => {
    if (error) {
      throw new CustomError(error)
    }

    try {
      const authHeader = req.headers.authorization
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new CustomError(
          'Authorization token not found or incorrect format',
          401,
        )
      }

      const token = authHeader.split(' ')[1]
      const decoded = jwt.verify(token, secretKey)
      const { role, _id: userId } = decoded.data

      if (role !== 'Warehouse owner' && role !== 'admin') {
        throw new CustomError('Unauthorized access', 403)
      }
      const warehouseId = req.params.id
      const warehouse = await Warehouse.findById(warehouseId)

      if (!warehouse) {
        return res.status(404).json({ error: 'Warehouse not found' })
      }

      const uploadToS3 = async (file, folder) => {
        const params = {
          Bucket: process.env.AWS_S3_BUCKET,
          Key: `${folder}/${Date.now().toString()}-${file.originalname}`,
          Body: file.buffer,
        }

        const data = await s3.upload(params).promise()
        return data.Location
      }

      if (req.files.wdra_certificate) {
        const wdraCertFile = req.files.wdra_certificate[0]
        const wdraCertData = await uploadToS3(wdraCertFile, 'wdra_certificates')
        warehouse.wdra_certificate = warehouse.wdra_certificate || []
        warehouse.wdra_certificate.push(wdraCertData)
      }

      if (req.files.main_photo) {
        const mainPhotos = []
        for (const file of req.files.main_photo) {
          const photoData = await uploadToS3(file, 'main_photos')
          mainPhotos.push(photoData)
        }
        warehouse.main_photo = warehouse.main_photo || []
        warehouse.main_photo = warehouse.main_photo.concat(mainPhotos)
      }

      if (req.files.other_photo) {
        const otherPhotos = []
        for (const file of req.files.other_photo) {
          const photoData = await uploadToS3(file, 'other_photos')
          otherPhotos.push(photoData)
        }
        warehouse.other_photo = warehouse.other_photo || []
        warehouse.other_photo = warehouse.other_photo.concat(otherPhotos)
      }

      if (req.files.logo) {
        const logoFile = req.files.logo[0]
        const logoData = await uploadToS3(logoFile, 'warehouse_logos')
        warehouse.logo = logoData
      }

      await warehouse.save()
      res
        .status(200)
        .json({ data: warehouse, message: 'File upload successful' })
    } catch (err) {
      next(err)
    }
  })
}

exports.uploadKycController = async (req, res, next) => {
  upload.fields([
    { name: 'aadharcard', maxCount: 1 },
    { name: 'pancard', maxCount: 1 },
  ])(req, res, async (error) => {
    if (error) {
      throw new CustomError(error)
    }

    try {
      const authHeader = req.headers.authorization
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new CustomError(
          'Authorization token not found or incorrect format',
          401,
        )
      }

      const token = authHeader.split(' ')[1]
      const decoded = jwt.verify(token, secretKey)
      const { _id: userId } = decoded.data

      const user = await UserModel.findById(userId)
      if (!user) {
        throw new CustomError('User not found', 404)
      }

      const uploadToS3 = async (file, folder) => {
        const params = {
          Bucket: process.env.AWS_S3_BUCKET,
          Key: `${folder}/${Date.now().toString()}-${file.originalname}`,
          Body: file.buffer,
        }

        const data = await s3.upload(params).promise()
        return data.Location
      }

      let aadharCardUploaded = false
      let panCardUploaded = false

      if (req.files.aadharcard) {
        const aadharCardFile = req.files.aadharcard[0]
        const aadharCardData = await uploadToS3(aadharCardFile, 'aadharcards')
        user.kyc.aadharcard = aadharCardData
        aadharCardUploaded = true
      }

      if (req.files.pancard) {
        const panCardFile = req.files.pancard[0]
        const panCardData = await uploadToS3(panCardFile, 'pancards')
        user.kyc.pancard = panCardData
        panCardUploaded = true
      }

      if (aadharCardUploaded || panCardUploaded) {
        user.isKycPending = true
      }

      await user.save()

      await NotificationModel.create({
        userId: user._id,
        message: 'You have successfully submitted the KYC',
        type: 'info',
        status: 'sent',
      })
      res.status(200).json({
        data: user,
        message: 'KYC upload successful and pending admin verification',
      })
    } catch (err) {
      next(err)
    }
  })
}
