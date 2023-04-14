const express = require('express')
const router = express.Router()
const ctrl = require('../controllers/notifyController')
const { protect } = require('../middleware/authMiddleware')

router.route('/').post(ctrl.addNotify).get(ctrl.getAdminNotify)
router.route('/:id/mark-read').patch(ctrl.markReadNotify)
router.route('/:id/mark-unread').patch(ctrl.markUnReadNotify)

router.route('/user').get(protect, ctrl.getUserNotify)

module.exports = router
