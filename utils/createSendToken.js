const jwt = require('jsonwebtoken')
require('dotenv').config()
const signToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  })
}

exports.createSendToken = (user, res) => {
  const token = signToken(user._id, user.role)
  res.cookie('access_token', token, {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
  })

  user.password = undefined

  return res.status(200).json({
    status: 'success',
    token,
    data: {
      data: user,
    },
  })
}
