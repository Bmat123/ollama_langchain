# AI Triathlon Coach Agent

This project is an AI-powered agent that generates personalized triathlon training plans using Google's Gemini large language model. It's designed to create structured weekly plans based on a user's profile and specific goals.

A key feature of this agent is its ability to substitute AI-generated workouts with predefined, structured workouts from local JSON files. This ensures a high level of quality and consistency for key training sessions while still leveraging the AI's ability to structure a comprehensive plan.

## Features

*   **AI-Powered Plan Generation**: Utilizes Google's Gemini model to create dynamic training schedules.
*   **User Profile Personalization**: Considers user-specific data (age, FTP, run/swim times) to tailor the plan.
*   **Workout Substitution**: Automatically replaces AI-generated `Running` and `Swimming` workouts with randomly selected, predefined workouts from local JSON files.
*   **Structured JSON Output**: Enforces `application/json` as the response MIME type from the AI for reliable parsing.
*   **Fallback Mechanism**: If a predefined workout cannot be loaded (e.g., file not found), the system gracefully falls back to using the AI-generated workout description.
*   **Plan Persistence**: Saves the generated training plan to a JSON file associated with a specific user.

## Getting Started

Follow these instructions to set up and run the project on your local machine.

### Prerequisites

*   Node.js (v18 or later recommended)
*   npm or yarn
*   A Google Gemini API Key. You can get one from Google AI Studio.

### Installation & Setup

1.  **Install dependencies:**
    ```bash
    npm install
    ```
    or
    ```bash
    yarn install
    ```

2.  **Set up environment variables:**
    Create a `.env` file in the root of the project by copying the example file:
    ```bash
    cp .env.example .env
    ```
    Open the `.env` file and add your Google Gemini API key:
    ```
    GEMINI_API_KEY="your_api_key_here"
    ```

### Customizing Workouts (Optional)

You can add your own structured workouts to the system. The agent will randomly pick from these files when generating a plan.

*   **Running Workouts**: Add JSON files to the `data/running_workouts/` directory.
*   **Swimming Workouts**: Add JSON files to the `data/swimming_workouts/` directory.

Ensure the JSON structure matches the existing files in those directories (e.g., `running_workouts.json`).

### How to Launch

To run the agent and generate a new training plan, execute the main script using `ts-node`:

```bash
npx ts-node src/agent.ts
```

When you run the script, it will:
1.  Load the user profile for "Bart".
2.  Send a request to the Gemini API to generate a training plan.
3.  Replace the swimming and running workouts with predefined ones from your data files.
4.  Log the raw AI output and the final plan to the console.


You can modify the `main` function in `src/agent.ts` to change the user, plan name, or input prompt.