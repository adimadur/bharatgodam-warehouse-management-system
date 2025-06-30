const express = require('express')
const uploadController = require('../controllers/upload.controller')

const fileRouter = express.Router()

//upload images and wdra certificate to warehouse
fileRouter.post('/:id', uploadController.uploadController)

module.exports = fileRouter
