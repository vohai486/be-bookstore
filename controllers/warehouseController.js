const Book = require('../models/BookModel')
const { Import, Export } = require('../models/warehouseModel')
exports.stockEntries = async (req, res) => {
  try {
    const docs = await Import.insertMany(req.body.list)
    await Promise.all(
      docs.map((item) =>
        Book.findByIdAndUpdate(item.book, {
          $inc: { countInStock: item.qty },
        }).lean()
      )
    )

    return res.status(200).json({
      status: 'success',
      data: {
        data: docs,
      },
    })
  } catch (error) {
    return res.status(500).json({ msg: error.message })
  }
}
exports.updateStockEntries = async (req, res) => {
  try {
    const doc = await Import.findById(req.params.id).lean()
    const qtyCurrent = doc.qty
    let docNew
    let book
    if (req.body.qty) {
      ;[docNew, book] = await Promise.all([
        Import.findByIdAndUpdate(req.params.id, req.body, { new: true }).lean(),
        Book.findByIdAndUpdate(doc.book, {
          $inc: { countInStock: req.body.qty - qtyCurrent },
        }).lean(),
      ])
    } else {
      docNew = Import.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
      }).lean()
    }
    return res.status(200).json({
      status: 'success',
      data: {
        data: docNew,
      },
    })
  } catch (error) {
    return res.status(500).json({ msg: error.message })
  }
}
exports.stockOutput = async (req, res) => {
  const docs = await Export.insertMany(req.body.list)
  await Promise.all(
    docs.map((item) =>
      Book.findByIdAndUpdate(item.book, {
        $inc: { countInStock: -item.qty, quantity_sold: item.qty },
      }).lean()
    )
  )

  return res.status(200).json({
    status: 'success',
    data: {
      data: docs,
    },
  })
}
exports.updateStockOutput = async (req, res) => {
  try {
    const doc = await Export.findById(req.params.id)
    const qtyCurrent = doc.qty
    let docNew
    let book
    if (req.body.qty) {
      ;[docNew, book] = await Promise.all([
        Export.findByIdAndUpdate(req.params.id, req.body, { new: true }),
        Book.findByIdAndUpdate(doc.book, {
          $inc: {
            countInStock: -req.body.qty + qtyCurrent,
            quantity_sold: req.body.qty - qtyCurrent,
          },
        }),
      ])
    } else {
      docNew = Export.findByIdAndUpdate(req.params.id, req.body, { new: true })
    }
    return res.status(200).json({
      status: 'success',
      data: {
        data: docNew,
      },
    })
  } catch (error) {
    return res.status(500).json({ msg: error.message })
  }
}
