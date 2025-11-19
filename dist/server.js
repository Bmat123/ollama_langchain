"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path")); // Import the 'path' module
const app = (0, express_1.default)();
const port = 3000;
app.use((0, cors_1.default)()); // Enable CORS for local development
// Serve static files from the 'public' directory
// This path works for both 'npm run dev' and 'npm start' from the dist folder
app.use(express_1.default.static(path_1.default.join(__dirname, '../public')));
// This is where you will call your Ollama agent
// and get the results. For now, we'll keep it as a sample.
// const myOllamaResult = await getOllamaData("some query");
const data = { "message": "This is where your Ollama JSON result will go." };
app.get('/data', (req, res) => {
    res.json(data);
});
app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});
