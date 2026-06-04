import React from 'react';
import type { Guess } from '../../../backend/src/models/game';

interface ResultPanelProps {
  guessHistory: Guess[];
  participants: { id: string; name: string }[];
}

export const ResultPanel: React.FC<ResultPanelProps> = ({ guessHistory = [], participants = [] }) => {
  return (
    <div className="result-panel">
      <h3>Activity</h3>
      <ul className="guess-history">
        {guessHistory?.map((guess, index) => (
          <li key={index} className={guess.isCorrect ? 'correct' : ''}>
            {participants?.find(p => p.id === guess.playerId)?.name || 'Unknown'}: {guess.text}
          </li>
        ))}
      </ul>
    </div>
  );
};
