"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path")); // Import the 'path' module
const data_generator_1 = require("./data-generator");
const app = (0, express_1.default)();
const port = 3000;
app.use((0, cors_1.default)()); // Enable CORS for local development
app.use(express_1.default.static(path_1.default.join(__dirname, "../public")));
app.get("/data", (req, res) => {
    const data = (0, data_generator_1.generateJsonData)();
    res.json(data);
});
app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});
