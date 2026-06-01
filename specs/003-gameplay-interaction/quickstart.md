# Quickstart

## Running the Application

### Backend
```bash
cd backend
npm install
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Testing the Gameplay Interaction
1. Open two browser windows pointing to the frontend URL (e.g., `http://localhost:5173`).
2. Join the same room in both windows.
3. Observe one window assigned as the drawer and the other as the guesser.
4. Draw in the drawer window. Ensure strokes appear in the guesser window within ~1 second.
5. Submit guesses in the guesser window. Test correct guesses, incorrect guesses, and rapid guessing (to trigger the rate limit).
