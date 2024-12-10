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
function generateMockResponse(tone: string, suggestion: string, emailThread: string): string {
  const tones: {[key: string]: string} = {
    'professional': 'Here is a carefully crafted, professional response:',
    'friendly': 'Hey there! Here\'s a warm and friendly reply:',
    'formal': 'Dear Recipient, please find a formal response below:',
    'casual': 'What\'s up! Here\'s a laid-back response:'
  };

  return `${tones[tone] || tones['professional']}

Based on the context of "${suggestion}" and the email thread, here's a suggested response:

Thank you for your email. I appreciate the details you've shared and will follow up accordingly.

Best regards,
[Your Name]`;
}

export async function generateEmailResponse(
  emailThread: string,
  suggestion: string,
  tone: string,
  apiKey?: string,
  model: string = "llama-3.3-70b-versatile"
): Promise<string> {
  // Validate inputs
  const sanitizedEmailThread = validateInput(emailThread);
  const sanitizedSuggestion = validateInput(suggestion);
  const sanitizedTone = validateInput(tone, 50);

  // Validate tone
  const validTones = ['professional', 'friendly', 'formal', 'casual'];
  if (!validTones.includes(sanitizedTone.toLowerCase())) {
    throw new ApiError('Invalid tone selected', 400, 'INVALID_TONE');
  }

  // Check if we're in a development environment or lack a real API key
  const isDevelopment = import.meta.env.DEV;
  const effectiveApiKey = apiKey || import.meta.env.VITE_GROQ_API_KEY;

  if (isDevelopment || !effectiveApiKey) {
    console.warn('Using mock API response due to development mode or missing API key');
    return generateMockResponse(sanitizedTone, sanitizedSuggestion, sanitizedEmailThread);
  }

  try {
    const groq = new Groq({
      apiKey: effectiveApiKey,
      dangerouslyAllowBrowser: true // Use with extreme caution
    });

    const prompt = `Please generate an email response with a ${sanitizedTone} tone.
Context: ${sanitizedSuggestion}
Original email thread:
${sanitizedEmailThread}`;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      model: model,
      temperature: 0.7,
      max_tokens: 4000,
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
    return generateMockResponse(sanitizedTone, sanitizedSuggestion, sanitizedEmailThread);
  }
}