const cron = require('node-cron')

const dayjs = require('dayjs')

const BookingModel = require('../models/Bookingmodel')

cron.schedule('0 0 * * *', async () => {
  try {
    const currentDate = dayjs().format('YYYYMMDD')

    const expiredBookings = await BookingModel.find({
      fromDate: { $lt: dayjs().subtract(7, 'day').format('YYYYMMDD') },
      isBookingDeposited: false,
      status: { $ne: 'Expired' },
    })

    await BookingModel.updateMany(
      { _id: { $in: expiredBookings.map((booking) => booking._id) } },
      { $set: { status: 'Expired' } },
    )

    console.log('Expired bookings updated successfully.')
  } catch (error) {
    console.error('Error updating expired bookings:', error)
  }
})
