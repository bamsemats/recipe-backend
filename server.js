const express = require("express");
const axios = require("axios");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors({
	origin: "*",
}));
app.use(express.json());

const SYSTEM_PROMPT = `
You are an assistant that receives a list of ingredients that a user has and suggests a recipe they could make with some or all of those ingredients. You don't need to use every ingredient they mention in your recipe. The recipe can include additional ingredients they didn't mention, but try not to include too many extra ingredients. Format your response in markdown to make it easier to render to a web page.
`;

console.log("Anthropic API Key:", process.env.ANTHROPIC_API_KEY);


app.post("/api/get-recipe", async (req, res) => {
    try {
        const { ingredients } = req.body;
        if (!ingredients || !Array.isArray(ingredients)) {
            return res.status(400).json({ error: "Invalid ingredients list" });
        }

        const ingredientsString = ingredients.join(", ");

        const response = await axios.post(
            "https://api.anthropic.com/v1/messages",
            {
                model: "claude-3-haiku-20240307",
                max_tokens: 1024,
                system: SYSTEM_PROMPT,
                messages: [
                    { role: "user", content: `I have ${ingredientsString}. Please give me a recipe you'd recommend I make!` },
                ],
            },
            {
                headers: {
                    "x-api-key": process.env.ANTHROPIC_API_KEY,
                    "Content-Type": "application/json",
                    "anthropic-version": "2023-06-01",
                },
            }
        );

        res.json({ recipe: response.data.content[0].text });
    } catch (error) {
        res.status(error.response?.status || 500).json({ error: error.response?.data || "Server error" });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
