const express = require('express');
const router = express.Router();
const { evaluateProduct } = require('../controllers/productController');

router.post('/evaluate', evaluateProduct);

// MUST be exported like this:
module.exports = router;