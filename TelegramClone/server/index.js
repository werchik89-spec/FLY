const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

const UPLOADS_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
app.use('/uploads', express.static(UPLOADS_DIR));

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
  maxHttpBufferSize: 50e6,
});

// In-memory storage
const users = new Map();
const messages = new Map();
const friendRequests = new Map();
const friends = new Map();
const onlineUsers = new Map();
const groups = new Map();
const pinnedMessages = new Map();

function generateId() {
  return crypto.randomUUID();
}

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function emitToChat(chatId, event, data) {
  const group = groups.get(chatId);
  if (group) {
    group.members.forEach(memberId => {
      io.to(`user:${memberId}`).emit(event, data);
    });
  } else {
    const [id1, id2] = chatId.split(':');
    io.to(`user:${id1}`).to(`user:${id2}`).emit(event, data);
  }
}

// REST API
app.post('/api/register', (req, res) => {
  const { username, password, displayName } = req.body;
  if (!username || !password || !displayName) {
    return res.status(400).json({ error: 'Missing fields' });
  }
  const existing = [...users.values()].find(u => u.username === username);
  if (existing) {
    return res.status(400).json({ error: 'Username already taken' });
  }
  const user = {
    id: generateId(),
    username,
    password: hashPassword(password),
    displayName,
    avatar: null,
    bio: '',
    createdAt: new Date().toISOString(),
    lastSeen: new Date().toISOString(),
  };
  users.set(user.id, user);
  friends.set(user.id, []);
  friendRequests.set(user.id, []);
  const { password: _, ...safeUser } = user;
  res.json({ user: safeUser });
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const user = [...users.values()].find(
    u => u.username === username && u.password === hashPassword(password)
  );
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  user.lastSeen = new Date().toISOString();
  const { password: _, ...safeUser } = user;
  res.json({ user: safeUser });
});

app.get('/api/users/search', (req, res) => {
  const { q, userId } = req.query;
  if (!q) return res.json([]);
  const results = [...users.values()]
    .filter(u => u.id !== userId && (
      u.username.toLowerCase().includes(q.toLowerCase()) ||
      u.displayName.toLowerCase().includes(q.toLowerCase())
    ))
    .map(({ password, ...u }) => ({
      ...u,
      isOnline: onlineUsers.has(u.id),
      isFriend: (friends.get(userId) || []).includes(u.id),
    }));
  res.json(results);
});

// File upload endpoint
app.post('/api/upload', (req, res) => {
  const { fileName, fileData, fileType } = req.body;
  if (!fileName || !fileData) {
    return res.status(400).json({ error: 'Missing file data' });
  }
  const fileId = generateId();
  const ext = path.extname(fileName) || '';
  const savedName = fileId + ext;
  const buffer = Buffer.from(fileData, 'base64');
  fs.writeFileSync(path.join(UPLOADS_DIR, savedName), buffer);

  const fileUrl = `/uploads/${savedName}`;
  res.json({
    id: fileId,
    name: fileName,
    type: fileType || 'application/octet-stream',
    size: buffer.length,
    url: fileUrl,
  });
});

// Socket.IO
io.on('connection', (socket) => {
  let currentUserId = null;

  socket.on('user:online', (userId) => {
    currentUserId = userId;
    onlineUsers.set(userId, socket.id);
    socket.join(`user:${userId}`);
    io.emit('user:status', { userId, isOnline: true });
  });

  socket.on('friend:request', ({ fromId, toId }) => {
    const requests = friendRequests.get(toId) || [];
    if (!requests.find(r => r.fromId === fromId)) {
      const request = { id: generateId(), fromId, toId, createdAt: new Date().toISOString() };
      requests.push(request);
      friendRequests.set(toId, requests);
      const fromUser = users.get(fromId);
      if (fromUser) {
        const { password, ...safeUser } = fromUser;
        io.to(`user:${toId}`).emit('friend:request:received', { ...request, fromUser: safeUser });
      }
    }
  });

  socket.on('friend:accept', ({ requestId, userId }) => {
    const requests = friendRequests.get(userId) || [];
    const request = requests.find(r => r.id === requestId);
    if (request) {
      const userFriends = friends.get(userId) || [];
      const otherFriends = friends.get(request.fromId) || [];
      if (!userFriends.includes(request.fromId)) userFriends.push(request.fromId);
      if (!otherFriends.includes(userId)) otherFriends.push(userId);
      friends.set(userId, userFriends);
      friends.set(request.fromId, otherFriends);
      friendRequests.set(userId, requests.filter(r => r.id !== requestId));

      const user = users.get(userId);
      const otherUser = users.get(request.fromId);
      if (user && otherUser) {
        const { password: _, ...safeUser } = user;
        const { password: __, ...safeOther } = otherUser;
        const chatId = [userId, request.fromId].sort().join(':');
        io.to(`user:${userId}`).emit('friend:accepted', { friend: safeOther, chatId });
        io.to(`user:${request.fromId}`).emit('friend:accepted', { friend: safeUser, chatId });
      }
    }
  });

  socket.on('friend:reject', ({ requestId, userId }) => {
    const requests = friendRequests.get(userId) || [];
    friendRequests.set(userId, requests.filter(r => r.id !== requestId));
  });

  socket.on('friend:list', (userId, callback) => {
    const friendIds = friends.get(userId) || [];
    const friendList = friendIds.map(fId => {
      const u = users.get(fId);
      if (!u) return null;
      const { password, ...safeUser } = u;
      return { ...safeUser, isOnline: onlineUsers.has(fId) };
    }).filter(Boolean);
    callback(friendList);
  });

  socket.on('friend:requests', (userId, callback) => {
    const requests = friendRequests.get(userId) || [];
    const enriched = requests.map(r => {
      const fromUser = users.get(r.fromId);
      if (!fromUser) return null;
      const { password, ...safeUser } = fromUser;
      return { ...r, fromUser: safeUser };
    }).filter(Boolean);
    callback(enriched);
  });

  // Messages with file/voice support
  socket.on('message:send', ({ chatId, senderId, text, replyTo, file, voice, forwardedFrom }) => {
    const msg = {
      id: generateId(),
      chatId,
      senderId,
      text: text || '',
      replyTo: replyTo || null,
      forwardedFrom: forwardedFrom || null,
      timestamp: new Date().toISOString(),
      status: 'sent',
      edited: false,
      pinned: false,
      file: file || null,
      voice: voice || null,
    };
    const chatMessages = messages.get(chatId) || [];
    chatMessages.push(msg);
    messages.set(chatId, chatMessages);

    emitToChat(chatId, 'message:received', msg);

    setTimeout(() => {
      msg.status = 'delivered';
      emitToChat(chatId, 'message:status', { messageId: msg.id, chatId, status: 'delivered' });
    }, 500);
  });

  socket.on('message:read', ({ chatId, userId }) => {
    const chatMessages = messages.get(chatId) || [];
    chatMessages.forEach(m => {
      if (m.senderId !== userId && m.status !== 'read') {
        m.status = 'read';
      }
    });
    emitToChat(chatId, 'message:all-read', { chatId, readBy: userId });
  });

  socket.on('message:edit', ({ messageId, chatId, newText }) => {
    const chatMessages = messages.get(chatId) || [];
    const msg = chatMessages.find(m => m.id === messageId);
    if (msg) {
      msg.text = newText;
      msg.edited = true;
      emitToChat(chatId, 'message:edited', { messageId, chatId, newText });
    }
  });

  socket.on('message:delete', ({ messageId, chatId }) => {
    const chatMessages = messages.get(chatId) || [];
    const idx = chatMessages.findIndex(m => m.id === messageId);
    if (idx >= 0) chatMessages.splice(idx, 1);
    emitToChat(chatId, 'message:deleted', { messageId, chatId });
  });

  socket.on('message:pin', ({ messageId, chatId }) => {
    const chatMessages = messages.get(chatId) || [];
    const msg = chatMessages.find(m => m.id === messageId);
    if (msg) {
      chatMessages.forEach(m => m.pinned = false);
      msg.pinned = true;
      pinnedMessages.set(chatId, msg);
      emitToChat(chatId, 'message:pinned', { chatId, message: msg });
    }
  });

  socket.on('message:unpin', ({ chatId }) => {
    const chatMessages = messages.get(chatId) || [];
    chatMessages.forEach(m => m.pinned = false);
    pinnedMessages.delete(chatId);
    emitToChat(chatId, 'message:unpinned', { chatId });
  });

  socket.on('message:forward', ({ fromChatId, messageId, toChatId, senderId }) => {
    const fromMessages = messages.get(fromChatId) || [];
    const originalMsg = fromMessages.find(m => m.id === messageId);
    if (originalMsg) {
      const senderUser = users.get(originalMsg.senderId);
      const forwardedFrom = senderUser ? senderUser.displayName : 'Unknown';
      const newMsg = {
        id: generateId(),
        chatId: toChatId,
        senderId,
        text: originalMsg.text,
        replyTo: null,
        forwardedFrom,
        timestamp: new Date().toISOString(),
        status: 'sent',
        edited: false,
        pinned: false,
        file: originalMsg.file || null,
        voice: originalMsg.voice || null,
      };
      const chatMessages = messages.get(toChatId) || [];
      chatMessages.push(newMsg);
      messages.set(toChatId, chatMessages);
      emitToChat(toChatId, 'message:received', newMsg);
    }
  });

  socket.on('message:search', ({ chatId, query }, callback) => {
    const chatMessages = messages.get(chatId) || [];
    const results = chatMessages.filter(m =>
      m.text.toLowerCase().includes(query.toLowerCase())
    );
    callback(results);
  });

  socket.on('message:history', ({ chatId }, callback) => {
    const chatMessages = messages.get(chatId) || [];
    const pinned = pinnedMessages.get(chatId) || null;
    callback({ messages: chatMessages, pinnedMessage: pinned });
  });

  // Group chats
  socket.on('group:create', ({ name, creatorId, memberIds }) => {
    const groupId = `group:${generateId()}`;
    const allMembers = [creatorId, ...memberIds];
    const group = {
      id: groupId,
      name,
      creatorId,
      members: allMembers,
      createdAt: new Date().toISOString(),
    };
    groups.set(groupId, group);

    const memberUsers = allMembers.map(id => {
      const u = users.get(id);
      if (!u) return null;
      const { password, ...safeUser } = u;
      return { ...safeUser, isOnline: onlineUsers.has(id) };
    }).filter(Boolean);

    allMembers.forEach(memberId => {
      io.to(`user:${memberId}`).emit('group:created', {
        chatId: groupId,
        groupName: name,
        members: memberUsers,
        isGroup: true,
      });
    });
  });

  socket.on('group:list', (userId, callback) => {
    const userGroups = [...groups.values()].filter(g => g.members.includes(userId));
    const result = userGroups.map(g => {
      const memberUsers = g.members.map(id => {
        const u = users.get(id);
        if (!u) return null;
        const { password, ...safeUser } = u;
        return { ...safeUser, isOnline: onlineUsers.has(id) };
      }).filter(Boolean);
      return {
        chatId: g.id,
        groupName: g.name,
        members: memberUsers,
        isGroup: true,
      };
    });
    callback(result);
  });

  // Calls
  socket.on('call:initiate', ({ callerId, receiverId, callType }) => {
    const caller = users.get(callerId);
    if (caller) {
      const { password, ...safeCaller } = caller;
      io.to(`user:${receiverId}`).emit('call:incoming', {
        callId: generateId(),
        caller: safeCaller,
        callType,
      });
    }
  });

  socket.on('call:accept', ({ callId, receiverId, callerId }) => {
    io.to(`user:${callerId}`).emit('call:accepted', { callId, receiverId });
  });

  socket.on('call:reject', ({ callId, callerId }) => {
    io.to(`user:${callerId}`).emit('call:rejected', { callId });
  });

  socket.on('call:end', ({ callId, userId, otherUserId }) => {
    io.to(`user:${otherUserId}`).emit('call:ended', { callId });
  });

  socket.on('call:screen-share', ({ callId, userId, otherUserId, sharing }) => {
    io.to(`user:${otherUserId}`).emit('call:screen-sharing', { callId, userId, sharing });
  });

  // Typing
  socket.on('typing:start', ({ chatId, userId }) => {
    const group = groups.get(chatId);
    if (group) {
      group.members.forEach(memberId => {
        if (memberId !== userId) {
          io.to(`user:${memberId}`).emit('typing:started', { chatId, userId });
        }
      });
    } else {
      const [id1, id2] = chatId.split(':');
      const otherId = id1 === userId ? id2 : id1;
      io.to(`user:${otherId}`).emit('typing:started', { chatId, userId });
    }
  });

  socket.on('typing:stop', ({ chatId, userId }) => {
    const group = groups.get(chatId);
    if (group) {
      group.members.forEach(memberId => {
        if (memberId !== userId) {
          io.to(`user:${memberId}`).emit('typing:stopped', { chatId, userId });
        }
      });
    } else {
      const [id1, id2] = chatId.split(':');
      const otherId = id1 === userId ? id2 : id1;
      io.to(`user:${otherId}`).emit('typing:stopped', { chatId, userId });
    }
  });

  socket.on('disconnect', () => {
    if (currentUserId) {
      onlineUsers.delete(currentUserId);
      const user = users.get(currentUserId);
      if (user) user.lastSeen = new Date().toISOString();
      io.emit('user:status', { userId: currentUserId, isOnline: false });
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`ZenvorMs Server running on port ${PORT}`);
});
