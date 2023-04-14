const mongoose = require('mongoose')
const Book = require('./BookModel')
const UserModel = require('./UserModel')
const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    cartItems: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
          ref: Book,
        },
        qty: {
          type: Number,
          required: true,
          default: 1,
        },
      },
    ],
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
)

const Cart = mongoose.model('Cart', cartSchema)

module.exports = Cart
