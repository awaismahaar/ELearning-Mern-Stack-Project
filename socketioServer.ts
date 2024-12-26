import {Server as SocketIOServer} from "socket.io"
import http from "http";

export const initSocketIOServer = (server: http.Server) => {
    const io = new SocketIOServer(server);
    io.on("connection", (socket: any) => {
    console.log("New client connected");
    // listen for notification event from the frontend 
    socket.on("notification" , (data:any)=>{
        io.emit("newNotification", data);
    })
    socket.on("disconnect", () => {
        console.log("Client disconnected");
    });
});
}
