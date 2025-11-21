import express, { Request, Response } from "express";
import cors from "cors";
import path from "path"; // Import the 'path' module
import { generateJsonData, TrainingPlan } from "./data-generator"; // This path is correct as both files are in src

const app = express();
app.use(express.json()); // Enable JSON body parsing

const port = 3000;

app.use(cors()); // Enable CORS for local development

app.use(express.static(path.join(__dirname, "../public")));

app.get("/data", (req: Request, res: Response) => {
  const data = generateJsonData();

  res.json(data);
});

app.post("/save/:filename", (req: Request, res: Response) => {
  try {
    const filename = req.params.filename;
    // For this example, we save the currently generated default plan
    // In a real app, you'd get the plan data from `req.body`
    const planToSave = TrainingPlan.load('default'); // Or create from req.body
    planToSave.save(filename);
    res.send("Training plan saved successfully!");
  } catch (error) {
    console.error("Error saving training plan:", error);
    res.status(500).json({ error: "Failed to save training plan." });
  }
});

app.get("/load/:filename", (req: Request, res: Response) => {
  // Use the static load method on the class
  const filename = req.params.filename;
  const loadedPlan = TrainingPlan.load(filename);

  if (loadedPlan) {
    res.json({ message: "Training plan loaded successfully!", entriesByDate: loadedPlan.getEntriesByDate() });
  } else {
    res.status(500).json({ error: "Could not load training plan." });
  }
});




app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
