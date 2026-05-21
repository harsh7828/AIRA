import axios from "axios";
import FormData from "form-data";
import fs from "fs";

export const transcribeAudio = async (filePath) => {
    try {
        if (!process.env.GROQ_API_KEY) {
            throw new Error("GROQ_API_KEY is not defined in .env");
        }

        const formData = new FormData();
        formData.append("file", fs.createReadStream(filePath));
        formData.append("model", "whisper-large-v3");
        formData.append("response_format", "json");

        const response = await axios.post("https://api.groq.com/openai/v1/audio/transcriptions", formData, {
            headers: {
                ...formData.getHeaders(),
                Authorization: `Bearer ${process.env.GROQ_API_KEY}`
            }
        });

        return response.data.text;
    } catch (error) {
        console.error("Groq Transcription Error:", error.response?.data || error.message);
        throw new Error("Failed to transcribe audio with Groq");
    }
};
