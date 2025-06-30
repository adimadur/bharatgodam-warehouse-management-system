const mongoose = require('mongoose')
const logger = require('../logger/winston.logger')
const chalk = require('chalk')

require('dotenv').config()
const dbUrl = process.env.MONGO_URL

exports.dbConnection = async () => {
  try {
    await mongoose.connect(dbUrl)
    logger.info(chalk.bold.blueBright('Database Connection Successful'))
  } catch (error) {
    logger.error(chalk.red.red(error))
  }
}
