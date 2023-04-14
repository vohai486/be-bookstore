const express = require('express')
const router = express.Router()
const categoryController = require('../controllers/categoryController')

router
  .route('/')
  .post(categoryController.createCategory)
  .get(categoryController.getAllCategories)
router.get('/:_id', categoryController.getCategoryDetail)

module.exports = router
