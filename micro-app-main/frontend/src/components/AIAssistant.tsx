import { Brain, ChevronRight, ChevronLeft } from 'lucide-react';
import { AIHint } from '../types';
import { useState, useEffect, useRef } from 'react';
import katex from 'katex';

interface AIAssistantProps {
  hint: AIHint | null;
  isLoading?: boolean;
}

export function AIAssistant({ hint, isLoading }: AIAssistantProps) {
  const [currentHintLevel, setCurrentHintLevel] = useState(1);
  const hintContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (hint) {
      setCurrentHintLevel(1);
      console.log('New hint received, resetting to level 1');
    }
  }, [hint]);

  useEffect(() => {
    if (hintContentRef.current && hint) {
      const currentHint = getProgressiveHint();
      if (!currentHint) {
        console.error('No hint available for current level');
        return;
      }

      try {
        // Split content by LaTeX delimiters
        const parts = currentHint.content.split(/(\\[\[\(].*?\\[\]\)])/g);
        console.log('Split content into parts:', parts);

        // Clear previous content
        hintContentRef.current.innerHTML = '';

        // Process each part
        parts.forEach(part => {
          if (part.startsWith('\\[') && part.endsWith('\\]')) {
            // Display math mode
            const math = part.slice(2, -2);
            const div = document.createElement('div');
            div.className = 'my-2';
            try {
              katex.render(math, div, {
                displayMode: true,
                throwOnError: false,
                trust: true,
                strict: false
              });
              hintContentRef.current?.appendChild(div);
            } catch (error) {
              console.error('KaTeX display math error:', error);
              div.textContent = math;
              hintContentRef.current?.appendChild(div);
            }
          } else if (part.startsWith('\\(') && part.endsWith('\\)')) {
            // Inline math mode
            const math = part.slice(2, -2);
            const span = document.createElement('span');
            span.className = 'mx-1';
            try {
              katex.render(math, span, {
                displayMode: false,
                throwOnError: false,
                trust: true,
                strict: false
              });
              hintContentRef.current?.appendChild(span);
            } catch (error) {
              console.error('KaTeX inline math error:', error);
              span.textContent = math;
              hintContentRef.current?.appendChild(span);
            }
          } else {
            // Regular text
            const text = document.createTextNode(part);
            hintContentRef.current?.appendChild(text);
          }
        });

      } catch (error) {
        console.error('Overall rendering error:', error);
        if (hintContentRef.current) {
          hintContentRef.current.textContent = currentHint.content;
        }
      }
    }
  }, [hint, currentHintLevel]);

  if (isLoading) {
    return (
      <div className="mt-4 bg-gray-50 rounded-lg p-3 md:p-4">
        <div className="flex items-center gap-2 mb-2">
          <Brain className="w-5 h-5 text-emerald-500 animate-pulse" />
          <span className="font-medium">AI Assistant is analyzing the pattern...</span>
        </div>
      </div>
    );
  }

  if (!hint) return null;

  const getProgressiveHint = () => {
    console.log('Getting progressive hint for level:', currentHintLevel);
    console.log('Full hint data:', hint);

    const hintData = {
      1: {
        title: "Basic Hint",
        content: hint?.hint || '',
        analysis: "Initial pattern observation"
      },
      2: {
        title: "Detailed Hint",
        content: hint?.reasoning || '',
        analysis: "Pattern breakdown and analysis"
      },
      3: {
        title: "Advanced Hint",
        content: Array.isArray(hint?.tips) ? hint.tips.join('\n') : '',
        analysis: "Comprehensive explanation"
      }
    }[currentHintLevel];

    console.log('Generated hint data for current level:', hintData);
    return hintData;
  };

  const currentHint = getProgressiveHint();
  if (!currentHint) return null;

  const canShowNextHint = currentHintLevel < 3;
  const canShowPrevHint = currentHintLevel > 1;

  return (
    <div className="mt-4 bg-gray-50 rounded-lg p-4 md:p-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Brain className="w-6 h-6 text-emerald-500" />
          <span className="font-semibold text-lg">Pattern Analysis Assistant</span>
        </div>
        <span className="text-sm bg-emerald-100 text-emerald-800 px-2 py-1 rounded">
          Hint Level {currentHintLevel} of 3
        </span>
      </div>

      <div className="space-y-4">
        <div>
          <h3 className="font-medium text-gray-700 mb-1">{currentHint.title}:</h3>
          <div 
            ref={hintContentRef}
            className="text-gray-600 whitespace-pre-line prose prose-emerald max-w-none"
          />
        </div>

        <div className="flex justify-between items-center">
          {canShowPrevHint ? (
            <button
              onClick={() => setCurrentHintLevel(prev => Math.max(prev - 1, 1))}
              className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous Hint</span>
            </button>
          ) : <div />}

          {canShowNextHint && (
            <button
              onClick={() => setCurrentHintLevel(prev => Math.min(prev + 1, 3))}
              className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700 transition-colors ml-auto"
            >
              <span>Next Hint</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {currentHintLevel === 3 && hint.relatedConcepts && (
          <div className="bg-purple-50 p-3 rounded">
            <h3 className="font-medium text-purple-800 mb-1">Related Concepts:</h3>
            <p className="text-purple-700">{hint.relatedConcepts}</p>
          </div>
        )}
      </div>
    </div>
  );
}
