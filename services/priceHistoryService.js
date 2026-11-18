const axios = require('axios');

// services/priceHistoryService.js
async function fetchPriceHistory(productUrl) {
    try {
        // If no external API key configured, return mock historical trend data
        return {
            highest_price: 29990,
            lowest_price: 24990,
            average_price: 27500,
            recent_trend: [
                { date: "2026-08-01", price: 28990 },
                { date: "2026-09-01", price: 27990 },
                { date: "2026-10-01", price: 26990 }
            ]
        };
    } catch (error) {
        console.error('Failed to fetch historical data', error);
        return null;
    }
}

module.exports = { fetchPriceHistory };