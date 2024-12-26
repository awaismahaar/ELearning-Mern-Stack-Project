"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
require('dotenv').config();
const http_1 = __importDefault(require("http"));
const socketioServer_1 = require("./socketioServer");
const server = http_1.default.createServer(app_1.app);
(0, socketioServer_1.initSocketIOServer)(server);
const PORT = process.env.PORT || 3000;
app_1.app.listen(PORT, () => console.log(`listening the server on ${PORT}`));
