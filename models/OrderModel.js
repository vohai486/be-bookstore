const mongoose = require('mongoose')
const Book = require('./BookModel')
const User = require('./UserModel')
const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: User,
      required: [true, 'Review must belong to a user'],
    },
    orderItems: [
      {
        name: String,
        image: String,
        qty: Number,
        price: Number,
        book: {
          type: mongoose.Schema.Types.ObjectId,
          ref: Book,
        },
      },
    ],
    shippingAddress: {
      city: String,
      district: String,
      fullName: String,
      street: String,
      ward: String,
      phoneNumber: String,
      delivery_address_type_name: { type: String, enum: ['home', 'company'] },
    },
    itemsPrice: Number,
    shippingPrice: Number,
    totalPrice: Number,
    totalQuantity: Number,
    paymentMethod: { type: String, required: true },
    isPaid: Boolean,
    paidAt: {
      type: Date,
    },
    isDelivered: {
      type: Boolean,
      required: true,
      default: false,
    },
    deliveredAt: {
      type: Date,
    },
    status: { type: Number, default: 2, enum: [1, 2, 3, 4, 5] },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    timestamps: true,
  }
)

const Order = mongoose.model('Order', orderSchema)
Order.watch().on('change', (data) => {
  console.log('check', data.operationType)
  // lắng nghe sự kiện thay đổi trên collection order
  if (data.operationType === 'insert') {
    io.emit('addOrder', data.fullDocument)
  }
  if (data.operationType === 'update') {
    console.log('data', data)
    io.emit('updateOrder', data.documentKey._id)
  }
})
module.exports = Order
