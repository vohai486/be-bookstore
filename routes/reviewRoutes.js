const express = require('express')
const router = express.Router({ mergeParams: true })
const ctrl = require('../controllers/reviewController')
const { protect, optional } = require('../middleware/authMiddleware')

router.route('/').get(optional, ctrl.listReview)
router.use(protect)
router
  .route('/add')
  .post(ctrl.uploadReviews, ctrl.handleImagePath, ctrl.createReview)
router
  .route('/:id')
  .patch(ctrl.uploadReviews, ctrl.handleImagePath, ctrl.updateReview)
  .delete(ctrl.deleteReview)
router.route('/:id/like').post(ctrl.likeReview)
router.route('/:id/unlike').post(ctrl.unLikeReview)

module.exports = router
