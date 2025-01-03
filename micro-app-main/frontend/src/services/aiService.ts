import { Pattern, PatternType, DifficultyLevel, GeneratePatternOptions } from '../types';
import { generateAIHint } from '../utils/aiHelper';

const API_URL = import.meta.env.VITE_API_URL;

export const generatePattern = async (options: GeneratePatternOptions = {}): Promise<Pattern> => {
    let timeoutId: NodeJS.Timeout;
    try {
        const controller = new AbortController();
        timeoutId = setTimeout(() => {
            controller.abort();
            console.log('Request timed out after 60 seconds');
        }, 60000);

        console.log('Generating pattern with options:', options);
        
        const response = await fetch(`${API_URL}/patterns/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(options),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            console.error('Server response not OK:', response.status);
            throw new Error(`Server responded with ${response.status}`);
        }

        const data = await response.json();
        console.log('Pattern generated successfully:', data);
        return data;
    } catch (error) {
        console.error('Pattern generation error:', error);
        return {
            sequence: '△, △□, △□■, ?',
            answer: '△□■○',
            type: 'shape',
            difficulty: options.difficulty || 'medium',
            hint: 'Look at how shapes are added',
            explanation: 'Each term adds a new shape while keeping previous shapes'
        };
    } finally {
        clearTimeout(timeoutId);
    }
};

export const getAIHint = async (pattern: Pattern, userAttempts: number) => {
    try {
        console.log('Requesting hints for pattern:', pattern);
        const response = await fetch(`${API_URL}/ai/get-hint`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ pattern, userAttempts }),
        });

        if (!response.ok) {
            throw new Error('Failed to get hint');
        }

        const data = await response.json();
        console.log('Received hints from API:', data);

        return {
            hint: data.hint,
            reasoning: data.reasoning,
            tips: data.tips,
            confidence: data.confidence,
            relatedConcepts: data.relatedConcepts
        };
    } catch (error) {
        console.error('Error getting AI hint:', error);
        return {
            hint: "Look for patterns in how the values change.",
            reasoning: "Try calculating the differences between consecutive terms.",
            tips: [
                "1. Calculate differences between terms",
                "2. Look for patterns in these differences",
                "3. Apply the pattern to find the next term"
            ],
            confidence: 0.7,
            relatedConcepts: "Pattern recognition, sequences"
        };
    }
};

export const resetPatterns = async (): Promise<void> => {
    try {
        const response = await fetch(`${API_URL}/patterns/reset`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (!response.ok) {
            throw new Error('Failed to reset patterns');
        }

        console.log('Successfully reset pattern database');
    } catch (error) {
        console.error('Error resetting patterns:', error);
        throw error;
    }
};

function getRandomDifficulty(): DifficultyLevel {
    const difficulties: DifficultyLevel[] = ['easy', 'medium', 'hard'];
    return difficulties[Math.floor(Math.random() * difficulties.length)];
}

function getRandomType(): PatternType {
    const types: PatternType[] = ['numeric', 'symbolic', 'shape', 'logical'];
    return types[Math.floor(Math.random() * types.length)];
}
