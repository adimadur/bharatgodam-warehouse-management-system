const dayjs = require('dayjs')

const kmPerLat = 110.567
const kmPerLng = 111.321

exports.kmToLat = (km) => km / kmPerLat

exports.latToKm = (lat) => lat * kmPerLat

exports.kmToLng = (km) => km / kmPerLng

exports.lngToKm = (lng) => lng * kmPerLng

exports.dateToStartTime = (date) =>
  dayjs(date)
    .set('hours', 0)
    .set('minutes', 0)
    .set('seconds', 0)
    .set('milliseconds', 0)
    .toDate()

exports.dateToEndTime = (date) =>
  dayjs(date)
    .set('hours', 23)
    .set('minutes', 59)
    .set('seconds', 59)
    .set('milliseconds', 999)
    .toDate()
