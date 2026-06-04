# Quickstart Guide: Scribble Multiplayer Drawing Game

This project contains a React frontend (Vite) and an Express backend (Node.js).

## Development Setup

### 1. Run the Backend
Navigate to the `backend/` directory, install dependencies, and start the development watcher:
```bash
cd backend
npm install
npm run dev
```
The server will run on `http://localhost:3001`.

### 2. Run the Frontend
Navigate to the `frontend/` directory, install dependencies, and start the development server:
```bash
cd frontend
npm install
npm run dev
```
The client will run on `http://localhost:5173`.

---

## Verification & Testing

### Run Backend Unit Tests
```bash
cd backend
npm test
```

### Run Frontend Unit Tests
```bash
cd frontend
npm test
```

### Production Build Verification
Ensure both apps build cleanly before making changes:
```bash
cd backend && npm run build
cd ../frontend && npm run build
```
