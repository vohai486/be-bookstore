const express = require('express')
const router = express.Router()
const ctrl = require('../controllers/userController')
const { protect, isAdmin } = require('../middleware/authMiddleware')

router.use(protect)
router
  .route('/me')
  .get(ctrl.getMe, ctrl.getUser)
  .patch(ctrl.uploadAvatar, ctrl.resizeAvatarImages, ctrl.updateMe)
router.get('/me/recently_viewed', ctrl.getRecently_viewed)
router.patch('/updateMyPassword', ctrl.updatePassword)
router
  .route('/me/address')
  .post(ctrl.addAddressUser)
  .get(ctrl.getListAddressUser)

router
  .route('/me/address/:id')
  .delete(ctrl.deleteAddressUser)
  .patch(ctrl.updateAddressUser)
router.use(isAdmin)

router
  .route('/:id')
  .get(ctrl.getUser)
  .patch(ctrl.uploadAvatar, ctrl.resizeAvatarImages, ctrl.updateUser)
  .delete(ctrl.deleteAUser)
router.get('/', ctrl.getAllUsers)

module.exports = router
