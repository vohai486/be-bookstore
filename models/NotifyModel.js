const mongoose = require('mongoose')

const userNotifySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Types.ObjectId, ref: 'user' },
    url: String,
    text: String,
    isRead: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
)
const adminNotifySchema = new mongoose.Schema(
  {
    url: String,
    text: String,
    isRead: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
)
const UserNotify = mongoose.model('userNotify', userNotifySchema)
const AdminNotify = mongoose.model('adminNotify', adminNotifySchema)

module.exports = { UserNotify, AdminNotify }
