const { verifyToken }                  = require("../utils/jwt");
const { saveMessage, getConversationAndVerifyAccess } = require("../modules/chat/chat.service");

const initSocket = (io) => {

  // ── JWT Auth middleware for every socket connection ──────
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("Authentication token missing"));
    try {
      const decoded  = verifyToken(token);
      socket.user    = decoded;
      next();
    } catch {
      next(new Error("Invalid or expired token"));
    }
  });

  io.on("connection", (socket) => {
    const user = socket.user;
    console.log(`🟢 Socket connected: ${user.email} [${user.role}]`);

    // ── JOIN conversation room ───────────────────────────
    socket.on("join_conversation", async ({ conversationId }) => {
      try {
        await getConversationAndVerifyAccess(conversationId, user.userId, user.role);
        socket.join(conversationId);
        console.log(`👤 ${user.email} joined room: ${conversationId}`);
        socket.emit("joined", { conversationId, message: "Successfully joined conversation" });
      } catch (err) {
        socket.emit("error", { message: err.message });
      }
    });

    // ── SEND message ─────────────────────────────────────
    socket.on("send_message", async ({ conversationId, content }) => {
      try {
        if (!content?.trim()) {
          return socket.emit("error", { message: "Message cannot be empty" });
        }
        if (content.length > 5000) {
          return socket.emit("error", { message: "Message too long (max 5000 chars)" });
        }

        const savedMessage = await saveMessage(user.userId, conversationId, content.trim());

        // Emit decrypted message to everyone in room (including sender)
        io.to(conversationId).emit("new_message", savedMessage);

      } catch (err) {
        socket.emit("error", { message: err.message });
      }
    });

    // ── TYPING indicators ────────────────────────────────
    socket.on("typing", ({ conversationId }) => {
      socket.to(conversationId).emit("user_typing", {
        userId: user.userId,
        email:  user.email,
        role:   user.role,
      });
    });

    socket.on("stop_typing", ({ conversationId }) => {
      socket.to(conversationId).emit("user_stop_typing", { userId: user.userId });
    });

    // ── LEAVE room ───────────────────────────────────────
    socket.on("leave_conversation", ({ conversationId }) => {
      socket.leave(conversationId);
      console.log(`👤 ${user.email} left room: ${conversationId}`);
    });

    // ── DISCONNECT ───────────────────────────────────────
    socket.on("disconnect", () => {
      console.log(`🔴 Socket disconnected: ${user.email}`);
    });
  });
};

module.exports = { initSocket };
