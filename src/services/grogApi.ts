import Groq from "groq-sdk";
import sanitizeHtml from 'sanitize-html';

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public type?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Sanitize and validate input
function validateInput(input: string, maxLength: number = 1000): string {
  if (!input) return '';
  
  // Remove potentially dangerous HTML and scripts
  const sanitized = sanitizeHtml(input, {
    allowedTags: [],
    allowedAttributes: {},
  });

  // Truncate to prevent extremely long inputs
  return sanitized.slice(0, maxLength);
}

// Mock response generator for development
function generateMockResponse(tone: string, suggestion: string): string {
  const tones: {[key: string]: string} = {
    'professional': 'Here is a carefully crafted, professional response:',
    'friendly': 'Hey there! Here\'s a warm and friendly reply:',
    'formal': 'Dear Recipient, please find a formal response below:',
    'casual': 'What\'s up! Here\'s a laid-back response:'
  };

  return `${tones[tone] || tones['professional']}

Based on the context of "${suggestion}", here's a suggested response:

Thank you for your message. I appreciate you reaching out. I'll be happy to help with your request.

Best regards,
[Your name]`;
}

export async function generateEmailResponse(
  emailThread: string,
  suggestion: string,
  tone: string,
  apiKey?: string,
  model: string = "llama-3.3-70b-versatile"
): Promise<string> {
  // Validate inputs
  const sanitizedEmailThread = validateInput(emailThread, 10000);
  const sanitizedSuggestion = validateInput(suggestion, 5000);
  const sanitizedTone = validateInput(tone, 50);

  // Validate tone
  const validTones = [
    'apologetic', 'assertive', 'casual', 'conciliatory', 'direct',
    'empathetic', 'encouraging', 'formal', 'friendly', 'humorous',
    'informative', 'inspirational', 'motivational', 'neutral',
    'optimistic', 'professional', 'persuasive', 'respectful',
    'serious', 'sincere', 'sympathetic', 'technical', 'warm'
  ];
  if (!validTones.includes(sanitizedTone.toLowerCase())) {
    throw new ApiError('Invalid tone selected', 400, 'INVALID_TONE');
  }

  // Check if we're in a development environment or lack a real API key
  const isDevelopment = import.meta.env.DEV;
  const effectiveApiKey = apiKey || import.meta.env.VITE_GROQ_API_KEY;

  if (isDevelopment || !effectiveApiKey) {
    console.warn('Using mock API response due to development mode or missing API key');
    return generateMockResponse(sanitizedTone, sanitizedSuggestion);
  }

  try {
    const groq = new Groq({
      apiKey: effectiveApiKey,
      dangerouslyAllowBrowser: true // Use with extreme caution
    });

    const prompt = `Please generate an email response with a ${sanitizedTone} tone.
Context: ${sanitizedSuggestion}
Original email thread:
${sanitizedEmailThread}
ONLY OUTPUT THE REWRITTEN RESPONSE.
DO NOT INCLUDE THE SUBJECT LINE.`;

    console.log('Current Model for Email Generation:', model);
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      model: model,
      temperature: 0.7,
      max_tokens: 10000,
    });

    if (!completion.choices?.[0]?.message?.content) {
      throw new ApiError('No response generated', 500, 'EMPTY_RESPONSE');
    }

    // Sanitize the generated response
    return sanitizeHtml(completion.choices[0].message.content, {
      allowedTags: ['p', 'br', 'b', 'i', 'ul', 'ol', 'li'],
    });
  } catch (error: any) {
    console.warn('API Error:', error.message);

    // Fallback to mock response if API call fails
    return generateMockResponse(sanitizedTone, sanitizedSuggestion);
  }
}

export type LengthAction = 'shorten' | 'lengthen';

export async function adjustResponseLength(
  currentResponse: string,
  lengthAction: LengthAction,
  apiKey: string,
  model: string = "llama-3.3-70b-versatile"
): Promise<string> {
  const sanitizedResponse = validateInput(currentResponse, 10000);
  
  try {
    const groq = new Groq({
      apiKey,
      dangerouslyAllowBrowser: true
    });

    const actionText = lengthAction === 'shorten' ? 'shorter' : 'longer';
    const prompt = `Please rewrite the following email response to make it ${actionText}, while maintaining the same tone and context. ONLY OUTPUT THE REWRITTEN RESPONSE. DO NOT INCLUDE THE SUBJECT LINE. Keep the essential information but ${lengthAction === 'shorten' ? 'be more concise' : 'add more detail and elaboration'}:\n\n${sanitizedResponse}`;

    console.log('Current Model for Length Adjustment:', model);
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      model: model,
      temperature: 0.7,
      max_tokens: 10000,
    });

    if (!completion.choices?.[0]?.message?.content) {
      throw new ApiError('No response generated', 500, 'EMPTY_RESPONSE');
    }

    return sanitizeHtml(completion.choices[0].message.content, {
      allowedTags: ['p', 'br', 'b', 'i', 'ul', 'ol', 'li'],
    });
  } catch (error: any) {
    console.error('Length adjustment error:', error);
    throw new ApiError(
      'Failed to adjust response length. Please try again.',
      error.statusCode || 500,
      'LENGTH_ADJUSTMENT_ERROR'
    );
  }
}
