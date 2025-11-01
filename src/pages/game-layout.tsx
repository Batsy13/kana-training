import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router';
import type { CharacterSections, KanaCharacter } from '../lib/kanaData';
import { ChevronLeft } from 'lucide-react';

type CharacterStat = {
  hasBeenSeen: boolean;
  correctCount: number;
};

type CharacterStats = {
  [romaji: string]: CharacterStat;
};

type GameLayoutProps = {
  data: CharacterSections;
  gameTitle: string;
};

const MASTERY_SCORE = 10;
const UNLOCK_SCORE = 7;
const UNLOCK_COUNT = 3;

const shuffleArray = (array: string[]): string[] => {
  return [...array].sort(() => Math.random() - 0.5);
};

const initializeStats = (data: CharacterSections): CharacterStats => {
  const stats: CharacterStats = {};
  for (const section of data) {
    for (const item of section) {
      stats[item.romaji] = {
        hasBeenSeen: false,
        correctCount: 0,
      };
    }
  }
  return stats;
};

const initializeRandomModeStats = (
  data: CharacterSections
): CharacterStats => {
  const stats: CharacterStats = {};
  for (const section of data) {
    for (const item of section) {
      stats[item.romaji] = {
        hasBeenSeen: true,
        correctCount: 10,
      };
    }
  }
  return stats;
};

const GameLayout: React.FC<GameLayoutProps> = ({ data, gameTitle }) => {
  const [characterStats, setCharacterStats] = useState<CharacterStats>(() =>
    initializeStats(data)
  );
  const [availableSectionIndex, setAvailableSectionIndex] = useState(0);
  const [currentCharacter, setCurrentCharacter] = useState<KanaCharacter>(
    data[0][0]
  );
  const [options, setOptions] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [borderColor, setBorderColor] = useState<string>('');
  const [isRandomMode, setIsRandomMode] = useState(false);

  const currentStats = characterStats[currentCharacter.romaji];

  const getAvailablePool = (sectionIndex: number): KanaCharacter[] => {
    return data.slice(0, sectionIndex + 1).flat();
  };

  useEffect(() => {
    generateOptions();
  }, [currentCharacter, availableSectionIndex]);

  const generateOptions = () => {
    if (!currentStats.hasBeenSeen) {
      setOptions([currentCharacter.romaji]);
      return;
    }

    const allAvailableCharacters = getAvailablePool(availableSectionIndex);

    let distractors = allAvailableCharacters
      .filter((k) => k.romaji !== currentCharacter.romaji)
      .map((k) => k.romaji);

    let uniqueDistractors = Array.from(new Set(shuffleArray(distractors)));

    let newOptions = [currentCharacter.romaji];
    for (let i = 0; i < 3 && i < uniqueDistractors.length; i++) {
      newOptions.push(uniqueDistractors[i]);
    }

    setOptions(shuffleArray(newOptions));
  };

  const getNextCharacter = (
    updatedStats: CharacterStats,
    currentAvailableSectionIndex: number
  ): KanaCharacter => {
    const availablePool = getAvailablePool(currentAvailableSectionIndex);

    const unseenInPool = availablePool.filter(
      (char) => !updatedStats[char.romaji].hasBeenSeen
    );

    if (unseenInPool.length > 0) {
      return unseenInPool[0];
    }

    let selectionPool = availablePool;
    if (availablePool.length > 1) {
      selectionPool = availablePool.filter(
        (char) => char.romaji !== currentCharacter.romaji
      );
    }

    const weightedPool = selectionPool.map((char) => {
      const score = updatedStats[char.romaji].correctCount;

      if (score >= MASTERY_SCORE) {
        return { char, weight: 0.1 };
      }

      const baseWeight = MASTERY_SCORE - score + 1;
      const weight = Math.max(1, Math.pow(baseWeight, 2));
      return { char, weight };
    });

    const totalWeight = weightedPool.reduce((sum, item) => sum + item.weight, 0);

    if (totalWeight === 0) {
      return selectionPool[
        Math.floor(Math.random() * selectionPool.length)
      ] || availablePool[0];
    }

    let randomVal = Math.random() * totalWeight;

    for (const item of weightedPool) {
      randomVal -= item.weight;
      if (randomVal <= 0) {
        return item.char;
      }
    }

    return selectionPool[0] || availablePool[0];
  };

  const goToNext = (
    updatedStats: CharacterStats,
    currentAvailableSectionIndex: number
  ) => {
    setFeedback(null);
    setBorderColor('');

    const nextChar = getNextCharacter(
      updatedStats,
      currentAvailableSectionIndex
    );
    setCurrentCharacter(nextChar);
  };

  const handleAnswer = (selectedRomaji: string) => {
    if (feedback) return;

    const isCorrect = selectedRomaji === currentCharacter.romaji;
    let feedbackMessage = '';

    const newStats = { ...characterStats };
    const charStat = { ...newStats[currentCharacter.romaji] };

    charStat.hasBeenSeen = true;

    if (isCorrect) {
      charStat.correctCount += 1;
      feedbackMessage = `Correct! (Score: ${charStat.correctCount})`;
      setBorderColor('green');
      if (charStat.correctCount === MASTERY_SCORE) {
        feedbackMessage = `Mastered ${currentCharacter.kana}! (Score: ${charStat.correctCount})`;
      }
    } else {
      feedbackMessage = `Incorrect. The answer was "${currentCharacter.romaji}".`;
      setBorderColor('red');
    }

    newStats[currentCharacter.romaji] = charStat;
    setCharacterStats(newStats);
    setFeedback(feedbackMessage);

    let nextAvailableSectionIndex = availableSectionIndex;
    if (!isRandomMode && availableSectionIndex < data.length - 1) {
      const currentSection = data[availableSectionIndex];
      const masteredCount = currentSection.filter(
        (char) => newStats[char.romaji].correctCount >= UNLOCK_SCORE
      ).length;

      if (masteredCount >= UNLOCK_COUNT) {
        nextAvailableSectionIndex = availableSectionIndex + 1;
        setAvailableSectionIndex(nextAvailableSectionIndex);
      }
    }

    setTimeout(() => {
      goToNext(newStats, nextAvailableSectionIndex);
    }, 700);
  };

  const toggleGameMode = () => {
    if (isRandomMode) {
      const newStats = initializeStats(data);
      const newIndex = 0;
      setCharacterStats(newStats);
      setAvailableSectionIndex(newIndex);
      setIsRandomMode(false);
      goToNext(newStats, newIndex);
    } else {
      const newStats = initializeRandomModeStats(data);
      const newIndex = data.length - 1;
      setCharacterStats(newStats);
      setAvailableSectionIndex(newIndex);
      setIsRandomMode(true);
      goToNext(newStats, newIndex);
    }
  };

  return (
    <>
      <div className={`quiz-container ${borderColor}`}>
        {feedback && (
          <div
            className={`feedback ${feedback.includes('Correct') || feedback.includes('Mastered')
                ? 'correct'
                : 'incorrect'
              }`}
          >
            {feedback}
          </div>
        )}
        <div className="stats-header">
          <NavLink to="/" className="back-link">
            <ChevronLeft />
          </NavLink>
          <h3>{gameTitle}</h3>
          <p>
            Score for {currentCharacter.kana}: {currentStats.correctCount}
          </p>
        </div>
        <div className="character-display">{currentCharacter.kana}</div>
        <div className="options-grid">
          {options.map((option) => (
            <button
              key={option}
              onClick={() => handleAnswer(option)}
              disabled={!!feedback}
              className="option-button"
            >
              {option}
            </button>
          ))}
        </div>
      </div>
      <button
        onClick={toggleGameMode}
        className="random-button"
      >
        {isRandomMode
          ? 'Sequencial mode (All lvl 0)'
          : 'Random Mode (All lvl 10)'}
      </button>
    </>
  );
};

export default GameLayout;