const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('./models/User'); // Assuming User model is in ../models/User.js
const Message = require('./models/Message');

let io;

// Map to store online users: userId -> Set of socket.ids
const onlineUsers = new Map(); // userId -> { user: UserObject, sockets: Set<string> }

function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: '*', // Adjust for your frontend URL in production
      methods: ['GET', 'POST'],
    },
  });

  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token;
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password');
        if (user) {
          socket.user = user; // Attach user object to socket
          return next();
        }
      } catch (error) {
        console.error('Socket authentication error:', error.message);
      }
    }
    next(new Error('Authentication error'));
  });

  io.on('connection', (socket) => {
    const user = socket.user; // Get user from authenticated socket
    
    if (user) {
      const userId = user._id.toString();
      console.log(`User ${user.full_name} (${user.email}) connected with socket ID: ${socket.id}`);

      if (!onlineUsers.has(userId)) {
        onlineUsers.set(userId, { user: user, sockets: new Set() });
      }
      onlineUsers.get(userId).sockets.add(socket.id);

      io.emit('onlineUsers', getOnlineUsersList());

      // Emit an event to admin client about user status change (optional)
      // io.emit('userOnlineStatus', { userId: userId, status: 'online' });
    } else {
      console.log('Unauthenticated socket connected:', socket.id);
    }

    socket.on('disconnect', () => {
      if (user) {
        const userId = user._id.toString();
        console.log(`User ${user.full_name} (${user.email}) disconnected from socket ID: ${socket.id}`);
        
        if (onlineUsers.has(userId)) {
          onlineUsers.get(userId).sockets.delete(socket.id);
          if (onlineUsers.get(userId).sockets.size === 0) {
            onlineUsers.delete(userId);
            io.emit('onlineUsers', getOnlineUsersList());
            // io.emit('userOnlineStatus', { userId: userId, status: 'offline' });
          }
        }
      } else {
        console.log('Unauthenticated socket disconnected:', socket.id);
      }
    });

    // Handle joining a conversation room
    socket.on('joinConversation', ({ conversationId }) => {
      if (socket.user) {
        socket.join(conversationId);
        console.log(`User ${socket.user.full_name} joined conversation ${conversationId}`);
      }
    });

    // Handle leaving a conversation room
    socket.on('leaveConversation', ({ conversationId }) => {
      if (socket.user) {
        socket.leave(conversationId);
        console.log(`User ${socket.user.full_name} left conversation ${conversationId}`);
      }
    });

    // Handle typing indicators
    socket.on('typing', ({ conversationId }) => {
      if (socket.user) {
        socket.to(conversationId).emit('typing', { user: socket.user.full_name });
      }
    });

    socket.on('stopTyping', ({ conversationId }) => {
      if (socket.user) {
        socket.to(conversationId).emit('stopTyping');
      }
    });

    socket.on('markAsRead', async ({ conversationId, messageIds }) => {
      if (socket.user) {
        await Message.updateMany(
          { _id: { $in: messageIds }, sender_email: { $ne: socket.user.email } },
          { $set: { read: true } }
        );
        socket.to(conversationId).emit('messagesRead', { messageIds });
      }
    });
  });

  return io;
}

function getIO() {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
}

function getOnlineUsersList() {
  const users = [];
  for (const [userId, data] of onlineUsers.entries()) {
    // Return a lean user object, excluding sensitive info
    users.push({
      _id: data.user._id,
      full_name: data.user.full_name,
      email: data.user.email,
      role: data.user.role,
      socketIds: Array.from(data.sockets),
    });
  }
  return users;
}

module.exports = { initSocket, getIO, getOnlineUsersList };
