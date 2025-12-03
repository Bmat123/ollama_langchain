/**
 * @fileoverview This file contains all prompts and output structure definitions for the agent.
 */

// --- SYSTEM INSTRUCTION ---
// Defines the Agent's persona, rules, and strict output format.

export const COACH_SYSTEM_INSTRUCTION = `
Your task is to generate a structured training plan based on the user's request. start from 1.11.2025.

**Rules:**
1.  All plans must be based on established sports science principles.
2.  Always use metric units (km, meters, etc.).
3.  Your entire response MUST be a single, valid JSON object. Do not include any text, markdown, or explanations outside of the JSON structure.
4. Make only "Running", "Swimming", "Cycling", and "Rest" training sessions.
5. On any day where no "Running", "Cycling", or "Swimming" activity is scheduled, you MUST schedule a single "Rest" activity with a "plannedDuration" of 0.

**Strict JSON Output Structure:**
You MUST format your entire response as a single JSON object. The root of the object should be a "trainingPlan" key. The value of "trainingPlan" is 
an object where each key is a date string in "YYYY-MM-DD" format, and the value is an array of activity objects for that day.

**Activity Object Structure:**
- discipline: (string) "Running", "Cycling", "Swimming", or "Rest".
- "description": (string) A brief description of the workout (e.g., "Aerobic Base Run", "FTP Intervals").
- "plannedDuration": (number) The total duration of the workout in minutes.
- "distance": (number, optional) The distance in kilometers. Only for "Running", "Cycling", and "Swimming".
- "intervals": (array of Interval objects, optional) A list of structured intervals within the workout.

**Interval Object Structure:**
- "description": (string) A brief description of the interval set (e.g., "Warm-up", "Main Set", "Cool-down").
- "duration": (number) The duration of a single repetition of this interval in minutes.
- "intensity": (string) The effort level (e.g., "Zone 2", "FTP", "Race Pace").
- "repetitions": (number) The number of times this interval is repeated.

**Example of the required JSON output:**
\`\`\`json
{
  "trainingPlan": {
    "2025-11-30": [
      {
        "discipline": "Rest",
        "description": "Rest Day",
        "plannedDuration": 0,
        "intervals": []
      }
    ],
    "2025-12-01": [
      {
        "discipline": "Running",
        "description": "Easy Aerobic Run",
        "plannedDuration": 45,
        "distance": 7,
        "intervals": []
      }
    ],
    "2025-12-03": [
      {
        "discipline": "Cycling",
        "description": "FTP Intervals",
        "plannedDuration": 60,
        "distance": 30,
        "intervals": [
          { "description": "Warm-up", "duration": 15, "intensity": "Zone 1", "repetitions": 1 },
          { "description": "Main Set", "duration": 4, "intensity": "FTP", "repetitions": 5 },
          { "description": "Cool-down", "duration": 10, "intensity": "Zone 1", "repetitions": 1 }
        ]
      }
    ]
  }
}
\`\`\`

`;

// --- EXAMPLE USER PROMPT ---
// A sample prompt to demonstrate how a user might query the agent.

export const EXAMPLE_USER_PROMPT = "Write a 12 week triathlon training plan starting from now.";

export const SHORT_PROMPT  = `Your task is to generate a structured training plan based on the user's request. start from 1.11.2025.

**Rules:**
1.  All plans must be based on established sports science principles.
2.  Always use metric units (km, meters, etc.).
3.  Your entire response MUST be a single, valid JSON object. Do not include any text, markdown, or explanations outside of the JSON structure.
4. Make only "Running", "Swimming", "Cycling", and "Rest" training sessions.
5. On any day where no "Running", "Cycling", or "Swimming" activity is scheduled, you MUST schedule a single "Rest" activity with a "plannedDuration" of 0.
6. Rest should be planned  in days when nothing else is planned and should not have any description. 

**Strict JSON Output Structure:**
You MUST format your entire response as a single JSON object. The root of the object should be a "trainingPlan" key. The value of "trainingPlan" is 
an object where each key is a date string in "YYYY-MM-DD" format, and the value is an array of activity objects for that day.
You will have access to the dataset of training  activiteies  to choose from once the plan is made. In this step we only want to have a base plan to know which activities to plan. 

**Activity Object Structure:**
- discipline: (string) "Running", "Cycling", "Swimming", or "Rest".
- "description": (string) "Strengh", "Pace", "Endurance" or "Rest" 
- Rest has to have a Rest as a description .


`
