const jwt = require('jsonwebtoken')
const User = require('../models/UserModel')
require('dotenv').config()
const { promisify } = require('util')

exports.protect = async (req, res, next) => {
  let token
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1]
  } else if (req.cookies.access_token) {
    token = req.cookies.access_token
  }
  if (!token) {
    return res
      .status(401)
      .json({ status: 'You are not logged in! Please log in to get access' })
  }
  try {
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET)
    const { id } = decoded

    const currentUser = await User.findById(id)
    if (!currentUser) {
      return res.status(400).json({
        status: 'The user belonging to this token does no longer exist.',
      })
    }
    req.user = currentUser
    next()
  } catch (error) {
    res.status(401).json({ msg: 'Not authorized, token failed' })
  }
}

exports.isAdmin = async (req, res, next) => {
  if (req.user.role === 'admin') {
    return next()
  }
  return res
    .status(403)
    .json({ msg: 'You do no have permisssion to perform this action' })
}

exports.optional = async (req, res, next) => {
  let token
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1]
    if (!!token) {
      try {
        const decoded = await promisify(jwt.verify)(
          token,
          process.env.JWT_SECRET
        )
        const id = decoded.id || null
        const currentUser = await User.findById(id)
        req.user = currentUser || null
      } catch (error) {
        res.status(401).json({ msg: 'Not authorized, token failed' })
      }
    }
  }

  next()
}
