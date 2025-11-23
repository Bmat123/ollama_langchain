"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path")); // Import the 'path' module
const data_generator_1 = require("./data-generator");
const training_plan_1 = require("./training-plan");
const app = (0, express_1.default)();
app.use(express_1.default.json()); // Enable JSON body parsing
const port = 3000;
app.use((0, cors_1.default)()); // Enable CORS for local development
app.use(express_1.default.static(path_1.default.join(__dirname, "../public")));
app.get("/data", (req, res) => {
    const data = (0, data_generator_1.generateJsonData)();
    res.json(data);
});
app.post("/save/:filename", (req, res) => {
    try {
        const filename = req.params.filename;
        // For this example, we save the currently generated default plan
        // In a real app, you'd get the plan data from `req.body`
        const planToSave = training_plan_1.TrainingPlan.load('default'); // Or create from req.body
        planToSave.save(filename);
        res.send("Training plan saved successfully!");
    }
    catch (error) {
        console.error("Error saving training plan:", error);
        res.status(500).json({ error: "Failed to save training plan." });
    }
});
app.get("/load/:filename", (req, res) => {
    // Use the static load method on the class
    const filename = req.params.filename;
    const loadedPlan = training_plan_1.TrainingPlan.load(filename);
    if (loadedPlan) {
        res.json({ message: "Training plan loaded successfully!", entriesByDate: loadedPlan.getEntriesByDate() });
    }
    else {
        res.status(500).json({ error: "Could not load training plan." });
    }
});
app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});
