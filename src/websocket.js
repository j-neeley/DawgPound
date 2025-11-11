const WebSocket = require('ws');
const url = require('url');
const store = require('./store');

let wss = null;
const groupSubscriptions = new Map(); // groupId -> Set of ws connections

function initialize(server) {
  wss = new WebSocket.Server({ server, path: '/ws' });

  wss.on('connection', (ws, request) => {
    const params = url.parse(request.url, true).query;
    const userId = params.userId;
    const groupId = params.groupId;

    if (!userId || !groupId) {
      ws.close(1008, 'userId and groupId required');
      return;
    }

    // Verify user exists and is verified
    const user = store.getUserById(userId);
    if (!user || !user.verified) {
      ws.close(1008, 'invalid or unverified user');
      return;
    }

    // Verify group exists and user is a member
    const group = store.getGroupById(groupId);
    if (!group || !group.members || !group.members.includes(userId)) {
      ws.close(1008, 'invalid group or not a member');
      return;
    }

    // Subscribe to group updates
    if (!groupSubscriptions.has(groupId)) {
      groupSubscriptions.set(groupId, new Set());
    }
    groupSubscriptions.get(groupId).add(ws);

    ws.on('close', () => {
      const subs = groupSubscriptions.get(groupId);
      if (subs) {
        subs.delete(ws);
        if (subs.size === 0) {
          groupSubscriptions.delete(groupId);
        }
      }
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });

    // Send connection confirmation
    ws.send(JSON.stringify({
      type: 'connected',
      groupId,
      message: 'Connected to group forum updates'
    }));
  });

  console.log('WebSocket server initialized on /ws');
}

function broadcastToGroup(groupId, message) {
  if (!wss || !groupSubscriptions.has(groupId)) {
    return;
  }

  const subscribers = groupSubscriptions.get(groupId);
  const messageStr = JSON.stringify(message);

  subscribers.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(messageStr);
    }
  });
}

function notifyThreadCreated(groupId, thread) {
  broadcastToGroup(groupId, {
    type: 'thread_created',
    thread
  });
}

function notifyReplyCreated(groupId, threadId, reply) {
  broadcastToGroup(groupId, {
    type: 'reply_created',
    threadId,
    reply
  });
}

function notifyThreadUpdated(groupId, threadId, updates) {
  broadcastToGroup(groupId, {
    type: 'thread_updated',
    threadId,
    updates
  });
}

function notifyThreadDeleted(groupId, threadId) {
  broadcastToGroup(groupId, {
    type: 'thread_deleted',
    threadId
  });
}

function notifyReplyDeleted(groupId, threadId, replyId) {
  broadcastToGroup(groupId, {
    type: 'reply_deleted',
    threadId,
    replyId
  });
}

module.exports = {
  initialize,
  notifyThreadCreated,
  notifyReplyCreated,
  notifyThreadUpdated,
  notifyThreadDeleted,
  notifyReplyDeleted
};
