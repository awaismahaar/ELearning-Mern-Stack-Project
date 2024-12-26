import { app } from "./app";
require('dotenv').config();
import http from "http";
import { initSocketIOServer } from "./socketioServer";

const server = http.createServer(app);
initSocketIOServer(server);

const PORT = process.env.PORT || 3000;
app.listen(PORT , ()=> console.log(`listening the server on ${PORT}`))