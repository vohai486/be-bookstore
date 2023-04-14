const Chat = require('../models/ChatModel')

exports.createMessage = async (req, res) => {
  try {
    const t = new Chat(req.body)

    const doc = await t.save()
    const data = await doc.populate({ path: 'user', select: 'fullName avatar' })
    // const doc = await Chat.create(req.body)
    return res.status(201).json({
      status: 'success',
      data: {
        data: data,
      },
    })
  } catch (error) {
    return res.status(500).json({ msg: error.message })
  }
}
exports.getMessages = async (req, res) => {
  try {
    const docs = await Chat.find({ user: req.params.userId })
      .populate({ path: 'user', select: 'fullName avatar' })
      .sort('-createdAt')
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
exports.getListUserChat = async (req, res) => {
  try {
    // const docs = await Chat.distinct('user', { sender: true }).populate({
    //   path: 'user',
    //   select: 'name',
    // })
    const docs = await Chat.aggregate([
      // {
      //   $match: {
      //     sender: true,
      //   },
      // },
      {
        $sort: {
          createdAt: -1,
        },
      },
      {
        $group: {
          _id: '$user',
          chatId: {
            $first: '$_id',
          },
          message: {
            $first: '$message',
          },
          sender: {
            $first: '$sender',
          },
          isRead: {
            $first: '$isRead',
          },
          createdAt: {
            $first: '$createdAt',
          },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userInfo',
        },
      },
      {
        $unwind: '$userInfo',
      },
      {
        $project: {
          'userInfo.avatar': 1,
          'userInfo.fullName': 1,
          message: 1,
          createdAt: 1,
          isRead: 1,
          sender: 1,
          chatId: 1,
        },
      },
    ])
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

exports.updateIsReadChat = async (req, res) => {
  try {
    const id = req.params.id
    const doc = await Chat.findByIdAndUpdate(
      id,
      { isRead: true },
      { new: true }
    ).lean()
    return res.status(200).json({
      status: 'success',
      data: {
        data: doc,
      },
    })
  } catch (error) {
    return res.status(500).json({ msg: error.message })
  }
}
