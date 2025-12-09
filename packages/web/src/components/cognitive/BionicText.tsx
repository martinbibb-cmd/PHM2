import { useMemo } from 'react';
import { useCognitiveProfileStore } from '../../stores/cognitiveProfileStore';

interface BionicTextProps {
  children: string;
  className?: string;
}

/**
 * Converts text to "bionic reading" format by bolding the first few letters of each word
 * This helps the brain recognize words faster, particularly helpful for dyslexia
 */
export function BionicText({ children, className = '' }: BionicTextProps) {
  const { settings } = useCognitiveProfileStore();

  const bionicContent = useMemo(() => {
    if (!settings.bionicReadingEnabled) {
      return children;
    }

    // Split into words while preserving whitespace
    const words = children.split(/(\s+)/);

    return words.map((word, index) => {
      // If it's whitespace, return as-is
      if (/^\s+$/.test(word)) {
        return word;
      }

      // Calculate how many letters to bold (first 40-50% of word)
      const boldLength = Math.ceil(word.length * 0.4);

      if (boldLength === 0) {
        return word;
      }

      const boldPart = word.slice(0, boldLength);
      const normalPart = word.slice(boldLength);

      return (
        <span key={index} className="bionic-word">
          <strong>{boldPart}</strong>
          {normalPart}
        </span>
      );
    });
  }, [children, settings.bionicReadingEnabled]);

  return <span className={className}>{bionicContent}</span>;
}

/**
 * Hook to apply bionic reading to plain text
 */
export function useBionicText(text: string): string | JSX.Element[] {
  const { settings } = useCognitiveProfileStore();

  return useMemo(() => {
    if (!settings.bionicReadingEnabled) {
      return text;
    }

    const words = text.split(/(\s+)/);

    return words.map((word, index) => {
      if (/^\s+$/.test(word)) {
        return word;
      }

      const boldLength = Math.ceil(word.length * 0.4);

      if (boldLength === 0) {
        return word;
      }

      const boldPart = word.slice(0, boldLength);
      const normalPart = word.slice(boldLength);

      return (
        <span key={index} className="bionic-word">
          <strong>{boldPart}</strong>
          {normalPart}
        </span>
      );
    });
  }, [text, settings.bionicReadingEnabled]);
}
