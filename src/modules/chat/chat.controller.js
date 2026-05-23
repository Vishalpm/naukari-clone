const service = require("./chat.service");

// POST /api/chat/start/job/:jobId  — seeker initiates
const seekerStartsConversation = async (req, res) => {
  try {
    const data = await service.seekerStartsConversation(req.user.userId, req.params.jobId);
    res.status(data.isNew ? 201 : 200).json({
      success: true,
      message: data.isNew ? "Conversation started" : "Conversation already exists",
      data: { conversationId: data.conversation._id, isNew: data.isNew },
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// POST /api/chat/start/seeker/:seekerProfileId  — recruiter initiates
const recruiterStartsConversation = async (req, res) => {
  try {
    const { jobId } = req.body;
    const data = await service.recruiterStartsConversation(
      req.user.userId,
      req.params.seekerProfileId,
      jobId
    );
    res.status(data.isNew ? 201 : 200).json({
      success: true,
      message: data.isNew ? "Conversation started" : "Conversation already exists",
      data: { conversationId: data.conversation._id, isNew: data.isNew },
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// GET /api/chat/conversations
const getMyConversations = async (req, res) => {
  try {
    const data = await service.getMyConversations(req.user.userId, req.user.role);
    res.json({ success: true, data });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// GET /api/chat/:conversationId/messages
const getMessages = async (req, res) => {
  try {
    const page  = Number(req.query.page)  || 1;
    const limit = Number(req.query.limit) || 30;
    const data  = await service.getMessages(
      req.user.userId, req.user.role, req.params.conversationId, page, limit
    );
    res.json({ success: true, data });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// GET /api/chat/unread
const getUnreadCount = async (req, res) => {
  try {
    const data = await service.getUnreadCount(req.user.userId, req.user.role);
    res.json({ success: true, data });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

module.exports = {
  seekerStartsConversation,
  recruiterStartsConversation,
  getMyConversations,
  getMessages,
  getUnreadCount,
};
