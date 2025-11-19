import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path'; // Import the 'path' module
import { generateJsonData } from './data-generator';

const app = express();
const port = 3000;

app.use(cors()); // Enable CORS for local development

// Serve static files from the 'public' directory
// This path works for both 'npm run dev' and 'npm start' from the dist folder
app.use(express.static(path.join(__dirname, '../public')));

app.get('/data', (req: Request, res: Response) => {
  const data = generateJsonData();
  res.json(data);
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
