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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path")); // Import the 'path' module
const agent_1 = require("./agent");
const data_generator_1 = require("./data-generator");
const training_activity_1 = require("./training-activity");
const user_1 = require("./user");
const training_plan_1 = require("./training-plan");
const fs = __importStar(require("fs"));
const app = (0, express_1.default)();
app.use(express_1.default.json()); // Enable JSON body parsing
const port = 3000;
app.use((0, cors_1.default)()); // Enable CORS for local development
app.use(express_1.default.static(path_1.default.join(__dirname, '../public')));
app.get('/', (req, res) => {
    // Serve the login page as the root
    res.sendFile(path_1.default.join(__dirname, '../public/login.html'));
});
app.get("/data", (req, res) => {
    const data = (0, data_generator_1.generateJsonData)();
    res.json(data);
});
app.post("/user/:username/plan/:planname", (req, res) => {
    try {
        const { username, planname } = req.params;
        const entriesByDate = req.body.entriesByDate;
        if (!entriesByDate) {
            return res.status(400).json({ error: "Missing entriesByDate in request body." });
        }
        const planToSave = new training_plan_1.TrainingPlan();
        // Reconstruct the TrainingPlan object from the frontend data
        Object.values(entriesByDate).forEach((dayActivities) => {
            // Type guard to ensure we are working with an array
            if (Array.isArray(dayActivities)) {
                dayActivities.forEach((activityData) => {
                    let newActivity = null;
                    // This is a simplified reconstruction. A real app might need more robust logic.
                    if (activityData.discipline === 'Running') {
                        newActivity = new training_activity_1.Running(new Date(activityData.date), activityData.description, activityData.plannedDuration, activityData.distance);
                    }
                    else if (activityData.discipline === 'Cycling') {
                        newActivity = new training_activity_1.Cycling(new Date(activityData.date), activityData.description, activityData.plannedDuration, activityData.distance);
                    }
                    else if (activityData.discipline === 'Rest') {
                        newActivity = new training_activity_1.Rest(new Date(activityData.date), activityData.description);
                    }
                    else {
                        newActivity = new training_activity_1.Swimming(new Date(activityData.date), activityData.description, activityData.plannedDuration, activityData.distance);
                    }
                    if (activityData.done)
                        newActivity.markAsDone();
                    planToSave.addActivity(newActivity);
                });
            }
        });
        planToSave.save(username, planname);
        res.send("Training plan saved successfully!");
    }
    catch (error) {
        console.error("Error saving training plan:", error);
        res.status(500).json({ error: "Failed to save training plan." });
    }
});
app.post("/user/:username/plans/generate", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { username } = req.params;
        const { planName, userPrompt } = req.body;
        if (!planName || !userPrompt) {
            return res.status(400).json({ error: "planName and userPrompt are required." });
        }
        // Trigger the agent logic but don't wait for it to finish
        (0, agent_1.runAgentForUser)(username, planName, userPrompt);
        res.status(202).json({ message: `New plan '${planName}' is being generated. It will be available shortly.` });
    }
    catch (error) {
        console.error("Error triggering agent:", error);
        res.status(500).json({ error: "Failed to start plan generation." });
    }
}));
app.post("/user/:username", (req, res) => {
    try {
        const username = req.params.username;
        const data = req.body;
        const user = new user_1.User(username, data.age, data.height, data.weight, data.run1hResult, data.cyclingFtp, data.swim100mTime);
        user.save();
        res.json({ message: `User profile for ${username} saved successfully!` });
    }
    catch (error) {
        console.error("Error saving user profile:", error);
        res.status(500).json({ error: "Failed to save user profile." });
    }
});
app.get("/user/:username", (req, res) => {
    const username = req.params.username;
    const user = user_1.User.load(username);
    if (user) {
        res.json(user);
    }
    else {
        res.status(404).json({ error: `User '${username}' not found.` });
    }
});
app.get("/user/:username/plans", (req, res) => {
    try {
        const { username } = req.params;
        const plansDir = path_1.default.join(__dirname, '../data/users', username, 'plans');
        if (!fs.existsSync(plansDir)) {
            // If the directory doesn't exist, the user has no saved plans.
            return res.json({ plans: [] });
        }
        const planFiles = fs.readdirSync(plansDir);
        const planNames = planFiles
            .filter(file => file.endsWith('.json'))
            .map(file => file.replace('.json', ''));
        res.json({ plans: planNames });
    }
    catch (error) {
        console.error(`Error listing plans for user ${req.params.username}:`, error);
        res.status(500).json({ error: "Failed to list training plans." });
    }
});
app.get("/user/:username/plan/:planname", (req, res) => {
    // Use the static load method on the class
    const { username, planname } = req.params;
    const loadedPlan = training_plan_1.TrainingPlan.load(username, planname);
    // The load method returns an empty plan if not found, which is fine.
    res.json({ message: "Training plan loaded successfully!", entriesByDate: loadedPlan.getEntriesByDate() });
});
app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});
