const User = require('../models/UserModel')
const multer = require('multer')
const sharp = require('sharp')
const fs = require('fs')
const path = require('path')
const { createSendToken } = require('../utils/createSendToken')

const mimeExtension = {
  'image/jpeg': '.jpeg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
}
const multerStorage = multer.memoryStorage()
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true)
  } else {
    cb(null, false)
    req.fileError = true
  }
}

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
})

exports.uploadAvatar = upload.single('photo')

exports.resizeAvatarImages = async (req, res, next) => {
  if (!req.file) return next()
  req.body.avatar = `user-${Date.now()}${mimeExtension[req.file.mimetype]}`
  await sharp(req.file.buffer)
    .resize(907, 907)
    .toFile(`public/img/users/${req.body.avatar}`)
  next()
}

exports.getMe = async (req, res, next) => {
  req.params.id = req.user.id
  next()
}
exports.getUser = async (req, res) => {
  const { id } = req.params
  const user = await User.findById(id).lean()
  if (!user) {
    return res.status(404).json({
      err: 'No document found with that ID',
    })
  }
  res.status(200).json({
    status: 'success',
    data: {
      data: user,
    },
  })
}
exports.updateMe = async (req, res) => {
  if (req.fileError) {
    return res.status(400).json({
      msg: 'Not an image! Please upload only images',
    })
  }
  if (req.body?.photo === '') {
    fs.unlink(
      path.join(__dirname, '../public/img', 'users', req.user.avatar),
      (err) => {
        if (err) throw err
      }
    )
    req.body.avatar = ''
  }

  if (!!req.body.avatar && req.user.avatar) {
    fs.unlink(
      path.join(__dirname, '../public/img', 'users', req.user.avatar),
      (err) => {
        if (err) throw err
      }
    )
  }

  // if ((req.body.avatar && req.user.avatar) || req.body?.photo === '') {
  //   req.body.avatar = ''
  //   fs.unlink(
  //     path.join(__dirname, '../public/img', 'users', req.user.avatar),
  //     (err) => {
  //       if (err) throw err
  //     }
  //   )
  // }

  if (req.body.birthday) {
    req.body.birthday = +new Date(req.body.birthday).getTime()
  }
  const newUser = await User.findByIdAndUpdate(req.user.id, req.body, {
    new: true,
    runValidators: true,
  }).lean()
  res.status(200).json({
    status: 'success',
    data: {
      data: newUser,
    },
  })
}
exports.updatePassword = async (req, res) => {
  const currentUser = await User.findById(req.user.id).select('+password')
  if (
    !(await currentUser.correctPassword(
      req.body.currentPassword,
      currentUser.password
    ))
  ) {
    return res.status(400).json({ msg: 'Your current password is wrong' })
  }
  currentUser.password = req.body.password
  currentUser.passwordConfirm = req.body.passwordConfirm

  await currentUser.save()
  res.status(200).json({ status: 'update password successfully' })
  // createSendToken(currentUser, res)
}

exports.getAllUsers = async (req, res) => {
  try {
    const query = {}
    if (req.query.role) {
      query.role = { $eq: req.query.role }
    }
    if (req.query.q) {
      query.fullName = {
        $regex: decodeURIComponent(req.query.q),
        $options: 'i',
      }
    }
    const page = req.query.page || 1
    const limit = req.query.limit || 100
    const skip = (page - 1) * limit
    if (req.query.page) {
      const num = await User.countDocuments()
      if (skip > num) {
        return res.status(404).json({ msg: 'This page does not exist' })
      }
    }
    let [docs, totalDocs] = await Promise.all([
      User.find(query)
        .clone()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.find({}).countDocuments({}).lean(),
    ])
    const totalPages = Math.ceil(totalDocs / limit)

    return res.status(200).json({
      data: {
        data: docs,
        pagination: {
          length: totalDocs,
          totalPages,
          page,
        },
      },
    })
  } catch (error) {
    return res.status(500).json({ msg: error.message })
  }
}
exports.updateUser = async (req, res) => {
  if (req.fileError) {
    return res.status(400).json({
      msg: 'Not an image! Please upload only images',
    })
  }

  const { id } = req.params
  const user = await User.findById(id).lean()
  if (!user) {
    return res.status(404).json({
      msg: 'No document found with that ID',
    })
  }
  if (req.body.avatar && user.avatar) {
    fs.unlink(
      path.join(__dirname, '../public/img', 'users', user.avatar),
      (err) => {
        if (err) throw err
      }
    )
  }

  if (req.body.birthday) {
    req.body.birthday = +new Date(req.body.birthday).getTime()
  }
  const newUser = await User.findByIdAndUpdate(id, req.body, {
    new: true,
    runValidators: true,
  }).lean()
  res.status(200).json({
    status: 'success',
    data: {
      data: newUser,
    },
  })
}
exports.getRecently_viewed = async (req, res) => {
  return res
    .status(200)
    .json({ status: 'success', data: { data: req.user.recently_viewed } })
}

exports.deleteAUser = async (req, res) => {
  const { id } = req.params
  const doc = await User.findByIdAndDelete(id).exec()
  if (!doc) {
    return next(new AppError('No document found with that ID', 404))
  }
  res.status(200).json({
    status: 'success',
    data: null,
  })
}

exports.addAddressUser = async (req, res) => {
  const id = req.user.id
  const doc = await User.findByIdAndUpdate(
    id,
    {
      $push: { address: req.body },
    },
    {
      new: true,
      runValidators: true,
    }
  )
  if (!!req.body.default) {
    doc.address = [...doc.address]
      .map((item) => {
        if (
          item.default &&
          item._id.toString() !==
            doc.address[doc.address.length - 1]._id.toString()
        ) {
          item.default = false
        }
        return item
      })
      .sort((a, b) => b.default - a.default)
    await doc.save()
  }
  return res.status(200).json({
    data: {
      data: doc.address,
    },
  })
}
exports.getListAddressUser = async (req, res) => {
  const id = req.user.id
  const doc = await User.findById(id).lean()
  if (!doc) {
    return
  }
  const result = doc.address.sort((a, b) => b.default - a.default)
  return res.status(200).json({
    data: {
      data: result,
    },
  })
}
exports.deleteAddressUser = async (req, res) => {
  const id = req.user.id
  const idAddress = req.params.id
  const doc = await User.findByIdAndUpdate(
    id,
    {
      $pull: {
        address: {
          _id: idAddress,
        },
      },
    },
    {
      new: true,
      runValidators: true,
    }
  )
  doc.address = [...doc.address].sort((a, b) => b.default - a.default)
  await doc.save()
  return res.status(200).json({
    data: {
      data: doc.address,
    },
  })
}

exports.updateAddressUser = async (req, res) => {
  const id = req.user.id
  const idAddress = req.params.id
  const doc = await User.findOneAndUpdate(
    { _id: id, 'address._id': idAddress },
    {
      $set: {
        'address.$': { ...req.body, _id: idAddress },
      },
    },
    {
      new: true,
      runValidators: true,
    }
  )
  if (!!req.body.default) {
    doc.address = [...doc.address]
      .map((item) => {
        if (item.default && item._id.toString() !== idAddress.toString()) {
          item.default = false
        }
        return item
      })
      .sort((a, b) => b.default - a.default)
    await doc.save()
  }

  return res.status(200).json({
    data: {
      data: doc.address,
    },
  })
}
