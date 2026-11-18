const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    product_name: String,
    market_data: Array, // Stores the array of prices across stores
    created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Product', productSchema);