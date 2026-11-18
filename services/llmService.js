const { GoogleGenAI } = require('@google/genai');
const Groq = require('groq-sdk');

const geminiAi = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

function extractJSON(text) {
    try {
        const match = text.match(/\{[\s\S]*\}/);
        return match ? JSON.parse(match[0]) : null;
    } catch {
        return null;
    }
}

async function getGeminiAnalysis(prompt) {
    try {
        const response = await geminiAi.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: prompt,
            config: { responseMimeType: "application/json" }
        });
        const result = JSON.parse(response.text);
        result.model_used = "Gemini 3.8 Flash";
        return result;
    } catch (error) {
        console.error('Gemini API Error:', error.message);
        return null;
    }
}

async function getGroqAnalysis(prompt) {
    try {
        const response = await groq.chat.completions.create({
            messages: [
                {
                    role: 'system',
                    content: 'You are an advanced shopping AI. Output ONLY a valid JSON object matching the requested schema. No markdown.'
                },
                { role: 'user', content: prompt }
            ],
            model: 'qwen/qwen3.8-27b', // Using the reasoning model you verified
            temperature: 0.5
        });
        
        const result = extractJSON(response.choices[0]?.message?.content || "");
        if (result) {
            result.model_used = "Qwen 3.8 27B (Groq)";
            return result;
        }
        return null;
    } catch (error) {
        console.error('Groq API Error:', error.message);
        return null;
    }
}

async function analyzeDeals(payload) {
    const prompt = `
    You are a strict data-parsing shopping assistant. Your ONLY job is to parse the provided JSON data. 

    1. Product Searched: ${payload.product}
    2. User-Defined Category: ${payload.category}
    3. Expected Price Range: ${payload.priceRange}
    4. Current Live Prices Across Stores: ${JSON.stringify(payload.current_market_prices)}

    Task:
    1. Look EXCLUSIVELY at the "Current Live Prices" array. Trust the JSON array completely.
    2. STATISTICAL OUTLIER FILTERING: Determine the median price of the high-ticket items in the list. Actively ignore and completely remove any items priced significantly lower (e.g., less than 40% of the median), as these are mathematically guaranteed to be accessories (cases, cables) or scams.
    3. From the remaining statistically valid items that match the "Product Searched", pick the Top 3 deals with the LOWEST prices. 
    4. CRITICAL LINK RULE: You MUST extract and preserve the exact "link" string from the input array for each selected deal. DO NOT invent, alter, or omit the link.
    
    Output a strict JSON object:
    {
      "top_3_deals": [
        { "item_name": "Exact listing name", "store": "Store Name", "price": 0, "link": "https://..." }
      ],
      "buy_now": boolean,
      "verdict": "Keep it under 3 sentences. State if it's a good deal based on the data."
    }
    `;

    const [geminiResult, groqResult] = await Promise.all([
        getGeminiAnalysis(prompt),
        getGroqAnalysis(prompt)
    ]);

    const successfulAnalyses = [geminiResult, groqResult].filter(res => res !== null);

    if (successfulAnalyses.length === 0) {
        throw new Error("Both AI models are currently unavailable.");
    }

    return successfulAnalyses[0]; 
}

module.exports = { analyzeDeals };