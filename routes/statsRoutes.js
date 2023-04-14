const express = require('express')
const router = express.Router()
const ctrl = require('../controllers/statsController')

router.route('/import').get(ctrl.statsStockEntries)
router.route('/order').get(ctrl.statsOrder)
router.route('/').get(ctrl.statsImportExport)

module.exports = router
