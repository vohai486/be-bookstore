const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const validator = require('validator')
const Book = require('./BookModel')
const Cart = require('./CartModel')
const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
    },
    lastName: {
      type: String,
    },
    fullName: String,
    email: {
      type: String,
      required: [true, 'Please procvide your email'],
      unique: true,
      lowercase: true,
      validate: [validator.isEmail, 'Please provide a valid email'],
    },
    countWrite: { type: Number, default: 0 },
    avatar: String,
    role: {
      type: String,
      enum: ['admin', 'user'],
      default: 'user',
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: 6,
      select: false,
      // dùng select khi trả về kh hiện field password
    },
    passwordConfirm: {
      type: String,
      // required: [true, 'Please confirm your password'],
      // validate: {
      //   // this only works on CREATE and SAVE!!
      //   validator: function (el) {
      //     return this.password === el
      //   },
      //   message: 'Password are not the same',
      // },
    },
    recently_viewed: [{ type: mongoose.Schema.Types.ObjectId, ref: Book }],
    birthday: Number,
    nickName: String,
    address: [
      {
        // default: true,
        fullName: String,
        phoneNumber: String,
        city: String,
        district: String,
        ward: String,
        street: String,
        delivery_address_type_name: { type: String, enum: ['home', 'company'] },
        default: { type: Boolean, default: false },
        codeCity: Number,
        codeDistrict: Number,
        codeWard: Number,
      },
    ],
    suggestion: [{ deleteLink: String, url: String }],
    active: {
      type: Boolean,
      default: true,
      select: false,
    },
    gender: { type: Number, enum: [1, 2, 3] },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    timestamps: true,
  }
)

userSchema.pre('save', async function (next) {
  // Only run this function if password was actually modified
  if (this.isModified('firstName') || this.isModified('lastName')) {
    this.fullName = this.firstName + ' ' + this.lastName
    this.firstName = undefined
    this.lastName = undefined
  }
  if (!this.isModified('password')) return next()
  // Hash the password with cost of 12
  this.password = await bcrypt.hash(this.password, 12)

  // Delete passwordConfirm field
  this.passwordConfirm = undefined
  next()
})

userSchema.pre(/^find/, function (next) {
  this.find({
    active: {
      $ne: false,
    },
  })
  next()
})

// userSchema.post('find', async function (docs) {
//   for (const item of docs) {
//     // if (item.role !== 'admin') {
//     //   await Cart.create({ user: item._id, cartItems: [] })
//     // }
//     // console.log(pub1)
//   }
//   // console.log(this)
// })

userSchema.methods.correctPassword = async function (
  password,
  candidatePassword
) {
  return bcrypt.compareSync(password, candidatePassword)
}

module.exports = mongoose.model('User', userSchema)
