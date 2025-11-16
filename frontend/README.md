# DawgPound Frontend

Modern React-based UI for the DawgPound university community platform.

## Features

- **Authentication & Onboarding**: University email signup, verification, and comprehensive onboarding wizard
- **Design System**: Reusable components with Tailwind CSS styling
- **Theme Support**: Light/dark mode with system preference detection
- **Responsive Design**: Mobile-first layouts that work on all screen sizes
- **Accessibility**: WCAG 2.1 AA compliant with ARIA labels and keyboard navigation
- **Real-time Support**: WebSocket integration for live updates
- **Type Safety**: Full TypeScript implementation

## Tech Stack

- **React 19** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **TanStack Query** - Data fetching and caching
- **Axios** - HTTP client
- **Socket.io Client** - WebSocket client
- **Heroicons** - Icon library

## Getting Started

### Prerequisites

- Node.js 20+
- npm

### Installation

```bash
cd frontend
npm install
```

### Development

Start the dev server (backend must be running on port 4000):

```bash
npm run dev
```

The app will be available at `http://localhost:3000`.

### Building

```bash
npm run build
```

### Testing

```bash
npm test
```

## Component Library

- **Button** - Variants: primary, secondary, danger, ghost
- **Input** - Form input with validation
- **Card** - Container with header, body, footer
- **LoadingSpinner** - Loading indicators

## API Integration

- **REST API**: Proxied through `/api` to `http://localhost:4000`
- **WebSocket**: Proxied through `/ws` to `ws://localhost:4000/ws`
