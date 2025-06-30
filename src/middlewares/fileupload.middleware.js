const multer = require('multer')
const path = require('path')

const storage = multer.memoryStorage()

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname)
    if (
      ext !== '.png' &&
      ext !== '.jpg' &&
      ext !== '.jpeg' &&
      ext !== '.pdf' &&
      ext !== '.webp'
    ) {
      return cb(new Error('Only images and PDFs are allowed'), false)
    }
    cb(null, true)
  },
})

module.exports = upload
