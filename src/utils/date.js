const dayjs = require('dayjs')

exports.getToday = (returnType, format = 'DD-MM-YYYY') => {
  const today = dayjs()
  switch (returnType) {
    case 'date':
      return today.toDate()
    case 'dayjs':
      return today
    default:
      return today.format(format).toString()
  }
}

exports.getDateRange = (filter) => {
  const now = dayjs()
  switch (filter) {
    case 'Today':
      return {
        from: now.startOf('day').toDate(),
        to: now.endOf('day').toDate(),
      }
    case 'Thisweek':
      return {
        from: now.startOf('week').toDate(),
        to: now.endOf('week').toDate(),
      }
    case 'Thismonth':
      return {
        from: now.startOf('month').toDate(),
        to: now.endOf('month').toDate(),
      }
    case 'Last3months':
      return {
        from: now.subtract(3, 'month').startOf('month').toDate(),
        to: now.endOf('month').toDate(),
      }
    case 'Last6months':
      return {
        from: now.subtract(6, 'month').startOf('month').toDate(),
        to: now.endOf('month').toDate(),
      }
    case 'Lastyear':
      return {
        from: now.subtract(1, 'year').startOf('year').toDate(),
        to: now.endOf('year').toDate(),
      }
    default:
      return {
        from: new Date(0),
        to: now.toDate(),
      }
  }
}
