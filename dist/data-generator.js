"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrainingPlan = void 0;
exports.generateJsonData = generateJsonData;
/**
 * @fileoverview This file contains the data generation logic for the Ollama response.
 */
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const training_activity_1 = require("./training-activity");
class TrainingPlan {
    constructor() {
        this.activities = [];
    }
    addActivity(activity) {
        this.activities.push(activity);
        this.activities.sort((a, b) => a.date.getTime() - b.date.getTime());
    }
    /**
     * Saves the current training plan to a JSON file.
     */
    save(filename) {
        const dir = 'data';
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir);
        }
        const dataFilePath = path.join(dir, `${filename}.json`);
        // Serialize activities to a plain JSON object, including distance for relevant types
        const activitiesToSave = this.activities.map(activity => {
            const plainActivity = {
                date: activity.date.toISOString(),
                description: activity.description,
                discipline: activity.discipline,
                plannedDuration: activity.plannedDuration,
                done: activity.isDone(),
            };
            if (activity instanceof training_activity_1.Running || activity instanceof training_activity_1.Cycling || activity instanceof training_activity_1.Swimming) {
                plainActivity.distance = activity.distance;
            }
            return plainActivity;
        });
        const json = JSON.stringify(activitiesToSave, null, 2); // Pretty-print JSON
        fs.writeFileSync(dataFilePath, json);
    }
    /**
     * Loads the training plan from a JSON file.
     * @returns The loaded training plan, or an empty TrainingPlan if the file does not exist or if there is an error.
     */
    static load(filename) {
        const plan = new TrainingPlan();
        const dataFilePath = path.join('data', `${filename}.json`);
        try {
            if (!fs.existsSync(dataFilePath)) {
                return plan; // Return an empty plan if the file doesn't exist
            }
            const json = fs.readFileSync(dataFilePath, 'utf-8');
            const activities = JSON.parse(json);
            activities.forEach(activity => {
                let newActivity = null;
                const activityDate = new Date(activity.date);
                // Re-create the correct class instance based on the discipline
                switch (activity.discipline) {
                    case "Running":
                        newActivity = new training_activity_1.Running(activityDate, activity.description, activity.plannedDuration, activity.distance);
                        break;
                    case "Cycling":
                        newActivity = new training_activity_1.Cycling(activityDate, activity.description, activity.plannedDuration, activity.distance);
                        break;
                    case "Swimming":
                        newActivity = new training_activity_1.Swimming(activityDate, activity.description, activity.plannedDuration, activity.distance);
                        break;
                }
                if (newActivity) {
                    if (activity.done) {
                        newActivity.markAsDone();
                    }
                    plan.addActivity(newActivity);
                }
            });
        }
        catch (error) {
            console.error("Error loading training plan:", error);
            // In case of any error (e.g., corrupt file), return an empty plan
        }
        return plan;
    }
    getEntriesByDate() {
        const entries = {};
        for (const activity of this.activities) {
            const dateKey = activity.date.toISOString().split("T")[0]; // Format date as 'YYYY-MM-DD'
            if (!entries[dateKey]) {
                entries[dateKey] = [];
            }
            // Push a detailed object instead of just the description string
            entries[dateKey].push({
                description: activity.description,
                discipline: activity.discipline,
                done: activity.isDone(),
                plannedDuration: activity.plannedDuration, // Add plannedDuration here
            });
        }
        return entries;
    }
}
exports.TrainingPlan = TrainingPlan;
function generateJsonData() {
    // For now, we'll return a static object.
    // In a real application, this is where you'd fetch data from Ollama.
    const plan = new TrainingPlan();
    // Add some sample activities to the plan
    const runningActivity = new training_activity_1.Running(new Date("2025-11-19"), "Morning Run", 30, 5); // 30 minutes, 5km
    runningActivity.markAsDone(); // Mark this one as done for demonstration
    plan.addActivity(runningActivity);
    plan.addActivity(new training_activity_1.Cycling(new Date("2025-11-22"), "Morning Cycle", 60, 25)); // 60 minutes, 25km
    plan.addActivity(new training_activity_1.Swimming(new Date("2025-11-31"), "Morning Swim", 45, 1.5)); // 45 minutes, 1.5km
    return {
        message: "This JSON was generated by a dedicated function!",
        timestamp: new Date(),
        model: "llama2",
        entriesByDate: plan.getEntriesByDate(),
    };
}
