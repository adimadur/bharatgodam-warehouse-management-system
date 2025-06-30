const logger = require('../logger/winston.logger')

exports.requestLogger = (req, res, next) => {
  req.logger = logger
  next()
}
