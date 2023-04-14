const express = require('express')
const ctrl = require('../controllers/bookController')
const { protect, isAdmin } = require('../middleware/authMiddleware')
const reviewRouter = require('./reviewRoutes')
const router = express.Router()

router.use('/:bookId/reviews', reviewRouter)
router
  .route('/')
  .get(ctrl.getAllBooks)
  .post(
    protect,
    isAdmin,
    ctrl.uploadBookImages,
    ctrl.resizeBookImages,
    ctrl.createBook
  )
router.get('/search', ctrl.searchBook)

router
  .route('/:id')
  .get(ctrl.getABook)
  .patch(
    protect,
    isAdmin,
    ctrl.uploadBookImages,
    ctrl.resizeBookImages,
    ctrl.updateABook
  )
  .delete(protect, isAdmin, ctrl.deleteBook)

module.exports = router
