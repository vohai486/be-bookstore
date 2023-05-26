const multer = require('multer')
const sharp = require('sharp')
const slugify = require('slugify')
const Book = require('../models/BookModel')
const jwt = require('jsonwebtoken')
const User = require('../models/UserModel')
const fs = require('fs')
const path = require('path')
const mongoose = require('mongoose')
const { isValidObjectId } = require('../utils/checkIsValidObjectId')
const { Import } = require('../models/warehouseModel')
require('dotenv').config()

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

// exports.uploadBookPhoto = upload.single('photo')

exports.uploadBookImages = upload.fields([
  {
    name: 'images',
    maxCount: 8,
  },
  {
    name: 'image',
    maxCount: 1,
  },
])

// exports.resizeBookPhoto = async (req, res, next) => {
//   if (!req.file) return next()
//   req.file.filename = `product-${Date.now()}${mimeExtension[req.file.mimetype]}`
//   await sharp(req.file.buffer)
//     .resize(750, 750)
//     .toFile(`public/img/books/${req.file.filename}`)
//   next()
// }

exports.resizeBookImages = async (req, res, next) => {
  if (!req.files?.image) return next()
  // 1) Cover images
  req.body.images = []
  req.body.thumbnail_url = `product-${Date.now()}${
    mimeExtension[req.files.image[0].mimetype]
  }`
  await sharp(req.files.image[0].buffer)
    .resize(750, 750)
    .toFile(`public/img/books/${req.body.thumbnail_url}`)

  if (!req.files.images) return next()
  for (let i = 0; i < req.files.images.length; i++) {
    const file = req.files.images[i]
    const filename = `product-${Date.now()}-${i + 1}${
      mimeExtension[file.mimetype]
    }`
    await sharp(file.buffer)
      .resize(750, 750)
      .toFile(`public/img/books/${filename}`)

    req.body.images.push(filename)
  }

  next()
}

exports.createBook = async (req, res, next) => {
  const isExist = await Book.findOne({ name: req.body.name }).lean()
  if (isExist) {
    return res.status(400).json({ msg: 'Book name already exist' })
  }

  if (req.fileError) {
    return res.status(400).json({
      msg: 'Not an image! Please upload only images',
    })
  }

  try {
    const doc = await Book.create(req.body)

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

exports.getAllBooks = async (req, res, next) => {
  // BUILD QUERY
  const queryObj = { ...req.query }
  const excludedFields = [
    'page',
    'sort',
    'limit',
    'fields',
    'category',
    'rating',
    'q',
    'price',
  ]
  excludedFields.forEach((el) => delete queryObj[el])
  // filtering

  let queryStr = JSON.stringify(queryObj)
  queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`)

  const queryResult = JSON.parse(queryStr)

  if (req.query.rating) {
    queryResult.rating_average = {
      $gte: req.query.rating === 5 ? 4.7 : req.query.rating,
    }
  }

  if (req.query.category) {
    queryResult.categoryId = req.query.category
  }

  if (req.query.q) {
    queryResult.name = {
      $regex: decodeURIComponent(req.query.q),
      $options: 'i',
    }
  }

  if (req.query.price) {
    const pricebetween = req.query.price.split(',')
    if (pricebetween[0]) {
      queryResult.price = {
        $gte: +pricebetween[0],
      }
    }
    if (pricebetween[1]) {
      queryResult.price = queryResult.price
        ? { ...queryResult.price, $lte: +pricebetween[1] }
        : { $lte: +pricebetween[1] }
    }
  }

  let query = Book.find(queryResult)

  if (req.query.sort === 'top_seller') {
    query = query.sort('-quantity_sold')
  } else if (req.query.sort === 'newest') {
    query = query.sort('-createdAt')
  } else if (req.query.sort === 'price_asc') {
    query = query.sort('price')
  } else if (req.query.sort === 'price_desc') {
    query = query.sort('-price')
  } else {
    query = query.sort('name')
  }

  // 3) Field limiting
  if (req.query.fields) {
    const fields = req.query.fields.split(',').join(' ')
    query = query.select(fields)
  } else {
    query = query.select('-__v')
  }

  // 4) Pagination

  const page = +req.query.page || 1
  const limit = +req.query.limit || 20
  const skip = (page - 1) * limit
  // query = query.skip(skip).limit(limit)

  if (req.query.page) {
    const numBooks = await Book.countDocuments()
    if (skip > numBooks) {
      return res.status(404).json({ msg: 'This page does not exist' })
    }
  }

  let [docs, totalDocs] = await Promise.all([
    query.clone().populate('category').skip(skip).limit(limit).lean(),
    query.countDocuments({}).lean(),
  ])
  const totalPages = Math.ceil(totalDocs / limit)
  // EXECUTE QUERY
  // SEND RESPONSE
  return res.status(201).json({
    status: 'success',
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

exports.getABook = async (req, res) => {
  const { id } = req.params
  if (!isValidObjectId(id)) {
    return res.status(404).json({
      msg: 'Không tìm thấy Sách này',
    })
  }
  if (!mongoose.isValidObjectId(id)) {
    return res.status(404).json({
      msg: 'No document found with that ID',
    })
  }

  const book = await Book.findById(id)
    .populate({ path: 'category', select: 'name' })
    .lean()

  if (!book) {
    return res.status(404).json({
      msg: 'No document found with that ID',
    })
  }
  return res.status(200).json({
    status: 'success',
    data: {
      data: book,
    },
  })
}
exports.updateABook = async (req, res) => {
  // const isExist = await Book.findOne({ name: req.body.name })
  // if (isExist) {
  //   return res.status(400).json({ msg: 'Book name already exist' })
  // }

  if (!isValidObjectId(req.params.id)) {
    return res.status(404).json({
      msg: 'Không tìm thấy Sách này',
    })
  }

  const book = await Book.findById(req.params.id)

  if (req.body.thumbnail_url && book.thumbnail_url) {
    fs.unlink(
      path.join(__dirname, '../public/img', 'books', book.thumbnail_url),
      (err) => {
        if (err) throw err
      }
    )
  }
  if (req.body?.images?.length > 0 && book.images.length > 0) {
    for (const item of book.images) {
      fs.unlink(path.join(__dirname, '../public/img', 'books', item), (err) => {
        if (err) throw err
      })
    }
  }

  if (req.fileError) {
    return res.status(400).json({
      msg: 'Not an image! Please upload only images',
    })
  }
  const newBook = await Book.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  }).populate({ path: 'category', select: 'name' })
  return res.status(200).json({
    status: 'success',
    data: {
      data: newBook,
    },
  })
}
exports.deleteBook = async (req, res) => {
  const id = req.params.id
  if (!isValidObjectId(id)) {
    return res.status(404).json({
      msg: 'Không tìm thấy Sách này',
    })
  }
  const book = await Book.findById(id)
  if (!book) {
    return res.status(404).json({
      msg: 'No document found with that ID',
    })
  }

  if (book.thumbnail_url) {
    fs.unlink(
      path.join(__dirname, '../public/img', 'books', book.thumbnail_url),
      (err) => {
        if (err) throw err
      }
    )
  }
  await book.remove()
  res.status(200).json({
    msg: 'success',
  })
}

exports.searchBook = async (req, res) => {
  const q = decodeURIComponent(req.query.q)
  const docs = await Book.find({
    $or: [
      {
        name: {
          $regex: q,
          $options: 'i',
        },
      },
      {
        name_unsigned: {
          $regex: q,
          $options: 'i',
        },
      },
    ],
  })
    .limit(req.query.limit || 7)
    .lean()
  // const docs = await Book.find({
  //   name: {
  //     $regex: q,
  //     $options: 'i',
  //   },
  // })
  //   .limit(req.query.limit || 7)
  //   .lean()
  return res.status(200).json({
    data: {
      data: docs,
    },
  })
}
