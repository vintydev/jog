import AIPrompts from "@/app/constants/AIPrompts";
import { retryOpenAIRequest } from "@/app/utils/retryOpenAIRequest";
import ConversationService from "../../ConversationService";
import ReminderService from "../../ReminderService";
import { functionSchemas } from "../functionSchemas";
import openAI from "../openAI";
import OpenAIService from "../OpenAIService";

export default async function generatePlan(userInput: string, conversationId: string, user: any): Promise<string> {
    if (!user?.uid) throw new Error("User ID is missing.");

    const conversation = await ConversationService.getConversationById(conversationId);
    const pastConversations = await ConversationService.getAllConversations(user.uid);

    const formattedPastConversations = pastConversations.flatMap(convo =>
        convo.messages.map(msg => ({
            role: msg.role === "bot" ? "assistant" : msg.role,
            content: msg.text,
        }))
    ).slice(-20);

    const pastMessages = conversation?.messages?.map(msg => ({
        role: msg.role === "bot" ? "assistant" : msg.role,
        content: msg.text,
    })) || [];

    const messages = [
        { role: "system", content: AIPrompts.JOG_PLANNING_START },
        ...formattedPastConversations,
        ...pastMessages,
        { role: "user", content: userInput },
    ];

    const titleResponse = await retryOpenAIRequest(
        async (model) =>
            openAI.post("/chat/completions", {
                model,
                messages: [...messages, { role: "system", content: AIPrompts.CONVO_TITLE }],
                temperature: 0.7,
                max_tokens: 15,
            }),
        "gpt-4o-mini"
    );

    const generatedTitle = titleResponse.data.choices[0].message.content?.trim() || "Untitled";
    await ConversationService.updateConversationById(conversationId, { title: generatedTitle });

    const response = await retryOpenAIRequest(
        async (model) =>
            openAI.post("/chat/completions", {
                model,
                messages,
                temperature: 0.7,
                tools: [functionSchemas[0]],
            }),
        "gpt-4o"
    );

    const openAIResponse = response.data.choices[0];

    if (openAIResponse.message?.tool_calls) {
        for (const toolCall of openAIResponse.message.tool_calls) {
            if (toolCall.function.name === "createMultipleJogs") {
                const functionArgs = JSON.parse(toolCall.function.arguments);
                return await OpenAIService.createMultipleJogs(functionArgs.jogs, conversationId, user);
            }
        }
    }


    return openAIResponse.message?.content || "No response from AI";
}

