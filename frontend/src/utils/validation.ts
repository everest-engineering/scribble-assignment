export function isValidRoomCode(raw: string) {
  const code = (raw || "").trim().toUpperCase();
  return /^[A-Z0-9]{4}$/.test(code);
}

export function roomCodeErrorMessage(raw: string) {
  const code = (raw || "").trim();
  if (code.length === 0) return "";
  if (!/^[A-Za-z0-9]*$/.test(code))
    return "Room code may only contain letters and numbers.";
  if (code.length !== 4) return "Room code must be 4 characters.";
  return "";
}

export const MAX_GUESS_LENGTH = 200;

export function trimGuess(raw: string) {
  return (raw || "").trim();
}

export function validateGuess(raw: string) {
  const text = trimGuess(raw);
  if (text.length === 0) return "Please enter a guess.";
  if (text.length > MAX_GUESS_LENGTH)
    return `Guess must be ${MAX_GUESS_LENGTH} characters or less.`;
  return "";
}
