const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.json());
app.use(express.static("public"));

// ==========================================
// 🚀 DATABASE CONNECTION
// ==========================================
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Database Connected Successfully!"))
  .catch(err => console.log("❌ DB Connection Error:", err));

// (Aapke purane /api/movies wale POST/GET routes yahan rahenge)

// ==========================================
// 🚀 WATCH PARTY & VIDEO CALL LOGIC (SOCKET.IO)
// ==========================================
io.on("connection", (socket) => {
  socket.on("join-room", (roomId, userId) => {
    socket.join(roomId);
    socket.to(roomId).emit("user-connected", userId);

    socket.on("play-video", () => { socket.to(roomId).emit("play-video"); });
    socket.on("pause-video", () => { socket.to(roomId).emit("pause-video"); });
    socket.on("seek-video", (time) => { socket.to(roomId).emit("seek-video", time); });
    
    // Floating Emojis Sync
    socket.on("send-emoji", (emoji) => { socket.to(roomId).emit("receive-emoji", emoji); });
    
    socket.on("send-message", (msg) => { socket.to(roomId).emit("receive-message", msg); });

    socket.on("disconnect", () => {
      socket.to(roomId).emit("user-disconnected", userId);
    });
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`CINEMA Server running on port ${PORT}`));