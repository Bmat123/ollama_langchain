import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path'; // Import the 'path' module

const app = express();
const port = 3000;

app.use(cors()); // Enable CORS for local development

// Serve static files from the 'public' directory
// This path works for both 'npm run dev' and 'npm start' from the dist folder
app.use(express.static(path.join(__dirname, '../public')));

// This is where you will call your Ollama agent
// and get the results. For now, we'll keep it as a sample.
// const myOllamaResult = await getOllamaData("some query");
const data = { "message": "This is where your Ollama JSON result will go." };

app.get('/data', (req: Request, res: Response) => {
  res.json(data);
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
