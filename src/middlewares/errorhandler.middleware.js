function errorHandler(err, req, res, next) {
  if (!err) {
    return res.status(500).json({ error: 'Internal Server Error' })
  }

  console.error(err.stack)
  if (err instanceof CustomError) {
    return res.status(err.statusCode).json({ error: err.message })
  }
  return res.status(500).json({ error: err.message })
}

class CustomError extends Error {
  constructor(message, statusCode) {
    super(message)
    this.statusCode = statusCode || 500
  }
}

module.exports = { CustomError, errorHandler }
