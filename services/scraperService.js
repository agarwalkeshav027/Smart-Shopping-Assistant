const axios = require('axios');
const cheerio = require('cheerio');

async function scrapeProductTitle(url) {
    try {
        const { data } = await axios.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
            timeout: 5000
        });
        const $ = cheerio.load(data);
        
        const title = $('#productTitle').text().trim() || 
                      $('.B_NuCI').text().trim() || 
                      $('h1').first().text().trim();
                      
        return { title: title || "Unknown Product" };
    } catch (error) {
        console.error("Title scrape failed:", error.message);
        return { title: "Unknown Product" };
    }
}

module.exports = { scrapeProductTitle };