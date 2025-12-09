import { useCognitiveProfileStore } from '../../stores/cognitiveProfileStore';
import { Info, AlertCircle } from 'lucide-react';

interface SoftErrorProps {
  message: string;
  suggestion?: string;
  className?: string;
}

/**
 * Displays error messages in a calmer, more helpful way for the Calm profile
 * Instead of red/alarming, uses neutral colors and constructive language
 */
export function SoftError({ message, suggestion, className = '' }: SoftErrorProps) {
  const { settings } = useCognitiveProfileStore();

  const isCalm = settings.softErrorsEnabled;

  if (isCalm) {
    return (
      <div className={`flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg ${className}`}>
        <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-blue-900 font-medium">Let's try something</p>
          <p className="text-blue-800 text-sm mt-1">{message}</p>
          {suggestion && (
            <p className="text-blue-700 text-sm mt-2 italic">
              💡 {suggestion}
            </p>
          )}
        </div>
      </div>
    );
  }

  // Default error style
  return (
    <div className={`flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg ${className}`}>
      <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
      <div>
        <p className="text-red-900 font-medium">Error</p>
        <p className="text-red-800 text-sm mt-1">{message}</p>
        {suggestion && (
          <p className="text-red-700 text-sm mt-2">
            {suggestion}
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * Hook to transform error messages into softer language
 */
export function useSoftErrorMessage(error: string): string {
  const { settings } = useCognitiveProfileStore();

  if (!settings.softErrorsEnabled) {
    return error;
  }

  // Transform common error patterns into softer language
  const transformations: [RegExp, string][] = [
    [/invalid/gi, 'not quite right'],
    [/error/gi, 'issue'],
    [/failed/gi, 'didn\'t work'],
    [/cannot/gi, 'can\'t'],
    [/must/gi, 'should'],
    [/required/gi, 'needed'],
    [/forbidden/gi, 'not available'],
    [/unauthorized/gi, 'need permission'],
    [/denied/gi, 'not allowed right now'],
  ];

  let softMessage = error;
  for (const [pattern, replacement] of transformations) {
    softMessage = softMessage.replace(pattern, replacement);
  }

  return softMessage;
}
