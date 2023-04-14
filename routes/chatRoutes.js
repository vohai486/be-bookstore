const express = require('express')
const router = express.Router()
const ctrl = require('../controllers/chatController')
const { protect } = require('../middleware/authMiddleware')

router.route('/').post(ctrl.createMessage).get(ctrl.getListUserChat)
router.route('/:userId/user').get(ctrl.getMessages)
router.route('/:id').patch(ctrl.updateIsReadChat)

module.exports = router
