exports.generateOTP = () => {
  return Math.floor(1000 + Math.random() * 9000).toString()
}

exports.generateOTPMail = () => {
  return Math.floor(10000 + Math.random() * 90000).toString()
}

exports.generateBookingId = () => {
  const prefix = 'BK-'
  const randomNumber = Math.floor(1000 + Math.random() * 9000)
  return `${prefix}${randomNumber}`
}

exports.generateInvoiceNumber = () => {
  const randomNum = Math.floor(1000 + Math.random() * 9000)

  const invoiceNumber = `IN-${randomNum}`

  return invoiceNumber
}

exports.generateTrackingId = () => {
  const randomNum = Math.floor(1000 + Math.random() * 9000)

  const trackingId = `TRK-${randomNum}`

  return trackingId
}

exports.generateLoanId = () => {
  const prefix = 'LN-'
  const randomNumber = Math.floor(Math.random() * 1000000)
  return `${prefix}${Date.now()}-${randomNumber}`
}
