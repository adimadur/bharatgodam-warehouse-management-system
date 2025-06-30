// deposit.routes.js
const express = require('express')

const gradeController = require('../controllers/grade.controller')

const authorizeUser = require('../middlewares/roleMiddleware')
const { validateAddGrade } = require('../validators/grade.validator')

const gradeRouter = express.Router()

gradeRouter.put(
  '/add/:depositId',
  authorizeUser(['Warehouse owner', 'admin', 'manager']),
  validateAddGrade,
  gradeController.addGrade,
)

gradeRouter.get('/search', gradeController.searchDeposit)

gradeRouter.get(
  '/fetch-all',
  authorizeUser(['Warehouse owner', 'admin', 'manager']),
  gradeController.getAllGrade,
)

gradeRouter.post(
  '/add-image/:id',
  authorizeUser(['Warehouse owner', 'admin', 'manager']),
  gradeController.addImagesForGrading,
)

module.exports = gradeRouter
