import {
    GoogleGenAI,
    GenerateContentParameters,
    // Removed CitationMetadata and CitationSource imports to fix TS2305
} from '@google/genai';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { TrainingPlan } from './training-plan';
import { Rest } from './training-activity';
import { Running, Cycling, Swimming, TrainingActivity } from './training-activity';
import { User } from './user';
import { getRandomWorkout } from './workout-utils';
import { COACH_SYSTEM_INSTRUCTION, EXAMPLE_USER_PROMPT, SHORT_PROMPT } from './prompts';

// Load environment variables from .env file
dotenv.config();

// --- CONFIGURATION ---

// The SDK will automatically use GEMINI_API_KEY from process.env if available.
const API_KEY = process.env.GEMINI_API_KEY;
const MODEL_NAME = 'gemini-2.5-flash-preview-09-2025';

// Throw an error if the key is missing to fail early and securely
if (!API_KEY) {
    throw new Error("API Key Error: GEMINI_API_KEY is not set. Please create a .env file based on .env.example.");
}

// --- CORE AGENT FUNCTION ---


async function generateTriathlonPlan(prompt: string): Promise<{ text: string, sources: { uri: string, title: string }[] }> {
    // Initialize the AI client using the key from the environment
    const ai = new GoogleGenAI({ apiKey: API_KEY });

    // The core request payload contains only required, strictly-typed properties
    const request: GenerateContentParameters = {
        model: MODEL_NAME,
        contents: [{ role: "user", parts: [{ text: prompt }] }],
    };

    // Use an 'augmentedRequest' cast as 'any' to include properties 
    // ('tools' and 'systemInstruction') that may cause TS errors in specific SDK versions.
    const augmentedRequest = {
        ...request,
        // FIX TS2353: Move systemInstruction here
        systemInstruction: { parts: [{ text: COACH_SYSTEM_INSTRUCTION }] },
        // CRUCIAL: Enforce JSON output mode
        generationConfig: {
            responseMimeType: "application/json",
        },
        // CRUCIAL: Enable Google Search Grounding
        //tools: [{ googleSearch: {} }],
    } as any;

    try {
        // Use the augmented request with all necessary properties
        const response = await ai.models.generateContent(augmentedRequest);

        const candidate = response.candidates?.[0];
        const text = candidate?.content?.parts?.[0]?.text || "Failed to generate content.";
        
        let sources: { uri: string, title: string }[] = [];
        
        // Use groundingMetadata, which is common for Google Search results
        const groundingMetadata = candidate?.groundingMetadata;

        if (groundingMetadata && (groundingMetadata as any).groundingAttributions) {
            sources = (groundingMetadata as any).groundingAttributions
                .map((attribution: any) => ({ // Using 'any' since CitationSource import failed
                    uri: attribution.web?.uri || '',
                    title: attribution.web?.title || 'External Source',
                }))
                .filter((source: { uri: string, title: string }) => source.uri.length > 0 && source.title.length > 0);
        }
        
        return { text, sources };
    } catch (error) {
        console.error("Agent failed to generate content.", error);
        throw new Error("The triathlon coach service is currently unavailable. Please try again later.");
    }
}

// reads user profile and makes it into a propmopt// 
function userInfoToPrompt(username: string, userPrompt: string): string {
    const user = User.load(username);
    if (!user) {
        console.log(`--- No profile found for user: ${username}. Using base prompt. ---`);
        return userPrompt;
    }

    console.log(`--- Found profile for user: ${username} ---`);
    const userProfileText = `
    Here is the athlete's profile:
    - Age: ${user.age || 'N/A'}
    - Height: ${user.height || 'N/A'} cm
    - Weight: ${user.weight || 'N/A'} kg
    - 1-Hour Run Distance: ${user.run1hResult || 'N/A'} km
    - Cycling FTP: ${user.cyclingFtp || 'N/A'} watts
    - 100m Swim Time: ${user.swim100mTime || 'N/A'} seconds
    `;
    return `${userPrompt}\n\n${userProfileText}`;
}

/**
 * Parses the JSON output from the AI model and constructs a TrainingPlan object.
 * This function replaces AI-generated workouts with pre-defined ones from JSON files where applicable.
 * @param jsonString The raw JSON string from the AI model.
 * @returns A populated TrainingPlan object, or null if parsing fails.
 */
function createPlanFromJson(jsonString: string): TrainingPlan | null {
    try {
        const planJson = JSON.parse(jsonString);
        if (!planJson.trainingPlan) {
            console.error("--- Failed to find 'trainingPlan' in the model's output. ---");
            return null;
        }

        const agentPlan = new TrainingPlan();

        Object.keys(planJson.trainingPlan).forEach(dateStr => {
            const dayActivities = planJson.trainingPlan[dateStr];
            if (Array.isArray(dayActivities)) {
                dayActivities.forEach((activityData: any) => {
                    let newActivity: TrainingActivity | null = null;
                    const activityDate = new Date(dateStr);
                    const discipline: 'Running' | 'Swimming' | 'Cycling' | 'Rest' = activityData.discipline;

                    if (discipline === 'Rest') {
                        newActivity = new Rest(activityDate, activityData.description);
                    } else if (discipline === 'Running' || discipline === 'Swimming' || discipline === 'Cycling') {
                        const jsonFilePath = path.join(__dirname, '..', 'data', `${discipline.toLowerCase()}_workouts`, `${discipline.toLowerCase()}_workouts.json`);
                        const randomActivity = getRandomWorkout(jsonFilePath, discipline);

                        if (randomActivity) {
                            console.log(`--- Replacing AI ${discipline} workout with: "${randomActivity.description}" ---`);
                            randomActivity.date = activityDate;
                            newActivity = randomActivity;
                        } else {
                            console.warn(`--- Could not load random workout for ${discipline}. Using AI-generated version. ---`);
                            const activityClass = { Running, Swimming, Cycling }[discipline];
                            newActivity = new activityClass(activityDate, activityData.description, activityData.plannedDuration, activityData.distance);
                        }
                    }

                    if (newActivity) agentPlan.addActivity(newActivity);
                });
            }
        });
        return agentPlan;
    } catch (error) {
        console.error("--- Failed to parse JSON from model output. ---", error);
        return null;
    }
}

/**
 * Generates a plan for a specific user and saves it.
 * @param username The user for whom the plan is generated.
 * @param planName The name to save the plan under.
 * @param userPrompt The user's specific request for the plan.
 */
export async function runAgentForUser(username: string, planName: string, userPrompt: string) {
    console.log(`--- Running Agent for user: ${username}, plan: ${planName} ---`);
    const personalizedPrompt = userInfoToPrompt(username, userPrompt);
    const result = await generateTriathlonPlan(personalizedPrompt);

    console.log("\n--- Raw Model Output ---");
    console.log(result.text); // Log the raw text for debugging

    if (result.sources && result.sources.length > 0) {
        console.log("\n--- Grounding Sources (Real-time information used) ---");
        result.sources.forEach((s, index) => {
            console.log(`[${index + 1}] ${s.title}: ${s.uri}`);
        });
    }

    const agentPlan = createPlanFromJson(result.text);

    if (agentPlan) {
        agentPlan.save(username, planName);
        console.log(`\n--- Agent-generated plan saved as '${planName}' for user '${username}' ---`);
    } else {
        console.error(`\n--- Could not create or save the plan for user '${username}'. ---`);
    }
}

// --- USAGE EXAMPLE ---

async function main() {
    console.log("--- Starting Triathlon Coach Agent ---");

    try {
        // For direct execution, we'll use a default user and plan name
        await runAgentForUser("Bart", "test", SHORT_PROMPT);
        
    } catch (e) {
        if (e instanceof Error) {
            console.error(e.message);
        } else {
            console.error("An unknown error occurred.");
        }
    }
}

// Only run the main function if the script is executed directly
main();