
import { GoogleGenAI, GenerateContentResponse, Part } from "@google/genai";
import { FoodCalorieInfo } from '../types';
import { Language } from "../src/i18n";

const API_KEY = process.env.VITE_GEMINI_API_KEY;
const MODEL_NAME = process.env.VITE_GEMINI_MODEL;

if (!API_KEY) {
  console.warn("API_KEY environment variable not found. Gemini API calls will fail.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY || "MISSING_API_KEY" });
const model: string = MODEL_NAME || "gemini-2.5-pro";

const buildPrompt = (language: Language) => `Analyze the food items in this image. Identify distinct food items. If you see multiple identical instances of a food item (e.g., two identical tacos, three of the same cookies), group them. For each food item or group of identical items, provide:
1. 'foodItem' (string): The name of the food.
2. 'caloriesPerItem' (number): The estimated calorie count for a SINGLE instance of this item.
3. 'quantity' (number): The number of identical items identified in this group. If it's a single unique item, quantity is 1.
4. 'servingSize' (string): A common serving size description for a SINGLE instance of this item.
5. 'likelyIngredients' (string[]): A short list of the most likely visible or typical ingredients/components.
6. 'preparationStyle' (string): A brief description of how the food appears to be prepared or presented. Do not write a recipe or step-by-step instructions.
7. 'nutritionNotes' (string): A short plain-language summary of what stands out nutritionally about this item.
Return the response strictly as a JSON array of objects. Each object must follow this structure.
Example: \`[{\"foodItem\": \"Beef Taco\", \"caloriesPerItem\": 250, \"quantity\": 2, \"servingSize\": \"1 taco\", \"likelyIngredients\": [\"beef\", \"tortilla\", \"lettuce\", \"cheese\"], \"preparationStyle\": \"Folded tortilla with seasoned beef and toppings\", \"nutritionNotes\": \"Moderate protein, higher sodium and fat depending on cheese and sauces\"}]\`.
Write all string fields in ${language === "es" ? "Spanish" : "English"}.
Only return the JSON array, without any other text or explanations. Do not include items if you cannot confidently estimate their calories or identify their quantity.`;

export const analyzeImageForCalories = async (
  base64Image: string,
  mimeType: string,
  language: Language = "es"
): Promise<FoodCalorieInfo[]> => {
  if (!API_KEY) {
    throw new Error("API_KEY environment variable not set. Cannot call Gemini API.");
  }

  try {
    const imagePart: Part = {
      inlineData: {
        mimeType: mimeType,
        data: base64Image,
      },
    };

    const textPart: Part = {
      text: buildPrompt(language),
    };

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: model,
      contents: { parts: [imagePart, textPart] },
      config: {
        responseMimeType: "application/json",
        temperature: 0.2, 
      },
    });

    if (!response.text) {
      throw new Error("No text content in API response.");
    }

    let jsonStr = response.text.trim();
    const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
    const match = jsonStr.match(fenceRegex);
    if (match && match[2]) {
      jsonStr = match[2].trim();
    }
    
    if (jsonStr.startsWith('`') && jsonStr.endsWith('`')) {
        jsonStr = jsonStr.substring(1, jsonStr.length - 1);
    }

    const parsedData = JSON.parse(jsonStr);

    if (Array.isArray(parsedData) && parsedData.every(item => 
        typeof item.foodItem === 'string' &&
        typeof item.caloriesPerItem === 'number' &&
        typeof item.quantity === 'number' &&
        typeof item.servingSize === 'string' &&
        Array.isArray(item.likelyIngredients) &&
        item.likelyIngredients.every((ingredient: unknown) => typeof ingredient === 'string') &&
        typeof item.preparationStyle === 'string' &&
        typeof item.nutritionNotes === 'string'
    )) {
      return parsedData as FoodCalorieInfo[];
    } else {
      console.error("Parsed data is not in the expected format:", parsedData);
      throw new Error("AI response was not in the expected format. The response should include foodItem, caloriesPerItem, quantity, servingSize, likelyIngredients, preparationStyle, and nutritionNotes.");
    }

  } catch (error) {
    console.error("Error analyzing image with Gemini API:", error);
    if (error instanceof Error) {
        if(error.message.includes("API key not valid")) {
             throw new Error("Invalid API Key. Please check your API_KEY environment variable.");
        }
         throw new Error(`Gemini API request failed: ${error.message}`);
    }
    throw new Error("An unknown error occurred while analyzing the image.");
  }
};
