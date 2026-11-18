// Load environment variables from .env file FIRST
require('dotenv').config(); 

const Groq = require('groq-sdk');

// Now process.env.GROQ_API_KEY will be populated
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function listModels() {
    try {
        const models = await groq.models.list();
        console.log("Exact API IDs available:");
        console.log(models.data.map(m => m.id));
    } catch (error) {
        console.error("Failed to fetch models:", error.message);
    }
}

listModels();