const express = require('express')
const bodyParser = require('body-parser')
const app = express()
const chalk = require('chalk')

const { dbConnection } = require('./src/config/db.config')

require('dotenv').config()
const port = process.env.PORT
const cors = require('cors')
const { errorHandler } = require('./src/middlewares/errorhandler.middleware')
const logger = require('./src/logger/winston.logger')

app.use(cors())

app.use(bodyParser.json())

app.get('/', (req, res) => {
  // res.type('text').send('Welcome to bharat-Godam !\n\nAPI Docs available at: https://www.postman.com/security-saganist-92445886/bharatgodam-wms')
  res.send(`
    <h1>Welcome to Bharat-Godam</h1>
    <p>API Docs available at <a href="https://www.postman.com/security-saganist-92445886/bharatgodam-wms" target="_blank">https://www.postman.com/security-saganist-92445886/bharatgodam-wms</a></p>
  `)
})

const logMiddleware = (req, res, next) => {
  const logMessage = `[${new Date().toISOString()}] ${req.method} ${
    req.url
  } - ${req.ip} - ${JSON.stringify(req.body)}`

  const startTime = Date.now()

  res.on('finish', () => {
    const endTime = Date.now()
    const responseTime = endTime - startTime

    const responseLogMessage = `${logMessage} - Status: ${res.statusCode} - Response Time: ${responseTime}ms`

    if (res.statusCode >= 400) {
      coloredLogMessage = logger.error(chalk.red.red(responseLogMessage))
    } else {
      coloredLogMessage = logger.info(chalk.bold.blueBright(responseLogMessage))
    }
  })

  next()
}

app.use(logMiddleware)

/**
 * routes
 * @url /api
 */
app.use('/api', require('./src/routes/index'))

require('./src/controllers/expiredBookings.controller')

app.use(
  cors({
    origin: ['http://localhost:3000'],
    methods: 'GET, POST, PUT, DELETE, OPTIONS',
    allowedHeaders: 'Origin, X-Requested-With, Content-Type, Accept',
  }),
)

app.use(errorHandler)

logger.info(
  `${chalk.bold.blueBright(
    'Express application running in',
  )} ${chalk.black.bold.bgCyan(process.env.NODE_ENV)} environment`,
)

/**
 * server initialization
 */
app.listen(port, async () => {
  logger.info(
    `${chalk.bold.blueBright(
      'Server started at port',
    )}: ${chalk.bold.blueBright(port)}, in ${chalk.black.bgGreenBright(
      ` ${process.env.NODE_ENV} `,
    )} mode`,
  )

  await dbConnection()
  logger.info(
    `${chalk.greenBright('API Docs available at:')} ${chalk.underline.blue(
      'https://www.postman.com/security-saganist-92445886/bharatgodam-wms',
    )}`,
  )
})
