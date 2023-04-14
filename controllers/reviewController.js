const { default: mongoose } = require('mongoose')
const multer = require('multer')
const Book = require('../models/BookModel')
const Review = require('../models/ReviewModel')
const User = require('../models/UserModel')
const fs = require('fs')
const path = require('path')
const { isValidObjectId } = require('../utils/checkIsValidObjectId')
exports.createReview = async (req, res) => {
  req.body.user = req.user._id || null
  req.body.book = req.params.bookId
  try {
    const [check, parent] = await Promise.all([
      Review.findOne({ user: req.body.user, book: req.body.book }),
      Review.findOne({ slug: req.body.parent_slug }),
    ])
    if (check) {
      return res
        .status(400)
        .json({ msg: 'Bạn đã viết nhận xét cho sản phẩm này' })
    }
    if (parent) {
      req.body.full_slug = `${parent.full_slug}/`
      req.body.slug = `${parent.slug}/`
    }

    const [review, user] = await Promise.all([
      Review.create(req.body),
      User.findByIdAndUpdate(req.body.user, {
        $inc: { countWrite: 1 },
      }),
    ])

    // const review = await Review.create(req.body)
    return res.status(200).json({
      status: 'create review successfully',
      data: {
        data: review,
      },
    })
  } catch (error) {
    return res.status(500).json({ msg: error.message })
  }
}

exports.listReview = async (req, res) => {
  const { bookId } = req.params
  if (!isValidObjectId(bookId)) {
    return res.status(404).json({
      msg: 'Không tìm thấy Sách này',
    })
  }
  const query = { book: bookId }
  if (req.body.slug) {
    // query['slug'] = {
    //   $regex: req.body.slug,
    // }
    query['parent_slug'] = req.body.slug
  } else {
    query.parent_slug = {
      $eq: '',
    }
  }
  let [reviews, rating, avgRating] = await Promise.all([
    Review.find(query, {
      text: 1,
      slug: 1,
      parent_slug: 1,
      full_slug: 1,
      user: 1,
      parent_id: 1,
      createdAt: 1,
      rating: 1,
      is_liked: 1,
      likes: 1,
      likes_count: 1,
      images: 1,
    })
      .populate({ path: 'user', select: 'fullName countWrite createdAt photo' })
      .sort({ createdAt: -1 })
      .lean(),
    Review.aggregate([
      {
        $match: { book: mongoose.Types.ObjectId(bookId), parent_slug: '' },
      },
      {
        $group: {
          _id: '$rating',
          count: {
            $sum: 1,
          },
        },
      },
      {
        $sort: { _id: -1 },
      },
    ]),
    Review.aggregate([
      {
        $match: { book: mongoose.Types.ObjectId(bookId), parent_slug: '' },
      },
      {
        $group: {
          _id: 'avg',
          avg: { $avg: '$rating' },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 'avg',
          avg: { $round: ['$avg', 1] },
          count: '$count',
        },
      },
    ]),
  ])
  reviews.length > 0 &&
    !!req.user?.id &&
    reviews.map((item) => {
      if (req)
        if (item.likes.includes(req.user?.id || null)) {
          item.is_liked = true
        }
      item.likes = undefined
      return item
    })

  if (!req.user?.id) {
    reviews.map((item) => {
      item.is_liked = false
      item.likes = undefined
      return item
    })
  }
  return res.status(200).json({
    status: 'success',
    data: {
      data: reviews,
      rating,
      avgRating,
    },
  })
}

exports.updateReview = async (req, res) => {
  const { id } = req.params
  req.body.user = req.user._id || null
  req.body.book = req.params.bookId
  if (req.body.images.length === 0) {
    delete req.body.images
  }
  const doc = await Review.findOneAndUpdate(
    {
      _id: id,
      user: req.body.user,
    },
    req.body,
    {
      new: true,
      runValidators: true,
    }
  ).lean()
  if (!doc) {
    return res.status(404).json({ msg: 'Bạn không thể xóa bình luận này' })
  }

  if (!doc) {
    return res.status(404).json({ msg: 'No document found with that ID' })
  }
  return res.status(200).json({
    status: 'success',
    data: {
      data: doc,
    },
  })
}

exports.deleteReview = async (req, res) => {
  const { id } = req.params
  req.body.user = req.user._id || null
  req.body.book = req.params.bookId

  const doc = await Review.findOneAndDelete({
    _id: id,
    user: req.body.user,
  }).exec()
  if (!doc) {
    return res.status(404).json({ msg: 'Bạn không thể xóa bình luận này' })
  }
  for (let i = 0; i < doc.images?.length; i++) {
    fs.unlink(
      path.join(__dirname, '../public/img', 'reviews', doc.images[i]),
      (err) => {
        if (err) throw err
      }
    )
  }

  await Review.deleteMany({
    parent_slug: { $regex: id },
  })

  return res.status(200).json({
    status: 'success',
    data: null,
  })
}

exports.likeReview = async (req, res) => {
  const idUser = req.user._id || null
  const { id } = req.params
  const review = await Review.findById(id).lean()
  const index = review.likes.findIndex(
    (el) => el.toString() === idUser.toString()
  )
  if (index > -1) {
    return res.status(400).json({ msg: 'You liked this Review.' })
  }
  const newreview = await Review.findByIdAndUpdate(
    id,
    {
      $push: { likes: idUser },
      $inc: { likes_count: 1 },
    },
    { new: true }
  ).lean()
  newreview.is_liked = true
  return res.status(200).json({
    status: 'success',
    data: {
      data: newreview,
    },
  })
}
exports.unLikeReview = async (req, res) => {
  const idUser = req.user._id || null
  const { id } = req.params
  const review = await Review.findById(id).lean()
  const index = review.likes.findIndex(
    (el) => el.toString() === idUser.toString()
  )
  if (index <= 0) {
    return res.status(400).json({ msg: `You dont't liked this Review.` })
  }
  const newReview = await Review.findByIdAndUpdate(
    id,
    {
      $pull: { likes: idUser },
      $inc: { likes_count: -1 },
    },
    { new: true }
  ).lean()
  return res.status(200).json({
    status: 'success',
    data: {
      data: newReview,
    },
  })
}

const mimeExtension = {
  'image/jpeg': '.jpeg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
}
const multerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/img/reviews')
  },
  filename: (req, file, cb) => {
    const ext = `review-${Date.now()}${mimeExtension[file.mimetype]}`
    cb(null, ext)
  },
})
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

exports.uploadReviews = upload.array('images', 5)

exports.handleImagePath = (req, res, next) => {
  if (!req.files) return next()
  req.body.images = []
  for (let i = 0; i < req.files.length; i++) {
    const file = req.files[i]
    req.body.images.push(file.filename)
  }
  next()
}
