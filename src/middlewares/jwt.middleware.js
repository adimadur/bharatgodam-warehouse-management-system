const jwt = require('jsonwebtoken')
const { UserModel } = require('../models/user.model')
require('dotenv').config()

const authenticate = async (req, res, next) => {

  try {
    const token = req.header('Authorization').replace('Bearer ', '')
    if (!token) {
      return res.status(401).send({ error: 'Token not provided' });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const ID = decoded._id ? decoded._id : decoded.user._id;


    const user = await UserModel.findById(ID);
    console.log(user);
    if (!user) {
      return res.status(401).send({ error: 'User not found' });
    }
    req.user = user;
    next();
  } catch (error) {
    console.log(error.stack);
    res.status(401).send({ error: 'Please authenticate.' })
  }
}

module.exports = authenticate
