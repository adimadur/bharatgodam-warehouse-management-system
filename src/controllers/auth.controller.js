const bcrypt = require('bcrypt')
require('dotenv').config()
const jwt = require('jsonwebtoken')
const { CustomError } = require('../middlewares/errorhandler.middleware')
const aws = require('aws-sdk')
const { generateOTP, generateOTPMail } = require('../utils/otpGenerator.utils')
const { UserModel } = require('../models/user.model')
const { transporter } = require('../utils/email')
const upload = require('../middlewares/fileupload.middleware')
const s3 = require('../utils/aws')
const NotificationModel = require('../models/notification.model')
const secretKey = process.env.JWT_SECRET
// AWS Config
const AccessKeyId = process.env.AWS_ACCESSKEY
const SecreteAccessKey = process.env.AWS_SECRET_ACCESS_KEY
const Region = process.env.AWS_REGION

aws.config.update({
  accessKeyId: AccessKeyId,
  secretAccessKey: SecreteAccessKey,
  region: Region,
})

const sns = new aws.SNS()

exports.signupWithPhone = async (req, res, next) => {
  try {
    const phone = req.body.phone

    const findPhone = await UserModel.findOne({ phone: phone })
    if (findPhone) {
      throw new CustomError('Phone number already exists!')
    }

    if (phone.length < 12) {
      throw new CustomError('phone length should not be less than 12')
    }
    const otp = generateOTP()

    const params = {
      Message: `Hello Welcome to BharatGodam. Your OTP for signup is ${otp}`,
      PhoneNumber: phone,
    }

    sns.publish(params, async (err, data) => {
      if (err) {
        next(new CustomError('Something went wrong', 500))
      } else {
        console.log('OTP sent successfully', data)
      }
    })

    const token = jwt.sign({ phone, otp }, secretKey, { expiresIn: '10m' })

    res.status(200).json({
      message: 'OTP sent successfully',
      token,
    })
  } catch (error) {
    next(error)
  }
}

exports.verifyOtpWithPhone = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new CustomError('Authorization token not found or incorrect format')
    }
    const token = authHeader.split(' ')[1]

    const { otp } = req.body
    if (!otp) {
      throw new CustomError('OTP is required')
    }

    const decoded = jwt.verify(token, secretKey)
    const { phone, otp: tokenOtp } = decoded

    if (otp !== tokenOtp) {
      throw new CustomError('Invalid OTP!')
    }

    const newToken = jwt.sign({ phone }, secretKey, { expiresIn: '1h' })

    res.status(200).json({
      token: newToken,
      message: 'OTP verified successfully',
    })
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      next(new CustomError('Token has expired!'))
    } else if (error.name === 'JsonWebTokenError') {
      next(new CustomError('Invalid token!'))
    } else {
      next(error)
    }
  }
}

exports.createAccountPhone = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new CustomError('Authorization token not found or incorrect format')
    }
    const token = authHeader.split(' ')[1]
    const { firstName, lastName, role } = req.body
    const decoded = jwt.verify(token, secretKey)
    const { phone } = decoded
    const findPhone = await UserModel.findOne({ phone: phone })
    if (findPhone) {
      throw new CustomError('phone number already exists', 404)
    }
    const newUser = await UserModel.create({
      phone: phone,
      firstName,
      lastName,
      role,
    })
    newUser.isMobileVerified = true
    await newUser.save()
    const newuserid = newUser._id

    const newToken = jwt.sign(
      {
        data: {
          phone,
          role,
          _id: newuserid,
          firstName,
          lastName,
        },
      },
      secretKey,
      { expiresIn: '1d' },
    )

    await NotificationModel.create({
      userId: newUser._id,
      message:
        'Welcome to the BharatGodam! Your account has been created successfully.',
      type: 'info',
      status: 'sent',
    })

    res.status(200).json({
      data: newUser,
      token: newToken,
      message: 'user signup successful',
    })
  } catch (error) {
    next(error)
  }
}

exports.createAccountPhoneForFarmer = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new CustomError('Authorization token not found or incorrect format')
    }
    const token = authHeader.split(' ')[1]
    const { firstName, lastName } = req.body
    const decoded = jwt.verify(token, secretKey)
    const { phone } = decoded
    const findPhone = await UserModel.findOne({ phone: phone })
    if (findPhone) {
      throw new CustomError('phone number already exists', 404)
    }
    const newToken = jwt.sign(
      {
        data: {
          phone,
          firstName,
          lastName,
        },
      },
      secretKey,
      { expiresIn: '1d' },
    )

    res.status(200).json({
      token: newToken,
      message: 'user signup successful',
    })
  } catch (error) {
    next(error)
  }
}
exports.updateRoleForFarmerWithPhone = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new CustomError('Authorization token not found or incorrect format')
    }
    const token = authHeader.split(' ')[1]
    const { role } = req.body
    const decoded = jwt.verify(token, secretKey)
    const { phone, firstName, lastName } = decoded.data
    const findPhone = await UserModel.findOne({ phone: phone })
    if (findPhone) {
      throw new CustomError('phone number already exists', 404)
    }
    const createNewFarmer = new UserModel({
      phone,
      firstName,
      lastName,
      role,
    })
    createNewFarmer.isEmailVerified = true
    await createNewFarmer.save()
    const newToken = jwt.sign(
      {
        data: {
          _id: createNewFarmer._id,
          phone,
          firstName,
          lastName,
          role,
        },
      },
      secretKey,
      { expiresIn: '1d' },
    )
    const newUser = UserModel.findOne({ phone: phone })
    await NotificationModel.create({
      userId: newUser._id,
      message:
        'Welcome to the BharatGodam! Your account has been created successfully.',
      type: 'info',
      status: 'sent',
    })

    res.status(201).json({
      data: createNewFarmer,
      token: newToken,
      message: 'farmer created successful',
    })
  } catch (error) {
    next(error)
  }
}

exports.signupWithEmail = async (req, res, next) => {
  try {
    const email = req.body.email

    const findEmail = await UserModel.findOne({ email: email })
    if (findEmail) {
      throw new CustomError('Email already exists!')
    }

    const otp = generateOTPMail()

    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: email,
      subject: 'Welcome to Bharat Godam | OTP code for Signup',
      html: `<p>Your OTP code is ${otp}</p>
             <br>
             <strong>Regards,</strong>
             <br>
             <strong>Bharat Godam</strong>`,
    }

    await transporter.sendMail(mailOptions)
    const user = await UserModel.findOne({ 'email.address': email })
    const token = jwt.sign({ email, otp }, secretKey, {
      expiresIn: process.env.EXPIRES_IN,
    })

    res.status(200).json({
      success: true,
      message: 'OTP sent successfully',
      token,
    })
  } catch (error) {
    next(error)
  }
}

exports.verifyOtpWithEmail = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new CustomError('Authorization token not found or incorrect format')
    }
    const token = authHeader.split(' ')[1]

    const { otp } = req.body
    if (!otp) {
      throw new CustomError('OTP is required')
    }

    const decoded = jwt.verify(token, secretKey)
    const { email, otp: tokenOtp } = decoded

    if (otp !== tokenOtp) {
      throw new CustomError('Invalid OTP!')
    }

    const newToken = jwt.sign({ email }, secretKey, { expiresIn: '1h' })

    res.status(200).json({
      message: 'OTP verified successfully',
      token: newToken,
    })
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      next(new CustomError('Token has expired!'))
    } else if (error.name === 'JsonWebTokenError') {
      next(new CustomError('Invalid token!'))
    } else {
      next(error)
    }
  }
}

exports.createAccountWithEmailForFarmer = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new CustomError('Authorization token not found or incorrect format')
    }
    const token = authHeader.split(' ')[1]
    const { firstName, lastName, password } = req.body
    const decoded = jwt.verify(token, secretKey)
    const { email } = decoded
    const findEmail = await UserModel.findOne({ email: email })
    if (findEmail) {
      throw new CustomError('Email already exists!')
    }
    const hashedPassword = await bcrypt.hash(password, 10)

    const newToken = jwt.sign(
      {
        data: {
          email,
          firstName,
          lastName,
          password: hashedPassword,
        },
      },
      secretKey,
      { expiresIn: '1d' },
    )

    res.status(200).json({
      token: newToken,
      message: 'user signup successful',
    })
  } catch (error) {
    next(error)
  }
}

exports.updateRoleForFarmer = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new CustomError('Authorization token not found or incorrect format')
    }
    const token = authHeader.split(' ')[1]
    const { role } = req.body
    const decoded = jwt.verify(token, secretKey)
    const { email, firstName, lastName, password } = decoded.data
    const findEmail = await UserModel.findOne({ email: email })
    if (findEmail) {
      throw new CustomError('Email already exists!')
    }
    const createNewFarmer = new UserModel({
      email,
      firstName,
      lastName,
      password,
      role,
    })
    createNewFarmer.isEmailVerified = true
    await createNewFarmer.save()

    const newToken = jwt.sign(
      {
        data: {
          email,
          firstName,
          lastName,
          password,
          role,
        },
      },
      secretKey,
      { expiresIn: '1d' },
    )

    res.status(201).json({
      data: createNewFarmer,
      token: newToken,
      message: 'farmer created successful',
    })
  } catch (error) {
    next(error)
  }
}

exports.createAccountEmail = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new CustomError('Authorization token not found or incorrect format')
    }
    const token = authHeader.split(' ')[1]
    const { firstName, lastName, role, password } = req.body
    const decoded = jwt.verify(token, secretKey)
    const { email } = decoded
    const hashedPassword = await bcrypt.hash(password, 10)
    const findEmail = await UserModel.findOne({ email: email })
    if (findEmail) {
      throw new CustomError('Email already exists!')
    }
    const newUser = await UserModel.create({
      email: email,
      firstName,
      lastName,
      role,
      password: hashedPassword,
    })
    newUser.isEmailVerified = true
    await newUser.save()
    const newuserid = newUser._id

    const newToken = jwt.sign(
      {
        data: {
          email,
          role,
          _id: newuserid,
          firstName,
          lastName,
        },
      },
      secretKey,
      { expiresIn: '1d' },
    )

    await NotificationModel.create({
      userId: newUser._id,
      message:
        'Welcome to the BharatGodam! Your account has been created successfully.',
      type: 'info',
      status: 'sent',
    })

    res.status(200).json({
      data: newUser,
      token: newToken,
      message: 'user signup successful',
    })
  } catch (error) {
    next(error)
  }
}

exports.loginWithPhone = async (req, res, next) => {
  try {
    const phone = req.body.phone
    const findPhone = await UserModel.findOne({ phone: phone })
    if (!findPhone) {
      throw new CustomError('phone does not exists!', 404)
    }
    const otp = generateOTP()

    const params = {
      Message: `Hello Welcome to BharatGodam. Your OTP for Login is ${otp}`,
      PhoneNumber: phone,
    }

    sns.publish(params, (err, data) => {
      if (err) {
        next(new CustomError('Something went wrong', 500))
      } else {
        console.log('OTP sent successfully', data)
      }
    })

    const token = jwt.sign({ phone, otp }, secretKey, { expiresIn: '10m' })

    res.status(200).json({
      message: 'OTP sent successfully',
      token,
    })
  } catch (error) {
    next(error)
  }
}

exports.verifyOtpWithPhoneLogin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new CustomError('Authorization token not found or incorrect format')
    }
    const token = authHeader.split(' ')[1]

    const { otp } = req.body
    if (!otp) {
      throw new CustomError('OTP is required')
    }

    const decoded = jwt.verify(token, secretKey)
    const { phone, otp: tokenOtp } = decoded

    if (otp !== tokenOtp) {
      throw new CustomError('Invalid OTP!')
    }

    const findPhone = await UserModel.findOne({ phone: phone })
    const id = findPhone._id
    const newToken = jwt.sign(
      { data: { phone, _id: id, role: findPhone.role } },
      secretKey,
      { expiresIn: '1d' },
    )

    res.status(200).json({
      message: 'OTP verified and logged in successfully',
      token: newToken,
      data: findPhone,
    })
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      next(new CustomError('Token has expired!'))
    } else if (error.name === 'JsonWebTokenError') {
      next(new CustomError('Invalid token!'))
    } else {
      next(error)
    }
  }
}

exports.loginWithEmail = async (req, res, next) => {
  try {
    const { email, password } = req.body

    const user = await UserModel.findOne({ email })
    if (!user) {
      throw new CustomError('user not found!', 404)
    }

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      throw new CustomError('Invalid Password', 401)
    }

    const token = jwt.sign(
      {
        data: {
          _id: user._id,
          email: user.email,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName,
        },
      },
      secretKey,
      { expiresIn: '1d' },
    )

    res.status(200).json({
      data: user,
      message: 'Login successful',
      token,
    })
  } catch (error) {
    next(error)
  }
}

exports.ResetPassword = async (req, res, next) => {
  try {
    const email = req.body.email
    const findEmail = await UserModel.findOne({ email: email })
    if (!findEmail) {
      throw new CustomError('email does not exists', 404)
    }
    const otp = generateOTPMail()

    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: email,
      subject: 'Welcome to Bharat Godam | OTP code for Reset Password',
      html: `<p>Your OTP code is ${otp}</p>
             <br>
             <strong>Regards,</strong>
             <br>
             <strong>Bharat Godam</strong>`,
    }

    await transporter.sendMail(mailOptions)

    const token = jwt.sign({ email, otp }, secretKey, { expiresIn: '5m' })
    res.status(200).json({
      token,
      message: 'otp for reset password sent successfully',
    })
  } catch (error) {
    next(error)
  }
}

exports.verifyResetPassword = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new CustomError(
        'Authorization token not found or incorrect format',
        401,
      )
    }
    const token = authHeader.split(' ')[1]

    const { otp } = req.body
    if (!otp) {
      throw new CustomError('OTP is required', 400)
    }

    const decoded = jwt.verify(token, secretKey)
    const { email, otp: tokenOtp } = decoded

    if (otp !== tokenOtp) {
      throw new CustomError('Invalid OTP!', 401)
    }

    res.status(200).json({
      message: 'OTP verified successfully',
    })
  } catch (error) {
    next(error)
  }
}

exports.updatePassword = async (req, res, next) => {
  try {
    const { email, newPassword } = req.body

    if (!email || !newPassword) {
      throw new CustomError('Email and newPassword are required', 400)
    }

    const user = await UserModel.findOne({ email })
    if (!user) {
      throw new CustomError('User not found', 404)
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10)

    user.password = hashedPassword
    await user.save()

    res.status(200).json({
      data: user,
      message: 'Password updated successfully',
    })
  } catch (error) {
    next(error)
  }
}

exports.deleteUser = async (req, res, next) => {
  try {
    const user = await UserModel.findByIdAndDelete(req.params.id)
    if (!user) {
      throw new CustomError('warehouse not found', 404)
    }
    res.status(200).json({ message: 'user deleted successfully' })
  } catch (err) {
    next(err)
  }
}

exports.uploadControllerForProfilePic = async (req, res, next) => {
  upload.single('profilePicture')(req, res, async (error) => {
    if (error) {
      return next(new CustomError(error))
    }

    try {
      const authHeader = req.headers.authorization
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new CustomError(
          'Authorization token not found or incorrect format',
          401,
        )
      }

      const token = authHeader.split(' ')[1]
      const decoded = jwt.verify(token, secretKey)
      const { _id: userId } = decoded.data

      if (!req.file) {
        throw new CustomError('No file uploaded', 400)
      }

      const profilePicFile = req.file

      const uploadToS3 = async (file, folder) => {
        const params = {
          Bucket: process.env.AWS_S3_BUCKET,
          Key: `${folder}/${Date.now().toString()}-${file.originalname}`,
          Body: file.buffer,
        }

        const data = await s3.upload(params).promise()
        return data.Location
      }

      const profilePicData = await uploadToS3(
        profilePicFile,
        'profile_pictures',
      )

      const updatedUser = await UserModel.findByIdAndUpdate(
        userId,
        { profilePicture: profilePicData },
        { new: true },
      )

      if (!updatedUser) {
        return res.status(404).json({ error: 'User not found' })
      }

      res.status(200).json({
        data: updatedUser,
        message: 'Profile Picture Uploaded Successfully',
      })
    } catch (err) {
      next(err)
    }
  })
}

exports.fetchUserById = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new CustomError('Authorization token not found or incorrect format')
    }
    const token = authHeader.split(' ')[1]

    const decoded = jwt.verify(token, secretKey)
    const { _id: UserId } = decoded.data

    const findUser = await UserModel.findById({ _id: UserId })
    if (!findUser) {
      throw new CustomError('user not found in the database', 404)
    }

    res.status(200).json({
      data: findUser,
      message: 'User Data Fetched Successfully',
    })
  } catch (error) {
    next(error)
  }
}

exports.FetchUserDataById = async (req, res, next) => {
  try {
    const userId = req.params.id

    const findUser = await UserModel.findById({ _id: userId })
    if (!findUser) {
      throw new CustomError('user not found in the database', 404)
    }

    res.status(200).json({
      data: findUser,
      message: 'User Data Fetched Successfully',
    })
  } catch (error) {
    next(error)
  }
}

exports.updateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new CustomError(
        'Authorization token not found or incorrect format',
        401,
      )
    }

    const token = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, secretKey)
    const { _id: userId } = decoded.data

    const updates = req.body

    const nameRegex = /^[a-zA-Z\s]+$/

    if (updates.firstName && !nameRegex.test(updates.firstName)) {
      return res
        .status(400)
        .json({ error: 'Firstname should only contain letters and spaces' })
    }

    if (updates.lastName && !nameRegex.test(updates.lastName)) {
      return res
        .status(400)
        .json({ error: 'Lastname should only contain letters and spaces' })
    }

    if (updates.name && !nameRegex.test(updates.name)) {
      return res
        .status(400)
        .json({ error: 'Name should only contain letters and spaces' })
    }

    const updatedUser = await UserModel.findByIdAndUpdate(userId, updates, {
      new: true,
    })

    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' })
    }

    res.status(200).json({
      data: updatedUser,
      message: 'User information updated successfully',
    })
  } catch (err) {
    next(err)
  }
}

// Get all Farmer / FPO / Trader users (For Admin Panel)
exports.getCertainUsers = async (req, res, next) => {
  try {
    const users = await UserModel.find({
      role: { $in: ['Farmer', 'FPO', 'Trader'] },
    }).exec()

    res.status(200).json({
      data: users,
      message: 'users (farmer, fpo and traders) fetched successfully',
    })
  } catch (error) {
    next(err)
  }
}

// Get User and KYC details (ID - 10)
exports.getUserAndKycDetails = async (req, res, next) => {
  try {
    const users = await UserModel.find(
      {},
      'profilePicture firstName lastName role kyc isActive isVerified',
    ).exec()

    res.status(200).json({
      data: users,
      message: 'User details fetched successfully',
    })
  } catch (error) {
    next(err)
  }
}

exports.deleteProfilePic = async (req, res, next) => {
  try {
    const userId = req.user.userId

    const user = await UserModel.findById(userId)

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    user.profilePicture = null

    await user.save()

    return res
      .status(200)
      .json({ message: 'Profile picture deleted successfully' })
  } catch (error) {
    next(error)
  }
}
