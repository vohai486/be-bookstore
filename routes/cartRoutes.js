const express = require('express')
const router = express.Router()
const ctrl = require('../controllers/cartController')
const { protect } = require('../middleware/authMiddleware')

router.use(protect)
router
  .route('/')
  .get(ctrl.getCart)
  .post(ctrl.addCart)
  .patch(ctrl.updateCart)
  .delete(ctrl.removeCart)

module.exports = router
