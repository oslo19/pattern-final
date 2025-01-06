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
                - Growth patterns`;
                break;
            case 'symbolic':
                typeSpecificPrompt = `This is a mathematical/symbolic pattern: ${pattern.sequence}
                For symbolic patterns, focus on:
                - Mathematical operations
                - Variable relationships
                - Power/exponent patterns
                Use LaTeX notation in the response.`;
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
            ${pattern.type === 'symbolic' ? 'Use LaTeX notation wrapped in \\( \\) for mathematical expressions.' : ''}
            Format: Just provide the basic hint in 1-2 sentences.`,

            // Hint Level 2 - Pattern Analysis
            `${typeSpecificPrompt}
            Provide a detailed hint that:
            - Breaks down the pattern structure
            - Highlights key relationships
            - Suggests a solution approach
            ${pattern.type === 'symbolic' ? 'Use LaTeX notation wrapped in \\( \\) for mathematical expressions.' : ''}
            Format: Provide a structured hint with pattern analysis.`,

            // Hint Level 3 - Comprehensive Guide
            `${typeSpecificPrompt}
            Provide a comprehensive hint that:
            - Gives step-by-step guidance
            - Explains the pattern logic
            - Shows how to verify the pattern
            ${pattern.type === 'symbolic' ? 'Use LaTeX notation wrapped in \\( \\) for mathematical expressions.' : ''}
            Format: Provide a detailed explanation with steps to solve.`
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
                            content: "You are a mathematics tutor providing hints. For symbolic/mathematical patterns, use LaTeX notation wrapped in \\( \\) for all mathematical expressions."
                        },
                        {
                            role: "user",
                            content: prompt
                        }
                    ],
                    temperature: 0.7,
                    max_tokens: 300
                },
                {
                    headers: {
                        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
                    }
                }
            );
            return response.data.choices[0].message.content.trim();
        }));

        const responseData = {
            hint: responses[0],
            reasoning: responses[1],
            tips: responses[2].split('\n'),
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
