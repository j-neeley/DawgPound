# WebSocket Client Example

This example demonstrates how to connect to the forum's real-time WebSocket updates.

## Prerequisites

Install a WebSocket client library. For Node.js:

```bash
npm install ws
```

## Example Client Code

```javascript
const WebSocket = require('ws');

// Connection parameters
const userId = 'your-user-id';
const groupId = 'your-group-id';
const wsUrl = `ws://localhost:4000/ws?userId=${userId}&groupId=${groupId}`;

// Create connection
const ws = new WebSocket(wsUrl);

ws.on('open', () => {
  console.log('Connected to forum updates');
});

ws.on('message', (data) => {
  const message = JSON.parse(data.toString());
  console.log('Received:', message);
  
  switch (message.type) {
    case 'connected':
      console.log('Successfully connected to group:', message.groupId);
      break;
      
    case 'thread_created':
      console.log('New thread:', message.thread.title);
      console.log('By:', message.thread.authorName);
      break;
      
    case 'reply_created':
      console.log('New reply in thread:', message.threadId);
      console.log('By:', message.reply.authorName);
      break;
      
    case 'thread_updated':
      console.log('Thread updated:', message.threadId);
      console.log('Changes:', message.updates);
      if (message.updates.isPinned !== undefined) {
        console.log(message.updates.isPinned ? 'Thread pinned' : 'Thread unpinned');
      }
      if (message.updates.isLocked !== undefined) {
        console.log(message.updates.isLocked ? 'Thread locked' : 'Thread unlocked');
      }
      break;
      
    case 'thread_deleted':
      console.log('Thread deleted:', message.threadId);
      break;
      
    case 'reply_deleted':
      console.log('Reply deleted:', message.replyId);
      console.log('From thread:', message.threadId);
      break;
      
    default:
      console.log('Unknown message type:', message.type);
  }
});

ws.on('error', (error) => {
  console.error('WebSocket error:', error);
});

ws.on('close', () => {
  console.log('Disconnected from forum updates');
});
```

## Browser Example

```html
<!DOCTYPE html>
<html>
<head>
  <title>Forum Updates</title>
</head>
<body>
  <h1>Forum Live Updates</h1>
  <div id="messages"></div>
  
  <script>
    const userId = 'your-user-id';
    const groupId = 'your-group-id';
    const ws = new WebSocket(`ws://localhost:4000/ws?userId=${userId}&groupId=${groupId}`);
    
    const messagesDiv = document.getElementById('messages');
    
    ws.onopen = () => {
      addMessage('Connected to forum updates', 'success');
    };
    
    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      
      switch (message.type) {
        case 'thread_created':
          addMessage(`New thread: ${message.thread.title} by ${message.thread.authorName}`, 'info');
          break;
        case 'reply_created':
          addMessage(`New reply by ${message.reply.authorName}`, 'info');
          break;
        case 'thread_updated':
          if (message.updates.isPinned !== undefined) {
            addMessage(message.updates.isPinned ? 'Thread pinned' : 'Thread unpinned', 'warning');
          }
          if (message.updates.isLocked !== undefined) {
            addMessage(message.updates.isLocked ? 'Thread locked' : 'Thread unlocked', 'warning');
          }
          break;
        case 'thread_deleted':
          addMessage('Thread deleted', 'danger');
          break;
        case 'reply_deleted':
          addMessage('Reply deleted', 'danger');
          break;
      }
    };
    
    ws.onerror = (error) => {
      addMessage('WebSocket error', 'error');
      console.error(error);
    };
    
    ws.onclose = () => {
      addMessage('Disconnected from forum updates', 'error');
    };
    
    function addMessage(text, type) {
      const div = document.createElement('div');
      div.className = type;
      div.textContent = `[${new Date().toLocaleTimeString()}] ${text}`;
      messagesDiv.appendChild(div);
    }
  </script>
</body>
</html>
```

## Message Types

The WebSocket server sends the following message types:

### `connected`
Sent when connection is established.
```json
{
  "type": "connected",
  "groupId": "...",
  "message": "Connected to group forum updates"
}
```

### `thread_created`
Sent when a new thread is created in the group.
```json
{
  "type": "thread_created",
  "thread": {
    "id": "...",
    "title": "...",
    "content": "...",
    "contentType": "plain|markdown|html",
    "authorId": "...",
    "authorName": "...",
    "createdAt": "...",
    "isPinned": false,
    "isLocked": false,
    "attachments": [...]
  }
}
```

### `reply_created`
Sent when a new reply is added to a thread.
```json
{
  "type": "reply_created",
  "threadId": "...",
  "reply": {
    "id": "...",
    "content": "...",
    "contentType": "plain|markdown|html",
    "authorId": "...",
    "authorName": "...",
    "createdAt": "...",
    "attachments": [...]
  }
}
```

### `thread_updated`
Sent when a thread is pinned/unpinned or locked/unlocked.
```json
{
  "type": "thread_updated",
  "threadId": "...",
  "updates": {
    "isPinned": true,
    "isLocked": false
  }
}
```

### `thread_deleted`
Sent when a thread is deleted.
```json
{
  "type": "thread_deleted",
  "threadId": "..."
}
```

### `reply_deleted`
Sent when a reply is deleted.
```json
{
  "type": "reply_deleted",
  "threadId": "...",
  "replyId": "..."
}
```

## Connection Requirements

- User must be verified and a member of the group
- Both `userId` and `groupId` query parameters are required
- Connection will be rejected if user is not a member or doesn't exist

## Notes

- Each user can have multiple WebSocket connections to different groups
- Updates are only sent to members of the affected group
- Connection is automatically closed when user leaves the group
