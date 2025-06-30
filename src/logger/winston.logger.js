const { createLogger, transports } = require('winston')
const chalk = require('chalk')
require('dotenv').config()
const {
  AWS_CLOUD_WATCH_ACCESS_KEY,
  AWS_CLOUD_WATCH_SECRET_KEY,
  AWS_CLOUD_WATCH_REGION,
  NODE_ENV,
  AWS_CLOUD_LOG_GROUP,
} = process.env
const WinstonCloudwatch = require('winston-cloudwatch')
const { toString } = require('lodash')
const { getToday } = require('../utils/date')

const logger = createLogger()

if (NODE_ENV === 'development') {
  logger.add(
    new transports.File({
      filename: `logs/${getToday('string')}-info.log`,
      level: 'info',
    }),
  )
  logger.add(
    new transports.File({
      filename: `logs/${getToday('string')}-error.log`,
      level: 'error',
    }),
  )
  logger.add(
    new transports.Console({
      log({ message, level, error, id, date }, next) {
        const logs = { level, message: chalk.italic }
        if (id) logs.id = id
        if (date) logs.date = date
        if (error) logs.error = error

        let coloredLevel
        switch (level.toUpperCase()) {
          case 'ERROR':
            coloredLevel = chalk.black.bgRed(level.toUpperCase())
            break
          case 'WARN':
            coloredLevel = chalk.black.bgYellow(level.toUpperCase())
            break
          case 'INFO':
            coloredLevel = chalk.black.bgWhiteBright(level.toUpperCase())
            break
          case 'DEBUG':
            coloredLevel = chalk.black.bgYellowBright(level.toUpperCase())
            break
          default:
            coloredLevel = level
        }
        console.log(`${coloredLevel} ${message}`)
        next()
      },
    }),
  )
} else {
  logger.add(
    new WinstonCloudwatch({
      awsOptions: {
        credentials: {
          accessKeyId: AWS_CLOUD_WATCH_ACCESS_KEY,
          secretAccessKey: AWS_CLOUD_WATCH_SECRET_KEY,
        },
        region: AWS_CLOUD_WATCH_REGION,
      },
      logGroupName: AWS_CLOUD_LOG_GROUP,
      logStreamName: () => toString(getToday('string', 'YYYYMMDD')),
      jsonMessage: true,
    }),
  )
}

module.exports = logger
