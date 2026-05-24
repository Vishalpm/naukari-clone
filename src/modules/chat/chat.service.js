const Conversation     = require("../../models/Conversation");
const Message          = require("../../models/Message");
const Job              = require("../../models/Job");
const JobSeekerProfile = require("../../models/JobSeekerProfile");
const RecruiterProfile = require("../../models/RecruiterProfile");
const User             = require("../../models/User");
const { encrypt, decrypt } = require("../../utils/encryption");

// ── Helper — decrypt message safely ───────────────────────
const decryptMessage = (msg) => {
  try {
    const sender = msg.sender || {};
    return {
      id:             msg._id,
      conversationId: msg.conversation?._id || msg.conversation,
      sender: {
        id:    sender._id || sender,
        email: sender.email,
        role:  sender.role,
      },
      content:   decrypt(msg.encryptedContent, msg.iv),
      isRead:    msg.isRead,
      createdAt: msg.createdAt,
    };
  } catch {
    return null;
  }
};

// ── Helper — verify user belongs to conversation 
const getConversationAndVerifyAccess = async (conversationId, userId, role) => {
  const conv = await Conversation.findById(conversationId)
    .populate({ path: "seeker",    populate: { path: "user", select: "email role" } })
    .populate({ path: "recruiter", populate: { path: "user", select: "email role" } })
    .populate("job");

  if (!conv) throw new Error("Conversation not found");

  const isSeeker    = role === "job_seeker" && conv.seeker?.user?._id?.toString() === userId;
  const isRecruiter = role === "recruiter"  && conv.recruiter?.user?._id?.toString() === userId;

  if (!isSeeker && !isRecruiter) throw new Error("Unauthorized access to this conversation");

  return conv;
};

// ── Helper — find or create conversation 
const findOrCreateConversation = async (seeker, recruiter, job) => {
  let conversation = await Conversation.findOne({
    seeker:    seeker._id,
    recruiter: recruiter._id,
  });

  if (conversation) return { conversation, isNew: false };

  conversation = await Conversation.create({
    job:       job._id,
    seeker:    seeker._id,
    recruiter: recruiter._id,
  });

  return { conversation, isNew: true };
};

// ── PATH 1 — Seeker clicks message on job post ─────────────
const seekerStartsConversation = async (seekerUserId, jobId) => {
  const job = await Job.findById(jobId).populate("recruiter");
  if (!job) throw new Error("Job not found");
  if (job.status !== "active") throw new Error("This job is no longer active");

  const seeker = await JobSeekerProfile.findOne({ user: seekerUserId }).populate("user");
  if (!seeker) throw new Error("Seeker profile not found");

  return findOrCreateConversation(seeker, job.recruiter, job);
};

// ── PATH 2 — Recruiter clicks message on seeker profile ────
const recruiterStartsConversation = async (recruiterUserId, seekerProfileId, jobId) => {
  const recruiter = await RecruiterProfile.findOne({ user: recruiterUserId });
  if (!recruiter) throw new Error("Recruiter profile not found");

  const seeker = await JobSeekerProfile.findById(seekerProfileId).populate("user");
  if (!seeker) throw new Error("Seeker profile not found");

  let job;
  if (jobId) {
    job = await Job.findOne({ _id: jobId, recruiter: recruiter._id });
    if (!job) throw new Error("Job not found or does not belong to you");
  } else {
    job = await Job.findOne({ recruiter: recruiter._id, status: "active" }).sort({ createdAt: -1 });
    if (!job) throw new Error("You need at least one active job posting to start a conversation");
  }

  return findOrCreateConversation(seeker, recruiter, job);
};

// ── Chat Inbox ─────────────────────────────────────────────
const getMyConversations = async (userId, role) => {
  // Find all conversations for this user
  let conversations;

  if (role === "job_seeker") {
    const seeker = await JobSeekerProfile.findOne({ user: userId });
    if (!seeker) return [];
    conversations = await Conversation.find({ seeker: seeker._id })
      .populate({ path: "seeker",    populate: { path: "user", select: "email" } })
      .populate({ path: "recruiter", populate: { path: "user", select: "email" } })
      .populate("job", "title status")
      .sort({ createdAt: -1 });
  } else {
    const recruiter = await RecruiterProfile.findOne({ user: userId });
    if (!recruiter) return [];
    conversations = await Conversation.find({ recruiter: recruiter._id })
      .populate({ path: "seeker",    populate: { path: "user", select: "email" } })
      .populate({ path: "recruiter", populate: { path: "user", select: "email" } })
      .populate("job", "title status")
      .sort({ createdAt: -1 });
  }

  if (!conversations.length) return [];

  const convIds = conversations.map(c => c._id);

  // Get last message per conversation
  const lastMessages = await Message.aggregate([
    { $match: { conversation: { $in: convIds } } },
    { $sort:  { createdAt: -1 } },
    { $group: {
        _id:              "$conversation",
        encryptedContent: { $first: "$encryptedContent" },
        iv:               { $first: "$iv" },
        isRead:           { $first: "$isRead" },
        senderId:         { $first: "$sender" },
        createdAt:        { $first: "$createdAt" },
    }},
  ]);

  const lastMsgMap = {};
  lastMessages.forEach(m => { lastMsgMap[m._id.toString()] = m; });


  const unreadAgg = await Message.aggregate([
    {
      $match: {
        conversation: { $in: convIds },
        isRead:       false,
        sender:       { $ne: require("mongoose").Types.ObjectId.createFromHexString(userId) },
      },
    },
    { $group: { _id: "$conversation", count: { $sum: 1 } } },
  ]);

  const unreadMap = {};
  unreadAgg.forEach(u => { unreadMap[u._id.toString()] = u.count; });

  return conversations.map(conv => {
    const cid    = conv._id.toString();
    const lm     = lastMsgMap[cid] || null;
    const unread = unreadMap[cid]   || 0;

    let otherPartyName = "";
    if (role === "job_seeker") {
      otherPartyName = [conv.recruiter?.firstName, conv.recruiter?.lastName]
        .filter(Boolean).join(" ") || conv.recruiter?.companyName || "Recruiter";
    } else {
      otherPartyName = [conv.seeker?.firstName, conv.seeker?.lastName]
        .filter(Boolean).join(" ") || conv.seeker?.user?.email || "Job Seeker";
    }

    let lastMessage = null;
    if (lm) {
      try {
        lastMessage = {
          content:   decrypt(lm.encryptedContent, lm.iv),
          timestamp: lm.createdAt,
          isRead:    lm.isRead,
          sentByMe:  lm.senderId?.toString() === userId,
        };
      } catch { lastMessage = null; }
    }

    return {
      conversationId: conv._id,
      job: { id: conv.job?._id, title: conv.job?.title },
      otherParty: {
        name:        otherPartyName,
        companyName: role === "job_seeker" ? conv.recruiter?.companyName : undefined,
        email:       role === "recruiter"  ? conv.seeker?.user?.email   : undefined,
        profileId:   role === "job_seeker" ? conv.recruiter?._id        : conv.seeker?._id,
        designation: role === "job_seeker"  ? conv.recruiter?.designation : undefined
      },
      lastMessage,
      unreadCount: unread,
      createdAt:   conv.createdAt,
    };
  }).sort((a, b) => {
    const at = a.lastMessage?.timestamp || a.createdAt;
    const bt = b.lastMessage?.timestamp || b.createdAt;
    return new Date(bt) - new Date(at);
  });
};

// ── Get messages in a conversation ────────────────────────
const getMessages = async (userId, role, conversationId, page = 1, limit = 30) => {
  const conv = await getConversationAndVerifyAccess(conversationId, userId, role);

  const total    = await Message.countDocuments({ conversation: conv._id });
  const messages = await Message.find({ conversation: conv._id })
    .populate("sender", "email role")
    .sort({ createdAt: 1 })
    .skip((page - 1) * limit)
    .limit(limit);

  // Mark unread messages (sent by other party) as read
  const unreadIds = messages
    .filter(m => !m.isRead && m.sender?._id?.toString() !== userId)
    .map(m => m._id);

  if (unreadIds.length) {
    await Message.updateMany({ _id: { $in: unreadIds } }, { isRead: true });
  }

  return {
    messages: messages.map(decryptMessage).filter(Boolean),
    pagination: {
      total,
      page,
      limit,
      totalPages:  Math.ceil(total / limit),
      hasNextPage: page < Math.ceil(total / limit),
    },
  };
};

// ── Save message (called by Socket.IO) ────────────────────
const saveMessage = async (senderId, conversationId, plainContent) => {
  const sender = await User.findById(senderId);
  if (!sender) throw new Error("Sender not found");

  const conv = await getConversationAndVerifyAccess(conversationId, senderId, sender.role);

  const { encryptedContent, iv } = encrypt(plainContent);

  const message = await Message.create({
    conversation:     conv._id,
    sender:           sender._id,
    encryptedContent,
    iv,
    isRead: false,
  });

  return {
    id:             message._id,
    conversationId: conv._id,
    sender: {
      id:    sender._id,
      email: sender.email,
      role:  sender.role,
    },
    content:   plainContent,   // plain text only for socket emit — never stored raw
    isRead:    false,
    createdAt: message.createdAt,
  };
};

// ── Unread count ───────────────────────────────────────────
const getUnreadCount = async (userId, role) => {
  let convIds = [];

  if (role === "job_seeker") {
    const seeker = await JobSeekerProfile.findOne({ user: userId });
    if (!seeker) return { unreadCount: 0 };
    const convs = await Conversation.find({ seeker: seeker._id }, "_id");
    convIds     = convs.map(c => c._id);
  } else {
    const recruiter = await RecruiterProfile.findOne({ user: userId });
    if (!recruiter) return { unreadCount: 0 };
    const convs = await Conversation.find({ recruiter: recruiter._id }, "_id");
    convIds     = convs.map(c => c._id);
  }

  if (!convIds.length) return { unreadCount: 0 };

  const count = await Message.countDocuments({
    conversation: { $in: convIds },
    isRead:       false,
    sender:       { $ne: require("mongoose").Types.ObjectId.createFromHexString(userId) },
  });

  return { unreadCount: count };
};

module.exports = {
  seekerStartsConversation,
  recruiterStartsConversation,
  getConversationAndVerifyAccess,
  getMyConversations,
  getMessages,
  saveMessage,
  getUnreadCount,
};
