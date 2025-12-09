import { useEffect, useState } from 'react';
import { useCognitiveProfileStore } from '../../stores/cognitiveProfileStore';

export function ReadingRuler() {
  const { settings } = useCognitiveProfileStore();
  const [position, setPosition] = useState(0);

  useEffect(() => {
    if (!settings.readingRulerEnabled) return;

    const handleMouseMove = (e: MouseEvent) => {
      // Center the ruler on the mouse Y position
      const rulerHeight = 48; // 3rem
      setPosition(e.clientY - rulerHeight / 2);
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [settings.readingRulerEnabled]);

  if (!settings.readingRulerEnabled) return null;

  return (
    <div
      className="reading-ruler"
      style={{ top: `${position}px` }}
      aria-hidden="true"
    />
  );
}
