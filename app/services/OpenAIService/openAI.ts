// utils/openAI.ts
import axios from "axios";
import { OPEN_API_KEY } from "@env";

const openAI = axios.create({
    baseURL: "https://api.openai.com/v1/",
    headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPEN_API_KEY}`,
    },
    timeout: 60000,
});

export default openAI;