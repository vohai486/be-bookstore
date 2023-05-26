const mongoose = require('mongoose')
const Category = require('./CategoryModel')
const { default: slugify } = require('slugify')

const bookSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    name_unsigned: String,
    thumbnail_url: String,
    images: [String],
    description: {
      type: String,
      required: true,
    },
    rating_average: {
      type: Number,
      default: 0,
      max: [5, 'Rating must be below 5.0'],
      set: (val) => Math.round(val * 10) / 10,
    },
    review_count: {
      type: Number,
      default: 0,
    },
    original_price: { type: Number, required: true },
    discount_rate: { type: Number, default: 0 },
    price: { type: Number },
    countInStock: {
      type: Number,
      required: true,
      default: 0,
    },
    quantity_sold: {
      type: Number,
      required: true,
      default: 0,
    },
    cover: {
      type: String,
      enum: ['Bìa cứng', 'Bìa mềm', 'Bìa gập'],
    },
    size: {
      type: String,
    },
    pages: {
      type: Number,
    },
    publishingYear: Number,
    author: String,
    publisher: String,
    company: String,
    categoryId: {
      type: Number,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
)
bookSchema.virtual('category', {
  ref: 'Categories',
  localField: 'categoryId',
  foreignField: 'categoryId',
  // localField: ['categoryId'],
  // foreignField: ['categoryId'], // array
  justOne: true,
})

bookSchema.statics.calcPrice = async function (book) {
  book.price = (book.original_price * (100 - book.discount_rate)) / 100
}
bookSchema.pre('save', function (next) {
  if (this.isModified('original_price') || this.isModified('discount_price')) {
    this.price = (this.original_price * (100 - this.discount_rate)) / 100
  }
  next()
})
bookSchema.pre(/^findOneAnd/, async function () {
  if (this.getUpdate().original_price || this.getUpdate().discount_price) {
    this.getUpdate().price =
      (this.getUpdate().original_price *
        (100 - this.getUpdate().discount_rate)) /
      100
  }
})

const Book = mongoose.model('Books', bookSchema)

module.exports = Book
