const Category = require('../models/CategoryModel')

exports.createCategory = async (req, res) => {
  const isExist = await Category.findOne({ name: req.query.name })
  if (isExist) {
    res.status(400)
    throw new Error('Category name already exist')
  }
  const doc = await Category.findOne({}).sort({ _id: -1 })
  req.body._id = +doc._id + 1
  // req.body.url_key = slugify(req.body.name, {
  //   lower: true,
  // })
  // req.body.url_path = `${req.body.url_key}/c${req.body._id}`
  try {
    const doc = await Category.create(req.body)
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

exports.getAllCategories = async (req, res) => {
  try {
    const docs = await Category.find().sort({ id: -1 }).lean()
    return res.status(201).json({
      status: 'success',
      data: {
        data: docs,
      },
    })
  } catch (error) {
    return res.status(500).json({ msg: error.message })
  }
}
exports.getCategoryDetail = async (req, res) => {
  const { _id } = req.params
  try {
    const docs = await Category.findOne({ _id }).lean()
    return res.status(201).json({
      status: 'success',
      data: {
        data: docs,
      },
    })
  } catch (error) {
    return res.status(500).json({ msg: error.message })
  }
}
