// config.js
import dotenv from "dotenv";
dotenv.config();

export const PORT = process.env.PORT || 5001;
export const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
