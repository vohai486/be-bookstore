const mongoose = require('mongoose')
const slugify = require('slugify')
const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    categoryId: { type: Number, required: true, unique: true },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
)

categorySchema.index({ id: 1 })

const Category = mongoose.model('Categories', categorySchema)

module.exports = Category
