const express = require('express')
const router = express.Router()
const ctrl = require('../controllers/orderController')
const { protect, isAdmin } = require('../middleware/authMiddleware')

router.use(protect)
router.route('/me').get(ctrl.getOrderUser).post(ctrl.createNewOrder)
router.route('/:id').get(ctrl.getDetailsOrder)
router.route('/:id/cancel').post(ctrl.cancelOrder)

router.use(isAdmin)
router.route('/').get(ctrl.getAllOrder)
router.route('/:id').patch(ctrl.updateOrder)
router.route('/:id/delivered').post(ctrl.confirmDelivered)

module.exports = router
