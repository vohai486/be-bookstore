const express = require('express')
const router = express.Router()
const ctrl = require('../controllers/warehouseController')

router.route('/import').post(ctrl.stockEntries)
router.route('/import').post(ctrl.stockEntries)
router.route('/import/:id').patch(ctrl.updateStockEntries)
router.route('/export').post(ctrl.stockOutput)
router.route('/export/:id').patch(ctrl.updateStockOutput)

module.exports = router
