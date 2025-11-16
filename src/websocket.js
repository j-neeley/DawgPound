const { Server } = require('socket.io');
const { v4: uuidv4 } = require('uuid');
const store = require('./store');

let io = null;

function initializeWebSocket(server) {
  io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });
  
  io.on('connection', (socket) => {
    console.log(`WebSocket client connected: ${socket.id}`);
    
    // Authentication - client must send userId
    socket.on('authenticate', (data) => {
      const { userId } = data;
      
      if (!userId) {
        socket.emit('error', { message: 'userId required for authentication' });
        return;
      }
      
      const user = store.getUserById(userId);
      if (!user) {
        socket.emit('error', { message: 'user not found' });
        return;
      }
      
      if (!user.verified) {
        socket.emit('error', { message: 'user not verified' });
        return;
      }
      
      // Store user info on socket
      socket.userId = userId;
      socket.user = user;
      
      // Join user to their personal room
      socket.join(`user:${userId}`);
      
      // Join user to all their chat rooms
      const chats = store.listPrivateChatsForUser(userId);
      chats.forEach(chat => {
        socket.join(`chat:${chat.id}`);
      });
      
      socket.emit('authenticated', { userId, message: 'authenticated successfully' });
      console.log(`User ${userId} authenticated via WebSocket`);
    });
    
    // Join a chat room
    socket.on('join_chat', (data) => {
      if (!socket.userId) {
        socket.emit('error', { message: 'not authenticated' });
        return;
      }
      
      const { chatId } = data;
      if (!chatId) {
        socket.emit('error', { message: 'chatId required' });
        return;
      }
      
      const chat = store.getPrivateChatById(chatId);
      if (!chat) {
        socket.emit('error', { message: 'chat not found' });
        return;
      }
      
      // Check user is a participant
      if (!chat.participants || !chat.participants.includes(socket.userId)) {
        socket.emit('error', { message: 'not a participant of this chat' });
        return;
      }
      
      socket.join(`chat:${chatId}`);
      socket.emit('joined_chat', { chatId });
      console.log(`User ${socket.userId} joined chat ${chatId}`);
    });
    
    // Send a message
    socket.on('send_message', (data) => {
      if (!socket.userId) {
        socket.emit('error', { message: 'not authenticated' });
        return;
      }
      
      const { chatId, content } = data;
      
      if (!chatId || !content) {
        socket.emit('error', { message: 'chatId and content required' });
        return;
      }
      
      if (typeof content !== 'string' || content.trim().length === 0) {
        socket.emit('error', { message: 'content must be a non-empty string' });
        return;
      }
      
      if (content.trim().length > 10000) {
        socket.emit('error', { message: 'content must be 10000 characters or less' });
        return;
      }
      
      const chat = store.getPrivateChatById(chatId);
      if (!chat) {
        socket.emit('error', { message: 'chat not found' });
        return;
      }
      
      // Check user is a participant
      if (!chat.participants || !chat.participants.includes(socket.userId)) {
        socket.emit('error', { message: 'not a participant of this chat' });
        return;
      }
      
      // Create message
      const message = {
        id: uuidv4(),
        chatId,
        authorId: socket.userId,
        content: content.trim(),
        createdAt: new Date().toISOString()
      };
      
      store.createMessage(message);
      
      // Enrich with author info
      const author = store.getUserById(socket.userId);
      const enrichedMessage = {
        ...message,
        authorName: author ? author.name : 'Unknown'
      };
      
      // Broadcast to all participants in the chat room
      io.to(`chat:${chatId}`).emit('new_message', enrichedMessage);
      
      // Send notifications to non-muted participants
      chat.participants.forEach(participantId => {
        if (participantId !== socket.userId) {
          const isMuted = chat.mutedBy && chat.mutedBy.includes(participantId);
          if (!isMuted) {
            io.to(`user:${participantId}`).emit('message_notification', {
              chatId,
              chatName: chat.name,
              message: enrichedMessage
            });
          }
        }
      });
      
      console.log(`Message sent by ${socket.userId} in chat ${chatId}`);
    });
    
    // User is typing
    socket.on('typing', (data) => {
      if (!socket.userId) return;
      
      const { chatId } = data;
      if (!chatId) return;
      
      const chat = store.getPrivateChatById(chatId);
      if (!chat || !chat.participants || !chat.participants.includes(socket.userId)) {
        return;
      }
      
      // Broadcast typing indicator to other participants
      socket.to(`chat:${chatId}`).emit('user_typing', {
        chatId,
        userId: socket.userId,
        userName: socket.user.name
      });
    });
    
    // User stopped typing
    socket.on('stop_typing', (data) => {
      if (!socket.userId) return;
      
      const { chatId } = data;
      if (!chatId) return;
      
      const chat = store.getPrivateChatById(chatId);
      if (!chat || !chat.participants || !chat.participants.includes(socket.userId)) {
        return;
      }
      
      // Broadcast stop typing to other participants
      socket.to(`chat:${chatId}`).emit('user_stop_typing', {
        chatId,
        userId: socket.userId
      });
    });
    
    socket.on('disconnect', () => {
      console.log(`WebSocket client disconnected: ${socket.id}`);
    });
  });
  
  return io;
}

function getIO() {
  return io;
}

module.exports = { initializeWebSocket, getIO };
