const User = require('../models/UserModel')
const { createSendToken } = require('../utils/createSendToken')
const bcrypt = require('bcryptjs')
const Cart = require('../models/CartModel')

exports.signup = async (req, res) => {
  const userExists = await User.findOne({ email: req.body.email })
    .lean()
    .select('email')
  if (userExists) {
    return res.status(400).json({ msg: 'Email của người dùng đã tồn tại' })
    // Email of user already exists
  }
  const newUser = await User.create(req.body)

  if (!req.body.role === 'admin' || !req.body.role) {
    await Cart.create({ user: newUser._id, cartItems: [] })
  }

  createSendToken(newUser, res)
}

exports.signin = async (req, res) => {
  const { email, password } = req.body
  // 1) check if email and password exist
  if (!email || !password) {
    return res.status(400).json({ msg: 'Please provide email and password' })
  }
  const user = await User.findOne({
    email: email,
  }).select('+password')
  if (!user || !(await user.correctPassword(password, user.password))) {
    return res
      .status(400)
      .json({ msg: 'Tài khoản hoặc mật khẩu không chính xác' })
  }
  createSendToken(user, res)
}
