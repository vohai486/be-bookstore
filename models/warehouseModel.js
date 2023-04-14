const mongoose = require('mongoose')
const Book = require('./BookModel')

const importSchema = new mongoose.Schema(
  {
    qty: Number,
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: Book,
    },
    price: Number,
    supplier: String,
  },
  { timestamps: true }
)
const Import = mongoose.model('import', importSchema)

const exportSchema = new mongoose.Schema(
  {
    qty: Number,
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: Book,
    },
    price: Number,
    // user: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: 'User',
    // },
    customer: String,
  },
  { timestamps: true }
)
const Export = mongoose.model('export', exportSchema)
module.exports = { Import, Export }
