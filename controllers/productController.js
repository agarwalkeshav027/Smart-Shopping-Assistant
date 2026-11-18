const { searchCrossStorePrices, searchUpcomingSales } = require('../services/searchService');
const { analyzeDeals } = require('../services/llmService');
const { scrapeProductTitle } = require('../services/scraperService'); 
const Product = require('../models/Product'); 
const sqlDb = require('../config/sqliteDB');  

const evaluateProduct = async (req, res) => {
    const { inputQuery, isUrl, userPrompt, category, priceRange } = req.body;
    
    // NEW LOGIC: Require Product Name OR (Category AND Price Range)
    if (!inputQuery && (!category || !priceRange)) {
        return res.status(400).json({ error: 'Please provide either a Product Name/URL, OR both Category and Price Range.' });
    }

    try {
        let productName = inputQuery;
        
        // If URL, scrape title. If no inputQuery, create a search term from Category & Price
        if (inputQuery && isUrl) {
            const scrapedData = await scrapeProductTitle(inputQuery);
            productName = scrapedData.title;
        } else if (!inputQuery) {
            productName = `Best ${category} ${priceRange}`; // e.g., "Best Smartphone 10000-15000"
        }

        const currentDateContext = "October 2026";
        const [storePrices, salesContext] = await Promise.all([
            searchCrossStorePrices(productName),
            searchUpcomingSales(`upcoming tech ecommerce sales India ${currentDateContext}`)
        ]);

        // NEW: Add this line to debug the raw data coming from SerpApi
        console.log("Raw Market Data sent to AI:", storePrices);

        const analysisPayload = {
            product: productName,
            category: category || "Not specified", // Fallback if empty
            priceRange: priceRange || "Not specified", // Fallback if empty
            current_market_prices: storePrices,
            upcoming_sales_news: salesContext,
            user_constraint: userPrompt || "Find the best deals and advise if I should buy now."
        };

        const aiAnalysis = await analyzeDeals(analysisPayload);

        try {
            await Product.create({ product_name: productName, market_data: storePrices });
        } catch (dbErr) { console.error("Mongo Save Error:", dbErr.message); }

        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.split(' ')[1] !== 'null') {
            try {
                const token = authHeader.split(' ')[1];
                const jwt = require('jsonwebtoken');
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                
                const bestDeal = aiAnalysis.top_3_deals[0] || { price: 0, store: 'Unknown' };
                const stmt = sqlDb.prepare('INSERT INTO search_history (user_id, product_name, best_price, store) VALUES (?, ?, ?, ?)');
                stmt.run(decoded.userId, productName, bestDeal.price, bestDeal.store);
            } catch (err) { console.log("Guest search or invalid token, history not saved."); }
        }

        res.json({
            product_name: productName,
            available_deals: storePrices,
            ai_recommendation: aiAnalysis
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { evaluateProduct };