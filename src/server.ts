import express, { Request, Response } from "express";
import cors from "cors";
import path from "path"; // Import the 'path' module
import { generateJsonData } from "./data-generator";import { Interval } from "./interval";
import { Running, Cycling, Swimming } from "./training-activity";
import { User } from "./user";
import { TrainingPlan } from "./training-plan";

const app = express();
app.use(express.json()); // Enable JSON body parsing

const port = 3000;

app.use(cors()); // Enable CORS for local development

app.use(express.static(path.join(__dirname, "../public")));

app.get("/data", (req: Request, res: Response) => {
  const data = generateJsonData();

  res.json(data);
});

app.post("/user/:username/plan/:planname", (req: Request, res: Response) => {
  try {
    const { username, planname } = req.params;    const entriesByDate = req.body.entriesByDate;

    if (!entriesByDate) {
      return res.status(400).json({ error: "Missing entriesByDate in request body." });
    }

    const planToSave = new TrainingPlan();

    // Reconstruct the TrainingPlan object from the frontend data
    Object.values(entriesByDate).forEach((dayActivities) => {
      // Type guard to ensure we are working with an array
      if (Array.isArray(dayActivities)) {
        dayActivities.forEach(activityData => {
          let newActivity;
          // This is a simplified reconstruction. A real app might need more robust logic.
          if (activityData.discipline === 'Running') {
            newActivity = new Running(new Date(activityData.date), activityData.description, activityData.plannedDuration, activityData.distance);
          } else if (activityData.discipline === 'Cycling') {
            newActivity = new Cycling(new Date(activityData.date), activityData.description, activityData.plannedDuration, activityData.distance);
          } else {
            newActivity = new Swimming(new Date(activityData.date), activityData.description, activityData.plannedDuration, activityData.distance);
          }
          if (activityData.done) newActivity.markAsDone();
          planToSave.addActivity(newActivity);
        });
        }
    });

    planToSave.save(username, planname);    
    res.send("Training plan saved successfully!");
  } catch (error) {
    console.error("Error saving training plan:", error);
    res.status(500).json({ error: "Failed to save training plan." });
  }
});

app.post("/user/:username", (req: Request, res: Response) => {
  try {
    const username = req.params.username;
    const data = req.body;
    const user = new User(
      username, data.age, data.height, data.weight,
      data.run1hResult, data.cyclingFtp, data.swim100mTime
    );
    user.save();
    res.json({ message: `User profile for ${username} saved successfully!` });
  } catch (error) {
    console.error("Error saving user profile:", error);
    res.status(500).json({ error: "Failed to save user profile." });
  }
});

app.get("/user/:username", (req: Request, res: Response) => {
  const username = req.params.username;
  const user = User.load(username);
  if (user) {
    res.json(user);
  } else {
    res.status(404).json({ error: `User '${username}' not found.` });
  }
});
app.get("/user/:username/plan/:planname", (req: Request, res: Response) => {
  // Use the static load method on the class
  const { username, planname } = req.params;
  const loadedPlan = TrainingPlan.load(username, planname);

  // The load method returns an empty plan if not found, which is fine.
  res.json({ message: "Training plan loaded successfully!", entriesByDate: loadedPlan.getEntriesByDate() });
});




app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
