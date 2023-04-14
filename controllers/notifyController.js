const { UserNotify, AdminNotify } = require('../models/NotifyModel')

exports.addNotify = async (req, res) => {
  try {
    let doc = {}
    if (req.body.user) {
      doc = await UserNotify.create(req.body)
    } else {
      doc = await AdminNotify.create(req.body)
    }
    return res.status(201).json({
      status: 'success',
      data: {
        data: doc,
      },
    })
  } catch (error) {
    return res.status(500).json({ msg: error.message })
  }
}
exports.getAdminNotify = async (req, res) => {
  try {
    const docs = await AdminNotify.find().sort('-createdAt').lean()
    return res.status(201).json({
      status: 'success',
      data: {
        data: docs,
      },
    })
  } catch (error) {
    return res.status(500).json({ msg: error.message })
  }
}
exports.getUserNotify = async (req, res) => {
  const id = req.user._id
  try {
    const docs = await UserNotify.find({ user: id }).sort('-createdAt').lean()
    return res.status(201).json({
      status: 'success',
      data: {
        data: docs,
      },
    })
  } catch (error) {
    return res.status(500).json({ msg: error.message })
  }
}
exports.markReadNotify = async (req, res) => {
  const id = req.params.id
  const type = req.body.type
  try {
    const docs = await (type === 'admin' ? AdminNotify : UserNotify)
      .findByIdAndUpdate(id, { isRead: true }, { new: true })
      .lean()
    return res.status(201).json({
      status: 'success',
      data: {
        data: docs,
      },
    })
  } catch (error) {
    return res.status(500).json({ msg: error.message })
  }
}

exports.markUnReadNotify = async (req, res) => {
  const id = req.params.id
  const type = req.body.type

  try {
    const docs = await (type === 'admin' ? AdminNotify : UserNotify)
      .findByIdAndUpdate(id, { isRead: false }, { new: true })
      .lean()
    return res.status(201).json({
      status: 'success',
      data: {
        data: docs,
      },
    })
  } catch (error) {
    return res.status(500).json({ msg: error.message })
  }
}
