const axios = require('axios');

const getHint = async (req, res) => {
    try {
        const { pattern, userAttempts } = req.body;
        console.log('Received pattern for hint generation:', pattern);
        
        // Determine pattern type and format prompt accordingly
        let typeSpecificPrompt = '';
        switch (pattern.type) {
            case 'numeric':
                typeSpecificPrompt = `This is a numeric pattern: ${pattern.sequence}
                For numeric patterns, focus on:
                - Arithmetic operations
                - Differences between terms
                - Growth patterns
                
                IMPORTANT: All mathematical expressions must be wrapped in LaTeX delimiters:
                - Use \\( \\) for inline math
                - Use \\[ \\] for display math
                - For fractions, always use \\frac{numerator}{denominator}
                
                Example format:
                - For inline: The difference is \\( 5 + 3 = 8 \\)
                - For display: \\[ x_{n+1} = x_n + d \\]
                - For fractions: \\( \\frac{1}{2} \\) or \\[ \\frac{a+b}{c+d} \\]`;
                break;
            case 'symbolic':
                typeSpecificPrompt = `This is a mathematical/symbolic pattern: ${pattern.sequence}
                For symbolic patterns, focus on:
                - Mathematical operations
                - Variable relationships
                - Power/exponent patterns
                
                IMPORTANT: All mathematical expressions must be wrapped in LaTeX delimiters:
                - Use \\( \\) for inline math
                - Use \\[ \\] for display math
                - For fractions, always use \\frac{numerator}{denominator}
                
                Example format:
                - For inline: The next term is \\( x^{n+1} \\)
                - For display: \\[ \\frac{d}{dx}(x^n) = nx^{n-1} \\]
                - For fractions: \\( \\frac{x+1}{x-1} \\)`;
                break;
            case 'shape':
                typeSpecificPrompt = `This is a shape pattern: ${pattern.sequence}
                For shape patterns, focus on:
                - Shape transformations
                - Addition/removal of shapes
                - Position changes`;
                break;
            case 'logical':
                typeSpecificPrompt = `This is a logical pattern: ${pattern.sequence}
                For logical patterns, focus on:
                - Relationships between terms
                - Sequential rules
                - Pattern categories`;
                break;
        }

        // Generate prompts for all three hint levels
        const hintPrompts = [
            // Hint Level 1 - Basic Observation
            `${typeSpecificPrompt}
            Provide a basic hint that:
            - Points out obvious patterns
            - Guides initial observations
            - Keeps it simple and encouraging
            Format: Just provide the basic hint in 1-2 sentences.
            IMPORTANT: Wrap all mathematical expressions in LaTeX delimiters and use proper \\frac notation for fractions.`,

            // Hint Level 2 - Pattern Analysis
            `${typeSpecificPrompt}
            Provide a detailed hint that:
            - Breaks down the pattern structure
            - Highlights key relationships
            - Suggests a solution approach
            Format: Provide a structured hint with pattern analysis.
            IMPORTANT: 
            - Wrap all mathematical expressions in LaTeX delimiters
            - Use proper \\frac notation for all fractions
            - For inline fractions use: \\( \\frac{a}{b} \\)
            - For display fractions use: \\[ \\frac{a}{b} \\]
            
            For numeric patterns, use this format:
            Step 1: Calculate differences
            \\[ d_1 = term_2 - term_1 = value \\]
            
            For symbolic patterns, use this format:
            Step 1: Analyze terms
            \\[ term_n = expression \\]`,

            // Hint Level 3 - Comprehensive Guide
            `${typeSpecificPrompt}
            Provide a comprehensive hint that:
            - Gives step-by-step guidance
            - Explains the pattern logic
            - Shows how to verify the pattern
            Format: Provide a detailed explanation with steps to solve.
            IMPORTANT: 
            - Wrap all mathematical expressions in LaTeX delimiters
            - Use proper \\frac notation for all fractions
            - For inline fractions use: \\( \\frac{a}{b} \\)
            - For display fractions use: \\[ \\frac{a}{b} \\]
            
            For numeric patterns, use this format:
            1. First difference: \\[ d_1 = term_2 - term_1 = value \\]
            2. Pattern rule: \\[ term_{n+1} = term_n + expression \\]
            
            For symbolic patterns, use this format:
            1. Term analysis: \\[ term_n = expression \\]
            2. Pattern rule: \\[ next\\_term = expression \\]`
        ];

        console.log('Generating hints for all levels...');
        const responses = await Promise.all(hintPrompts.map(async (prompt, index) => {
            console.log(`Generating hint level ${index + 1}...`);
            const response = await axios.post(
                'https://api.openai.com/v1/chat/completions',
                {
                    model: "gpt-4-turbo-preview",
                    messages: [
                        {
                            role: "system",
                            content: "You are a mathematics tutor providing hints. Always wrap mathematical expressions in LaTeX delimiters: \\( \\) for inline math and \\[ \\] for display math. For fractions, always use proper \\frac{numerator}{denominator} notation."
                        },
                        {
                            role: "user",
                            content: prompt
                        }
                    ],
                    temperature: 0.7,
                    max_tokens: 500
                },
                {
                    headers: {
                        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
                    }
                }
            );
            return response.data.choices[0].message.content.trim();
        }));

        // Process responses to ensure proper LaTeX formatting
        const processedResponses = responses.map(response => {
            // Replace any unformatted mathematical expressions with LaTeX formatting
            return response
                // Format inline math expressions
                .replace(/(\d+[\s]*[-+*/=][\s]*\d+)/g, '\\($1\\)')
                // Format display math expressions
                .replace(/(\d+[\s]*[-+*/=][\s]*\d+\s*=\s*\d+)/g, '\\[$1\\]')
                // Format variable expressions
                .replace(/([a-z]_[a-z+\d]|[a-z]\^[a-z+\d])/g, '\\($1\\)')
                // Format fractions like a/b that aren't already in \frac format
                .replace(/(\d+)\/(\d+)(?![}\)])/g, '\\(\\frac{$1}{$2}\\)')
                // Format inline fractions that are already in \frac format but missing delimiters
                .replace(/\\frac{([^}]+)}{([^}]+)}(?![}\)])/g, '\\(\\frac{$1}{$2}\\)')
                // Ensure display math fractions have proper delimiters
                .replace(/\\frac{([^}]+)}{([^}]+)}\s*=\s*[^\\]*/g, '\\[\\frac{$1}{$2}\\]');
        });

        const responseData = {
            hint: processedResponses[0],
            reasoning: processedResponses[1],
            tips: processedResponses[2].split('\n'),
            confidence: 0.9,
            relatedConcepts: `Pattern type: ${pattern.type}. ${
                pattern.type === 'numeric' ? 'Involves arithmetic sequences and differences.' :
                pattern.type === 'symbolic' ? 'Involves mathematical notation and operations.' :
                pattern.type === 'shape' ? 'Involves geometric progressions and spatial patterns.' :
                'Involves logical relationships and pattern recognition.'
            }`
        };

        console.log('Sending response:', responseData);
        res.json(responseData);

    } catch (error) {
        console.error('Error generating hints:', error);
        res.status(500).json({ 
            error: 'Error generating hints',
            details: error.message
        });
    }
};

module.exports = {
    getHint
}; 
