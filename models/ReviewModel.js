const mongoose = require('mongoose')
const Book = require('./BookModel')
const User = require('./UserModel')

const reviewSchema = new mongoose.Schema(
  {
    text: {
      type: String,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: Book,
      required: [true, 'Review must belong to a tour.'],
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: User,
      required: [true, 'Review must belong to a user'],
    },
    parent_slug: { type: String, default: '' },
    slug: String,
    review_replies_num: { type: Number, default: 0 },
    full_slug: String, // combine by posted + id
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: User }],
    is_liked: { type: Boolean, default: false },
    images: [String],
    likes_count: Number,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
)

reviewSchema.statics.calcAverageRatings = async function (bookId) {
  const stats = await this.aggregate([
    {
      $match: { book: bookId, parent_slug: '' },
    },
    {
      $group: {
        _id: '$book',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ])
  let book
  if (stats.length > 0) {
    book = await Book.findByIdAndUpdate(
      bookId,
      {
        rating_average: stats[0].avgRating,
        review_count: stats[0].nRating,
      },
      {
        new: true,
      }
    )
  } else {
    book = await Book.findByIdAndUpdate(
      bookId,
      {
        rating_average: 0,
        review_count: 0,
      },
      {
        new: true,
      }
    )
  }
}
reviewSchema.pre('save', async function () {
  this.full_slug =
    (this.full_slug || '') + `${new Date().toISOString()}:${this._id}`
  this.slug = (this.slug || '') + this._id
})
reviewSchema.post('save', async function () {
  if (this.parent_slug === '') {
    this.constructor.calcAverageRatings(this.book)
  }
})

reviewSchema.pre(/^findOneAnd/, async function () {
  this.r = await this.clone().findOne()
})
reviewSchema.post(/^findOneAnd/, async function () {
  if (!!this.r?._id && this.r?.parent_slug === '') {
    this.r.constructor.calcAverageRatings(this.r.book)
  }
})
const Review = mongoose.model('Reviews', reviewSchema)

module.exports = Review
