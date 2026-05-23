require("dotenv").config();

const express   = require("express");
const cors      = require("cors");
const http      = require("http");
const { Server }  = require("socket.io");
const path      = require("path");

const connectDB   = require("./config/database");
const authRoutes  = require("./modules/auth/auth.routes");
const profileRoutes = require("./modules/user/profile.routes");
const jobRoutes   = require("./modules/jobs/job.routes");
const chatRoutes  = require("./modules/chat/chat.routes");
const { initSocket } = require("./socket/socket.handler");

const app        = express();
const httpServer = http.createServer(app);

// ── Socket.IO ──────────────────────────────────────────────
const io = new Server(httpServer, {
  cors: {
    origin: "*",                  
    methods: ["GET", "POST"],
  },
});

// ── Middleware ─────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

// ── Routes ─────────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "Naukri Clone API running (MongoDB)" });
});

app.use("/api/auth",    authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/jobs",    jobRoutes);
app.use("/api/chat",    chatRoutes);


app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found` });
});

// ── Global error handler ───────────────────────────────────
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ success: false, message: "Internal server error" });
});

// ── Socket.IO init ─────────────────────────────────────────
initSocket(io);

// ── Connect DB + Start server ──────────────────────────────
const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  httpServer.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
    console.log(`🔌 Socket.IO ready`);
    console.log(`📦 Database: MongoDB`);
  });
});

module.exports = { io };
