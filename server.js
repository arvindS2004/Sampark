const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

io.on("connection", (socket) => {
    console.log("A user connected: " + socket.id);

    socket.on("offer", (data) => {
        socket.broadcast.emit("offer", data);
    });

    socket.on("answer", (data) => {
        socket.broadcast.emit("answer", data);
    });

    socket.on("candidate", (data) => {
        socket.broadcast.emit("candidate", data);
    });

    socket.on("message", (data) => {
        socket.broadcast.emit("message", data);
    });

    socket.on("disconnect", () => {
        console.log("User disconnected: " + socket.id);
    });
});

// Start server
const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
