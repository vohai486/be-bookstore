const mongoose = require('mongoose')

const chatSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    sender: Boolean,
    message: {
      type: String,
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
)
chatSchema.set('strictPopulate', false)
const Chat = mongoose.model('chat', chatSchema)
module.exports = Chat
