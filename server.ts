import express, { Request, Response } from "express";
import cors from "cors";
import path from "path"; // Import the 'path' module
import { generateJsonData } from "./data-generator";

const app = express();
const port = 3000;

app.use(cors()); // Enable CORS for local development

app.use(express.static(path.join(__dirname, "../public")));

app.get("/data", (req: Request, res: Response) => {
  const data = generateJsonData();
  res.json(data);
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
