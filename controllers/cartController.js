const Book = require('../models/BookModel')
const Cart = require('../models/CartModel')
const { isValidObjectId } = require('../utils/checkIsValidObjectId')

exports.getCart = async (req, res) => {
  const id = req.user._id || null

  const cart = await Cart.findOne({ user: id })
    .populate(
      'cartItems.product',
      'name countInStock thumbnail_url price original_price'
    )
    .lean()
  if (!cart) {
    return res.status(404).json({ msg: 'Cart not found' })
  }

  return res.status(200).json({
    status: 'success',
    data: {
      data: cart.cartItems || [],
    },
  })
}
exports.addCart = async (req, res) => {
  const id = req.user._id || null
  const cartKey = `cart:${id}`

  const { bookId, qty } = req.body
  if (!isValidObjectId(id.toString())) {
    return res.status(404).json({
      msg: 'Không tìm thấy người dùng này',
    })
  }
  if (!isValidObjectId(bookId)) {
    return res.status(404).json({
      msg: 'Không tìm thấy Sách này',
    })
  }

  const [cart, book] = await Promise.all([
    Cart.findOne({ user: id }),
    Book.findOne({ _id: bookId }).lean(),
  ])
  if (!cart) {
    return res.status(404).json({ msg: 'Cart not found' })
  }
  if (!book) {
    return res.status(404).json({ msg: 'Book not found' })
  }

  const index = cart.cartItems.findIndex(
    (item) => item.product.toString() === bookId.toString()
  )
  if (index > -1) {
    cart.cartItems[index].qty += qty
  } else {
    cart.cartItems.push({ product: bookId, qty })
  }
  if (qty <= 0) {
    cart.cartItems.splice(index, 1)
  }
  await cart.save()
  return res.status(200).json({
    status: 'success',
    msg: 'add cart successfully',
  })
}
exports.updateCart = async (req, res) => {
  const id = req.user._id || null
  const cartKey = `cart:${id}`

  if (!isValidObjectId(id.toString())) {
    return res.status(404).json({
      msg: 'Không tìm thấy người dùng này',
    })
  }
  const cart = await Cart.findOne({ user: id })
  if (!cart) {
    res.status(404).json({ msg: 'Cart not found' })
  }
  const { bookId, qty } = req.body

  const index = cart.cartItems.findIndex(
    (item) => item.product.toString() === bookId.toString()
  )
  if (index > -1) {
    cart.cartItems[index].qty = qty
  }
  if (qty <= 0) {
    cart.cartItems.splice(index, 1)
  }
  await cart.save()
  return res.status(200).json({
    status: 'success',
    msg: 'update cart successfully',
  })
}
exports.removeCart = async (req, res) => {
  const id = req.user._id || null
  if (!isValidObjectId(id.toString())) {
    return res.status(404).json({
      msg: 'Không tìm thấy người dùng này',
    })
  }
  const cart = await Cart.findOne({ user: id })
  if (!cart) {
    res.status(404).json({ msg: 'Cart not found' })
  }
  const { bookIdList } = req.body
  bookIdList?.forEach(async (id) => {
    const index = cart.cartItems.findIndex(
      (item) => item.product.toString() === id.toString()
    )
    if (index > -1) {
      cart.cartItems.splice(index, 1)
    }
  })
  await cart.save()
  return res.status(200).json({
    status: 'success',
    msg: 'Remove cart',
  })
}
