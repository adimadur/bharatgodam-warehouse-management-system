const express = require('express')

const userRouter = require('./auth.routes')

const ShippingRouter = require('../routes/shipping.routes')

const wareHouseRouter = require('./warehouse.routes')

const bookingRouter = require('./booking.routes')

const weighBridgeRouter = require('./weighbridge.routes')

const fileRouter = require('./fileupload.routes')

const depositRouter = require('./deposit.routes')

const gradeRouter = require('./grade.routes')

const AdminRouter = require('./admin.routes')

const InvoiceRouter = require('./invoice.routes')

const loanRouter = require('./loan.routes')

const NotificationRouter = require('./notification.routes')

const CommodityRouter = require('./commodity.routes')

const router = express.Router()

router.get('/status', (req, res) => {
  logger.info(req.url)

  res.json({ message: 'Server is live!' })
})

router.use('/admin', AdminRouter) // ADMIN ROUTE

router.use('/auth', userRouter) // user Route

router.use('/warehouse', wareHouseRouter) // warehouse Route

router.use('/upload', fileRouter) // main image,other image and wdra_certicate for warehouse Route

router.use('/shipping', ShippingRouter) //shipping Route

router.use('/booking', bookingRouter) //booking Route

router.use('/weighbridge', weighBridgeRouter) // weighbridge Route

router.use('/deposit', depositRouter) // deposit Route

router.use('/grade', gradeRouter) // grade Route

router.use('/invoice', InvoiceRouter) // invoice Route

router.use('/loan', loanRouter) // loan Route

router.use('/notification', NotificationRouter) // notification Route

router.use('/commodity', CommodityRouter) // commodity Route

module.exports = router
