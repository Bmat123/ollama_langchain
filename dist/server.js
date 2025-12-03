"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path")); // Import the 'path' module
const data_generator_1 = require("./data-generator");
const training_activity_1 = require("./training-activity");
const user_1 = require("./user");
const training_plan_1 = require("./training-plan");
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
                dayActivities.forEach(activityData => {
                    let newActivity;
                    // This is a simplified reconstruction. A real app might need more robust logic.
                    if (activityData.discipline === 'Running') {
                        newActivity = new training_activity_1.Running(new Date(activityData.date), activityData.description, activityData.plannedDuration, activityData.distance);
                    }
                    else if (activityData.discipline === 'Cycling') {
                        newActivity = new training_activity_1.Cycling(new Date(activityData.date), activityData.description, activityData.plannedDuration, activityData.distance);
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
