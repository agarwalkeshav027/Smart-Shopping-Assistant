const axios = require('axios');

async function searchCrossStorePrices(productName) {
    try {
        const response = await axios.get('https://serpapi.com/search.json', {
            params: {
                engine: 'google_shopping',
                q: productName,
                gl: 'in', 
                hl: 'en', 
                api_key: process.env.SERPAPI_KEY
            }
        });

        const results = response.data.shopping_results || [];
        
        return results.slice(0, 5).map(item => ({
            item_name: item.title,
            store: item.source,
            price: item.extracted_price, 
            // NEW: Fallback to product_link if link is missing
            link: item.link || item.product_link || "N/A" 
        }));

    } catch (error) {
        console.error("Shopping search failed:", error.message);
        return [];
    }
}

async function searchUpcomingSales(query) {
    try {
        const response = await axios.get('https://serpapi.com/search.json', {
            params: {
                engine: 'google',
                q: query,
                gl: 'in',
                hl: 'en',
                api_key: process.env.SERPAPI_KEY
            }
        });

        const results = response.data.organic_results || [];
        
        // Extract the text snippets from the top 3 search results for the LLM to read
        return results.slice(0, 3).map(item => item.snippet);

    } catch (error) {
        console.error("Web search failed:", error.message);
        return [];
    }
}

module.exports = { searchCrossStorePrices, searchUpcomingSales };