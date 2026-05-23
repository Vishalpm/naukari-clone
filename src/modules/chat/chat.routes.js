const express = require("express");
const router  = express.Router();
const ctrl    = require("./chat.controller");
const { authenticate, authorizeRoles } = require("../../middlewares/auth.middleware");

router.use(authenticate);

// Initiation
router.post("/start/job/:jobId",               authorizeRoles("job_seeker"), ctrl.seekerStartsConversation);
router.post("/start/seeker/:seekerProfileId",  authorizeRoles("recruiter"),  ctrl.recruiterStartsConversation);

// Inbox + messages — both roles
router.get("/unread",                     ctrl.getUnreadCount);
router.get("/conversations",              ctrl.getMyConversations);
router.get("/:conversationId/messages",   ctrl.getMessages);

module.exports = router;
