import { useState, useRef, useEffect } from 'react';
import { useCognitiveProfileStore } from '../../stores/cognitiveProfileStore';
import { Button } from '../ui/button';
import { Loader2 } from 'lucide-react';

interface ConfirmButtonProps {
  onClick: () => void | Promise<void>;
  children: React.ReactNode;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  disabled?: boolean;
  destructive?: boolean;
  holdDuration?: number; // in milliseconds
}

/**
 * A button that requires press-and-hold for destructive actions in Calm mode
 * Reduces anxiety about accidental clicks
 */
export function ConfirmButton({
  onClick,
  children,
  variant = 'default',
  size = 'default',
  className = '',
  disabled = false,
  destructive = false,
  holdDuration = 800,
}: ConfirmButtonProps) {
  const { settings } = useCognitiveProfileStore();
  const [isHolding, setIsHolding] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isExecuting, setIsExecuting] = useState(false);
  const holdTimerRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const needsConfirmation = settings.confirmDestructiveActions && destructive;

  useEffect(() => {
    return () => {
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, []);

  const handleMouseDown = () => {
    if (disabled || isExecuting) return;

    if (!needsConfirmation) return;

    setIsHolding(true);
    setProgress(0);

    // Update progress bar
    const startTime = Date.now();
    progressIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min((elapsed / holdDuration) * 100, 100);
      setProgress(newProgress);
    }, 50);

    // Execute after hold duration
    holdTimerRef.current = setTimeout(async () => {
      setIsHolding(false);
      setIsExecuting(true);

      try {
        await onClick();
      } finally {
        setIsExecuting(false);
        setProgress(0);
      }
    }, holdDuration);
  };

  const handleMouseUp = () => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    setIsHolding(false);
    setProgress(0);
  };

  const handleClick = async (e: React.MouseEvent) => {
    if (needsConfirmation) {
      // For hold-to-confirm mode, prevent immediate click
      e.preventDefault();
      return;
    }

    // Normal click behavior
    if (disabled || isExecuting) return;

    setIsExecuting(true);
    try {
      await onClick();
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={`${className} ${needsConfirmation && destructive ? 'confirm-button-hold' : ''}`}
      style={
        needsConfirmation && isHolding
          ? ({ '--hold-progress': `${progress}%` } as React.CSSProperties)
          : undefined
      }
      disabled={disabled || isExecuting}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleMouseDown}
      onTouchEnd={handleMouseUp}
    >
      {isExecuting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {children}
      {needsConfirmation && destructive && !isExecuting && (
        <span className="ml-2 text-xs opacity-60">
          {isHolding ? 'Hold...' : '(Hold)'}
        </span>
      )}
    </Button>
  );
}
