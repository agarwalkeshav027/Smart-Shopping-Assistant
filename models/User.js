const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    search_history: [{
        product_name: String,
        best_price: Number,
        store: String,
        date: { type: Date, default: Date.now }
    }]
});

module.exports = mongoose.model('User', userSchema);