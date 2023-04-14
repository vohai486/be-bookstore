const Book = require('../models/BookModel')
const Order = require('../models/OrderModel')
const { Import } = require('../models/warehouseModel')

exports.statsStockEntries = async (req, res) => {
  try {
    const page = +req.query.page || 1
    const limit = +req.query.limit || 10
    const skip = (page - 1) * limit
    if (req.query.page) {
      const num = await Import.countDocuments()
      if (skip > num) {
        return res.status(404).json({ msg: 'This page does not exist' })
      }
    }

    const [list, totalDocs] = await Promise.all([
      Import.find()
        .clone()
        .sort('-createdAt')
        .skip(skip)
        .limit(limit)
        .populate({ path: 'book', select: 'name' })
        .lean(),

      Import.find().countDocuments({}),
    ])
    const totalPages = Math.ceil(totalDocs / limit)
    return res.status(200).json({
      data: {
        data: {
          list,
          pagination: {
            length: totalDocs,
            totalPages,
            page,
          },
        },
      },
    })
  } catch (error) {
    return res.status(500).json({ msg: error.message })
  }
}
exports.statsOrder = async (req, res) => {
  try {
    const result = await Order.aggregate([
      {
        $match: {
          status: 4,
        },
      },
      {
        $group: {
          _id: null,
          total: {
            $sum: '$itemsPrice',
          },
        },
      },
    ])

    return res.status(200).json({
      data: {
        data: result,
      },
    })
  } catch (error) {
    return res.status(500).json({ msg: error.message })
  }
}
exports.statsImportExport = async (req, res) => {
  const { start, end } = req.query
  try {
    const [resultOpening, resultImport, resultOrder] = await Promise.all([
      Import.aggregate([
        {
          $match: {
            createdAt: {
              $lt: !!start ? new Date(start) : new Date('1-1-1970'),
            },
          },
        },
        {
          $group: {
            _id: '$book',
            totalQty: {
              $sum: '$qty',
            },
          },
        },
        {
          $project: {
            _id: 1,
            totalQty: '$totalQty',
          },
        },
      ]),
      Import.aggregate([
        {
          $match: {
            createdAt: {
              $gte: !!start ? new Date(start) : new Date('1-1-1970'),
              $lt: !!end ? new Date(end) : new Date(),
            },
          },
        },
        {
          $group: {
            _id: '$book',
            totalPrice: {
              $sum: {
                $multiply: ['$qty', '$price'],
              },
            },
            totalQty: {
              $sum: '$qty',
            },
            avgPrice: { $avg: '$price' },
          },
        },
        {
          $lookup: {
            from: 'books',
            localField: '_id',
            foreignField: '_id',
            as: 'book',
          },
        },
        { $unwind: '$book' },
        {
          $project: {
            _id: 1,
            name: '$book.name',
            priceImport: {
              $round: [{ $divide: ['$totalPrice', '$totalQty'] }, 0],
            },
            qtyImport: '$totalQty',
            bookPrice: '$book.price',
            countInStock: '$book.countInStock',
          },
        },
        {
          $sort: {
            createdAt: -1,
          },
        },
      ]),
      Order.aggregate([
        {
          $match: {
            status: 4,
            createdAt: {
              $gte: !!start ? new Date(start) : new Date('1-1-1970'),
              $lt: !!end ? new Date(end) : new Date(),
            },
          },
        },
        {
          $unwind: '$orderItems',
        },
        {
          $group: {
            _id: '$orderItems.book',
            totalQty: {
              $sum: '$orderItems.qty',
            },
            totalPrice: {
              $sum: {
                $multiply: ['$orderItems.price', '$orderItems.qty'],
              },
            },
          },
        },
        {
          $project: {
            _id: 1,
            qtyExport: '$totalQty',
            priceExport: {
              $round: [{ $divide: ['$totalPrice', '$totalQty'] }, 0],
            },
          },
        },
      ]),
    ])
    const result = resultImport.map((item) => {
      const index = resultOrder.findIndex(
        (order) => order._id.toString() === item._id.toString()
      )
      const idxOpenning = resultOpening.findIndex(
        (book) => book._id.toString() === item._id.toString()
      )
      const qtyExport = index > -1 ? resultOrder[index].qtyExport : 0
      const openingStock =
        idxOpenning > -1 ? resultOpening[idxOpenning].totalQty : 0
      const priceExport =
        index > -1 ? resultOrder[index].priceExport : item.bookPrice
      return {
        ...item,
        openingStock,
        endingStock: item.qtyImport + openingStock - qtyExport,
        qtyExport,
        priceExport,
      }
    })
    return res.status(200).json({
      data: {
        data: result,
      },
    })
  } catch (error) {
    return res.status(500).json({ msg: error.message })
  }
}
