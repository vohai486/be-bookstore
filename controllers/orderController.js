const Order = require('../models/OrderModel')
const Cart = require('../models/CartModel')
const Book = require('../models/BookModel')
const { isValidObjectId } = require('../utils/checkIsValidObjectId')

exports.createNewOrder = async (req, res) => {
  const { orderItems } = req.body
  const orderItemsId = orderItems.map((orderItem) => orderItem.book)
  if (orderItems && orderItems.length === 0) {
    res.status(400).json({ msg: 'No order items' })
  }
  for (const item of orderItems) {
    const book = await Book.findOneAndUpdate(
      {
        _id: item.book,
        countInStock: { $gte: item.qty },
      },
      {
        $inc: { countInStock: -item.qty, quantity_sold: item.qty },
      },
      { new: true }
    ).lean()
    if (!book) {
      return res.status(400).json({
        msg: 'One or more product order quantity exceed available quantity',
      })
    }
    const cartUpdate = await Cart.findOneAndUpdate(
      { user: req.user._id },
      {
        $pull: {
          cartItems: {
            product: item.book,
          },
        },
      },
      { new: true }
    ).lean()
    if (!cartUpdate) {
      res.status(500).json({ msg: 'Removing ordered items from cart failed' })
    }
  }

  req.body.user = req.user._id

  const order = await Order.create(req.body)
  return res.status(200).json({
    status: 'success',
    data: { data: order },
  })
}

exports.getOrderUser = async (req, res) => {
  const id = req.user._id
  const docs = await Order.find({ user: id }).sort({ updatedAt: -1 }).lean()
  return res.status(200).json({
    status: 'success',
    data: { data: docs },
  })
}
exports.getDetailsOrder = async (req, res) => {
  const id = req.user._id
  const idOrder = req.params.id
  if (!isValidObjectId(idOrder))
    return res.status(404).json({
      msg: 'Không tìm thấy',
    })
  const doc = await Order.findById(idOrder).lean()
  return res.status(200).json({
    status: 'success',
    data: { data: doc },
  })
}
exports.cancelOrder = async (req, res) => {
  const idOrder = req.params.id
  const doc = await Order.findById(idOrder).lean()

  if (doc.orderItems?.length === 0) {
    return res.status(400).json({
      msg: 'Không có đơn hàng nào trong order này',
    })
  }

  for (let i = 0; i < doc.orderItems?.length; i++) {
    await Book.findOneAndUpdate(
      {
        _id: doc.orderItems[i].book,
      },
      {
        $inc: {
          countInStock: +doc.orderItems[i].qty,
          quantity_sold: -doc.orderItems[i].qty,
        },
      }
    )
  }

  const docUpdate = await Order.findByIdAndUpdate(
    idOrder,
    {
      status: 5,
    },
    {
      new: true,
    }
  ).lean()
  return res.status(200).json({
    status: 'success',
    data: { data: docUpdate },
  })
}

exports.getAllOrder = async (req, res) => {
  const page = +req.query.page || 1
  const limit = +req.query.limit || 15
  const skip = (page - 1) * limit
  const query = {}
  if (req.query.page) {
    const num = await Order.countDocuments()
    if (skip > num) {
      return res.status(404).json({ msg: 'This page does not exist' })
    }
  }
  if (req.query.status && +req.query.status !== 1) {
    query.status = req.query.status
  }

  let [docs, totalDocs] = await Promise.all([
    Order.find(query).clone().sort('-updatedAt').skip(skip).limit(limit).lean(),
    Order.find(query).countDocuments({}).lean(),
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
}

exports.updateOrder = async (req, res) => {
  const idOrder = req.params.id
  const status = req.body.status
  const doc = await Order.findById(idOrder)
  if (doc.orderItems?.length === 0) {
    return res.status(400).json({
      msg: 'Không có đơn hàng nào trong order này',
    })
  }
  const docUpdate = await Order.findByIdAndUpdate(
    idOrder,
    {
      status: status,
    },
    {
      new: true,
    }
  ).lean()
  return res.status(200).json({
    status: 'success',
    data: { data: docUpdate },
  })
}
exports.confirmDelivered = async (req, res) => {
  const idOrder = req.params.id
  const doc = await Order.findById(idOrder)
  if (doc.orderItems?.length === 0) {
    return res.status(400).json({
      msg: 'Không có đơn hàng nào trong order này',
    })
  }

  const docUpdate = await Order.findByIdAndUpdate(
    idOrder,
    {
      status: 4,
      isPaid: true,
      paidAt: new Date(),
      isDelivered: true,
      deliveredAt: new Date(),
    },
    {
      new: true,
    }
  ).lean()
  return res.status(200).json({
    status: 'success',
    data: { data: docUpdate },
  })
}
