const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Middleware
app.use(express.json());
app.use(express.static("public"));

// ==========================================
// 🚀 1. DATABASE CONNECTION
// ==========================================
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Database Connected Successfully!"))
  .catch(err => console.log("❌ DB Connection Error:", err));

// ==========================================
// 🚀 2. DATABASE MODELS (Schema)
// ==========================================
// Movie Model
const movieSchema = new mongoose.Schema({
    title: String,
    poster: String,
    link: String,
    category: String,
    language: String
});
const Movie = mongoose.model("Movie", movieSchema);

// Banner Model
const bannerSchema = new mongoose.Schema({
    title: String,
    desc: String,
    image: String,
    link: String
});
const Banner = mongoose.model("Banner", bannerSchema);

// ==========================================
// 🚀 3. API ROUTES (Admin Panel ke liye)
// ==========================================

// Movies mangane ka rasta
app.get("/api/movies", async (req, res) => {
    try {
        const movies = await Movie.find();
        res.json(movies);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch movies" });
    }
});

// Nayi movie add karne ka rasta
app.post("/api/movies", async (req, res) => {
    try {
        const newMovie = new Movie(req.body);
        await newMovie.save();
        res.status(201).json({ message: "Movie Added Successfully" });
    } catch (err) {
        res.status(500).json({ error: "Failed to add movie" });
    }
});
// ==========================================
// 🚀 DELETE ROUTES (Admin Panel ke liye)
// ==========================================

// Movie Delete karne ka rasta
app.delete("/api/movies/:id", async (req, res) => {
    try {
        await Movie.findByIdAndDelete(req.params.id);
        res.json({ message: "Movie Deleted Successfully" });
    } catch (err) {
        res.status(500).json({ error: "Error deleting movie" });
    }
});

// Banner Delete karne ka rasta
app.delete("/api/banners/:id", async (req, res) => {
    try {
        await Banner.findByIdAndDelete(req.params.id);
        res.json({ message: "Banner Deleted Successfully" });
    } catch (err) {
        res.status(500).json({ error: "Error deleting banner" });
    }
});

// Banners mangane ka rasta
app.get("/api/banners", async (req, res) => {
    try {
        const banners = await Banner.find();
        res.json(banners);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch banners" });
    }
});

// Naya banner add karne ka rasta
app.post("/api/banners", async (req, res) => {
    try {
        const newBanner = new Banner(req.body);
        await newBanner.save();
        res.status(201).json({ message: "Banner Added Successfully" });
    } catch (err) {
        res.status(500).json({ error: "Failed to add banner" });
    }
});

// ==========================================
// 🚀 4. WATCH PARTY & VIDEO CALL LOGIC (SOCKET.IO)
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

// ==========================================
// 🚀 5. START SERVER
// ==========================================
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`CINEMA Server running on port ${PORT}`));