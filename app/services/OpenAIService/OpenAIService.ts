import axios from "axios";
import { OPEN_API_KEY } from "@env";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import ConversationService from "@/app/services/ConversationService";
import ReminderService from "../ReminderService";
import Reminder from "../../types/Reminder";
import AIPrompts from "../../constants/AIPrompts";
import QuestionStep from "../../types/QuestionStep";
import { UserStats } from "../../types/UserStats";
import { Conversation } from "../../types/Conversation";
import { functionSchemas } from "./functionSchemas";
import { retryOpenAIRequest } from "@/app/utils/retryOpenAIRequest";

const openAI = axios.create({
    baseURL: "https://api.openai.com/v1/",
    headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPEN_API_KEY}`,
    },
    timeout: 60000,
});

const OpenAIService = {

    generatePlan: async (userInput: string, conversationId: string, user: any): Promise<string> => {
        try {
            if (!user?.uid) throw new Error("User ID is missing.");

            // Fetch the current conversation
            const conversation = await ConversationService.getConversationById(conversationId);

            // Retrieve past conversations for context
            const pastConversations = await ConversationService.getAllConversations(user.uid);

            // Format past messages, replacing 'bot' with 'assistant'
            const formattedPastConversations = pastConversations.flatMap(convo =>
                convo.messages.map(msg => ({
                    role: msg.role === "bot" ? "assistant" : msg.role,
                    content: msg.text
                }))
            ).slice(-20);

            // Get messages from the current conversation, ensuring valid roles
            const pastMessages = conversation?.messages?.map((msg) => ({
                role: msg.role === "bot" ? "assistant" : msg.role,
                content: msg.text
            })) || [];

            // Construct messages array
            const messages = [
                { role: "system", content: AIPrompts.JOG_PLANNING_START },
                ...formattedPastConversations,
                ...pastMessages,
                { role: "user", content: userInput }
            ];

            // Create a title for the conversation
            const titleResponse = await retryOpenAIRequest(
                async () => {
                    return await openAI.post(
                        "/chat/completions",
                        {
                            model: "gpt-4o-mini",
                            messages: [
                                ...messages,
                                { role: "system", content: AIPrompts.CONVO_TITLE },
                            ],
                            temperature: 0.7,
                            max_tokens: 15,
                        },
                        {
                            headers: {
                                Authorization: `Bearer ${OPEN_API_KEY}`,
                                "Content-Type": "application/json",
                            },
                        }
                    );
                },
                "gpt-4o-mini",
                {
                    retries: 2,
                    delayMs: 1000,
                    backoffFactor: 2,
                    fallbackModel: "gpt-3.5-turbo",
                }
            );

            // Set the title in Firestore
            const generatedTitle = titleResponse.data.choices[0].message.content?.trim() || "Untitled";
            await ConversationService.updateConversationById(conversationId, {
                title: generatedTitle,
            });

            console.log("Sending messages to OpenAI:", messages);

            // Send request to OpenAI
            const response = await retryOpenAIRequest(
                async (model) => {
                    return openAI.post(
                        "/chat/completions",
                        {
                            model,
                            messages,
                            temperature: 0.7,
                            tools: [functionSchemas[0]],
                        },
                        {
                            headers: {
                                Authorization: `Bearer ${OPEN_API_KEY}`,
                                "Content-Type": "application/json",
                            },
                        }
                    );
                },
                "gpt-4o",
                {
                    retries: 4,
                    delayMs: 1000,
                    backoffFactor: 2,
                    fallbackModel: "gpt-3.5-turbo",
                }
            );

            const openAIResponse = response.data.choices[0];

            // If OpenAI detects multiple jogs, execute creation for each
            if (openAIResponse.message?.tool_calls) {
                for (const toolCall of openAIResponse.message.tool_calls) {
                    if (toolCall.function.name === "createMultipleJogs") {
                        const functionArgs = JSON.parse(toolCall.function.arguments);
                        return await OpenAIService.createMultipleJogs(functionArgs.jogs, conversationId, user);
                    }
                }
            }

            // If no jog was created, return AI’s text response
            return openAIResponse.message?.content || "No response from AI";
        } catch (error: any) {
            console.error(" OpenAI API Error:", error.response?.data || error.message);
            return "I'm having trouble processing your request. Please try again.";
        }
    },
    generateSymptomQuestions: async (userStats: UserStats, reminders: Reminder[]): Promise<QuestionStep[]> => {

        if (!userStats.userId) throw new Error("User ID is missing.");

        const todaysConversations: Conversation[] = await ConversationService.getTodaysConversationsByUserId(userStats.userId) || [];


        const minimalReminders: any[] = reminders.map((reminder) => ({
            title: reminder.title,
            dueDate: reminder.dueDate instanceof Timestamp ? reminder.dueDate.toDate().toISOString() : reminder.dueDate?.toISOString() || null,
            completed: reminder.completed,
            completedAt: reminder.completedAt?.toDate().toISOString() || null,
            category: reminder.category,
            isStepBased: reminder.isStepBased,
            steps: (reminder.steps || []).map((step, index) => ({
                id: `${index + 1}`,
                title: step.title || "Untitled",
                dueDate: step.dueDate?.toDate().toISOString() || null,
                completed: step.completed,
                completeStatus: step.completeStatus,
            })),
        }));

        console.log("Minimal reminders:", minimalReminders);

        try {


            const symptomProfile = {
                initial: {
                    concentration: userStats.symptomStats.initialConcentrationSeverity,
                    memory: userStats.symptomStats.initialMemorySeverity,
                    mood: userStats.symptomStats.initialMoodSeverity,
                },
                lastLogged: {
                    concentration: userStats.symptomStats.lastLoggedConcentrationSeverity,
                    memory: userStats.symptomStats.lastLoggedMemorySeverity,
                    mood: userStats.symptomStats.lastLoggedMoodSeverity,
                },


                recentLogs: Object.entries(userStats.symptomStats.dailyLogs || {})
                    .slice(-7) // latest 7 days
                    .map(([date, log]) => ({
                        date,
                        concentration: log.symptomSeverity.concentration,
                        memory: log.symptomSeverity.memory,
                        mood: log.symptomSeverity.mood,
                    })),
            };


            const messages = [
                {
                    role: "system",
                    content: AIPrompts.QUESTIONNAIRE_START,
                },
                {
                    role: "user",
                    content: `User symptom profile:\n${JSON.stringify(symptomProfile, null, 2)}
                      Today's reminders:\n${JSON.stringify(minimalReminders, null, 2)}
                      Please generate 1-3 daily reflection questions that focus on the user's most severe and consistently problematic symptoms.`,
                },
            ];

            console.log("Estimated tokens:", JSON.stringify(messages).length / 4);

            const response = await retryOpenAIRequest(
                (model) =>
                    openAI.post("/chat/completions", {
                        model,
                        messages,
                        temperature: 0.7,
                    })
            );

            const raw = response.data.choices?.[0]?.message?.content || "";

            // Clean up JSON if GPT wraps it in code block or extra text (it shouldnt, but fail-safe)
            const cleaned = raw
                .replace(/```json|```/g, "")
                .replace(/^[^\[]*/, "")
                .replace(/[^\]]*$/, "");

            const parsed: QuestionStep[] = JSON.parse(cleaned.trim());
            return parsed;
        } catch (error: any) {
            if (axios.isAxiosError(error)) {
                console.error("OpenAI Axios Error (network):", error.toJSON?.() || error.message);
            } else {
                console.error("Non-Axios error:", error);
            }
            return [];
        }
    },

    generateDailySummaryAndAdvice: async (
        reminders: Reminder[],
        questionnaireAnswers: Record<string, string | number>,
        userStats: UserStats,
    ): Promise<{ summary: string; recommendations: string }> => {


        if (!userStats.userId) throw new Error("User ID is missing.");

        const todaysMessages: Conversation[] = await ConversationService.getTodaysConversationsByUserId(userStats.userId) || [];

        if (!userStats.userId) throw new Error("User ID is missing.");

        try {
            const symptomProfile = {
                initial: {
                    concentration: userStats.symptomStats.initialConcentrationSeverity,
                    memory: userStats.symptomStats.initialMemorySeverity,
                    mood: userStats.symptomStats.initialMoodSeverity,
                },
                lastLogged: {
                    concentration: userStats.symptomStats.lastLoggedConcentrationSeverity,
                    memory: userStats.symptomStats.lastLoggedMemorySeverity,
                    mood: userStats.symptomStats.lastLoggedMoodSeverity,
                },
                recentLogs: Object.entries(userStats.symptomStats.dailyLogs || {})
                    .slice(-7)
                    .map(([date, log]) => ({
                        date,
                        concentration: log.symptomSeverity.concentration,
                        memory: log.symptomSeverity.memory,
                        mood: log.symptomSeverity.mood,
                    })),
            };

            const formattedMessages = todaysMessages.flatMap((conversation) =>
                conversation.messages.map((msg) => `• ${msg.role === "bot" ? "AI" : "User"}: ${msg.text}`)
            ).slice(-20).join("\n");


            const response = await retryOpenAIRequest(
                (model) =>
                    openAI.post("/chat/completions", {
                        model,
                        messages: [
                            { role: "system", content: AIPrompts.QUESTIONNAIRE_WRAPPER },
                            {
                                role: "user",
                                content: `
            Today's reminders:\n${JSON.stringify(reminders, null, 2)}
            
            User questionnaire answers:\n${JSON.stringify(questionnaireAnswers, null, 2)}
            
            User symptom profile:\n${JSON.stringify(symptomProfile, null, 2)}
            
            Today's conversation:\n${formattedMessages}
                      `,
                            },
                        ],
                        temperature: 0.7,
                    }),
                "gpt-4o", // primary model
                {
                    retries: 3,
                    delayMs: 1000,
                    fallbackModel: "gpt-3.5-turbo",
                }
            );

            const rawText = response.data.choices?.[0]?.message?.content || "";
            const [summaryPart, recommendationPart] = rawText
                .split(/RECOMMENDATIONS:/i)
                .map((s: string) => s.trim());

            const summary = summaryPart.replace(/^SUMMARY:/i, "").trim();
            const recommendations = (recommendationPart || "").trim();

            return { summary, recommendations };
        } catch (err) {
            console.error("GPT Daily Summary/Advice error:", err);
            return {
                summary: "Unable to generate a summary today.",
                recommendations: "Try to reflect on how your tasks and focus felt today.",
            };
        }
    },

    generateFinalResponse: async (jogs: Reminder[], user: any): Promise<string> => {

        try {
            if (!user?.uid) throw new Error("User ID is missing.");

            const response = await retryOpenAIRequest(
                async () => {
                    return await openAI.post(
                        "/chat/completions",
                        {
                            model: "gpt-4o-mini",
                            messages: [
                                {
                                    role: "system",
                                    content: AIPrompts.REMINDER_DESCRIPTION,
                                },
                                {
                                    role: "user",
                                    content: `User jog data:\n${JSON.stringify(jogs, null, 2)}`,
                                },
                            ],
                            temperature: 0.7,
                            max_tokens: 100,
                        },
                        {
                            headers: {
                                Authorization: `Bearer ${OPEN_API_KEY}`,
                                "Content-Type": "application/json",
                            },
                        }
                    );
                },
                "gpt-4o-mini",
                {
                    retries: 2,
                    delayMs: 1000,
                    backoffFactor: 2,
                    fallbackModel: "gpt-3.5-turbo",
                }
            );

            const jogCreationResponse = response.data.choices[0].message.content?.trim() || "No jogs created.";
            console.log("Jog creation response:", jogCreationResponse);

            return jogCreationResponse;
        }
        catch (error) {
            console.error("Error generating final response:", error);
            return "Failed to generate final response.";
        }
    },

    createMultipleJogs: async (jogs: any[], conversationId: string, user: any): Promise<string> => {
        try {
            if (!user?.uid) throw new Error("User ID is missing.");

            for (const jogData of jogs) {
                const [hours, minutes] = jogData.startTime.split(":").map((time: string) => parseInt(time));

                const jogEntry: Reminder = {
                    reminderId: "",
                    title: jogData.jogName || "Unnamed Jog",
                    userId: user.uid,
                    conversationId,
                    description: null,
                    completed: false,
                    completeStatus: "loading",
                    deleted: false,
                    dueDate: Timestamp.fromDate(new Date(new Date().setHours(hours, minutes, 0, 0))),
                    category: "AI Jog",
                    reminderEnabled: true,
                    isStepBased: jogData.isStepBased || false,
                    createdAt: Timestamp.now(),
                    updatedAt: Timestamp.now(),
                    reminderIntervals: [{
                        currentInterval: 0,
                        countOfIntervals: (jogData.reminderTimes.length * jogData.reminderTimes.length),
                        intervals: jogData.reminderTimes,
                        hasTriggered: false,
                    }],
                    updateCount: 0,
                    steps: jogData.isStepBased ? jogData.steps.map((step: any, index: number) => ({
                        id: index + 1,
                        title: step.title,
                        completed: false,
                        completeStatus: "upcoming",
                        dueDate: Timestamp.fromDate(new Date(new Date().setHours(
                            parseInt(step.dueDate.split(":")[0], 10),
                            parseInt(step.dueDate.split(":")[1], 10),
                            0, 0
                        ))),
                    })) : [],
                    isAI: true,

                };

                await ReminderService.createReminder(jogEntry);


            }

            const jogCreationResponse: string = await OpenAIService.generateFinalResponse(jogs, user);

            // Update conversation history with confirmation message
            await ConversationService.updateConversationById(conversationId, {
                messages: [
                    ...(await ConversationService.getConversationById(conversationId))?.messages || [],
                    {
                        date: Timestamp.now(),
                        role: "bot",
                        text: jogCreationResponse,
                    },
                ],
            });

            return jogCreationResponse;

        } catch (error) {
            console.error("Error creating jogs:", error);
            return "Failed to create jogs: " + ((error as Error).message || "unknown error.");
        }
    },
};

export default OpenAIService;