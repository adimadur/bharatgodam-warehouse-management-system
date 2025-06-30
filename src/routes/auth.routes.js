const express = require('express')

const authController = require('../controllers/auth.controller')

const { uploadKycController } = require('../controllers/upload.controller')

const authorizeUser = require('../middlewares/roleMiddleware')
const {
  validateSignUpWithPhone,
  validateSignUpWithEmail,
  validateOtp,
} = require('../validators/auth.validator')

/**
 * @url /api/auth
 */

const authRouter = express.Router()

authRouter.post(
  '/signup/phone',
  validateSignUpWithPhone,
  authController.signupWithPhone,
) // signup with phone

authRouter.post('/verify-otp/phone', authController.verifyOtpWithPhone) // verify otp for phone

authRouter.post('/create/phone', authController.createAccountPhone)

authRouter.post(
  '/signup/email',
  validateSignUpWithEmail,
  authController.signupWithEmail,
)

authRouter.post('/verify-otp/email', authController.verifyOtpWithEmail)

authRouter.post('/create/email', authController.createAccountEmail)

authRouter.post('/login/phone', authController.loginWithPhone)

authRouter.post(
  '/login/verify-otp',
  validateOtp,
  authController.verifyOtpWithPhoneLogin,
)

authRouter.post('/login/email', authController.loginWithEmail)

authRouter.post('/resetpassword', authController.ResetPassword)

authRouter.post('/verifyResetPassword', authController.verifyResetPassword)

authRouter.post('/updatePassword', authController.updatePassword)

authRouter.post('/createFarmer', authController.createAccountPhoneForFarmer)

authRouter.post('/signupFarmer', authController.updateRoleForFarmerWithPhone)

authRouter.post(
  '/createFarmer/email',
  authController.createAccountWithEmailForFarmer,
)

authRouter.post('/signupFarmer/email', authController.updateRoleForFarmer)

authRouter.delete('/:id', authController.deleteUser)

authRouter.post('/upload/kyc', uploadKycController)

authRouter.put('/profile-picture', authController.uploadControllerForProfilePic)

authRouter.put('/update', authController.updateUser)

authRouter.get('/fetchUserInfo', authController.fetchUserById)

authRouter.get('/fetch/:id', authController.FetchUserDataById)

// Get Farmer / FPO / Trader (for Admin Panel)
authRouter.get(
  '/getCertainUsers',
  authorizeUser(['Warehouse owner', 'admin', 'manager']),
  authController.getCertainUsers,
)

// Get User and KYC details (ID - 10)
authRouter.get(
  '/get-user-details',
  authorizeUser(['admin']),
  authController.getUserAndKycDetails,
)

authRouter.delete(
  '/profile-picture/delete',
  authorizeUser(['Warehouse owner', 'admin', 'manager', 'Farmer']),
  authController.deleteProfilePic,
)

module.exports = authRouter
