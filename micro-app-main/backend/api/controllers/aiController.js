const axios = require('axios');

const wrapMathInLatex = (text) => {
    if (!text) return text;
    
    // Function to wrap individual math expressions
    const wrapExpression = (expr) => `\\(${expr}\\)`;
    
    return text
        // Replace fractions with division
        .replace(/(\d+)\/(\d+)/g, wrapExpression('\\frac{$1}{$2}'))
        
        // Replace powers and exponents
        .replace(/(\d+|\w+)\^(-?\d+)/g, wrapExpression('$1^{$2}'))
        
        // Replace terms like 2x, 6x^2
        .replace(/(\d*[a-z])(?:\^?\{?(\d+)\}?)?/g, (match, base, exp) => 
            wrapExpression(exp ? `${base}^{${exp}}` : base))
        
        // Replace operations between terms
        .replace(/(\\\(\w+(?:\^{\d+})?)\s*([+\-*/])\s*(\w+(?:\^{\d+})?\\\))/g, 
            (_, term1, op, term2) => `\\(${term1.slice(2, -2)} ${op} ${term2.slice(2, -2)}\\)`)
        
        // Replace standalone numbers in mathematical context
        .replace(/(?<=\d)\s*([+\-*/])\s*(?=\d)/g, ' $1 ')
        
        // Replace summations and other LaTeX commands
        .replace(/(\\sum|\\frac|\\int)(?![^\{]*\\\))/g, wrapExpression('$1'))
        
        // Replace expressions with equals signs
        .replace(/(\w+(?:\^{\d+})?)\s*=\s*(\w+(?:\^{\d+})?)/g, 
            (_, left, right) => wrapExpression(`${left} = ${right}`));
};

const getHint = async (req, res) => {
    try {
        const { pattern, userAttempts } = req.body;
        
        const hintPrompts = [
            `Provide a basic hint for this ${pattern.type} pattern: ${pattern.sequence}. 
             Format ALL mathematical expressions using LaTeX notation, including simple terms like x or 2x.`,
            
            `Provide a detailed hint for this ${pattern.type} pattern: ${pattern.sequence}. 
             Format ALL mathematical expressions using LaTeX notation, including variables, powers, and operations.`,
            
            `Provide a comprehensive step-by-step analysis for this ${pattern.type} pattern: ${pattern.sequence}. 
             Format ALL mathematical expressions using LaTeX notation, including every mathematical term and operation.`
        ];

        console.log('Generating hints...');
        const responses = await Promise.all(hintPrompts.map(async (prompt, index) => {
            const response = await axios.post(
                'https://api.openai.com/v1/chat/completions',
                {
                    model: "gpt-4-turbo-preview",
                    messages: [
                        {
                            role: "system",
                            content: "You are a math tutor. Format ALL mathematical expressions using LaTeX notation, wrapping them in \\( and \\). Even simple terms like x should be formatted as \\(x\\)."
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
            
            let content = response.data.choices[0].message.content.trim();
            content = wrapMathInLatex(content);
            console.log(`Processed hint level ${index + 1}:`, content);
            return content;
        }));

        const responseData = {
            hint: responses[0],
            reasoning: responses[1],
            tips: responses[2].split('\n').map(line => wrapMathInLatex(line)),
            confidence: 0.9,
            relatedConcepts: wrapMathInLatex(`This pattern involves ${
                pattern.type === 'symbolic' ? 'mathematical notation with variables like x^n and operations' :
                pattern.type === 'numeric' ? 'arithmetic sequences and differences' :
                'pattern recognition'
            }`)
        };

        console.log('Sending formatted response:', responseData);
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
