import Groq from "groq-sdk";
import sanitizeHtml from 'sanitize-html';

// Logging utility
function log(component: string, action: string, details?: any) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${component}] ${action}`, details ? details : '');
}

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

const systemMessage = `You are a world-class email response generator with a deep understanding of professional communication, emotional intelligence, and contextual nuance. Your primary objective is to produce a single, coherent, and contextually aligned email reply that meets the following criteria:

1. **Role & Quality**: 
   - Act as an expert email writer who can adapt to any professional scenario.
   - Produce a polished, well-structured, and logically flowing email response.

2. **Tone & Style**: 
   - Adhere strictly to the tone provided by the user.
   - If the sender expresses frustration or concern, acknowledge and respond empathetically.
   - Maintain consistency of tone throughout the email, ensuring it matches the purpose and sentiment of the situation.

3. **Context & Content**:
   - Carefully incorporate the user's provided context into the response. Address any concerns, requests, or questions from the original email thread.
   - Provide actionable information, clear guidance, and helpful next steps as needed.
   - Align the final message with the user's suggestion, ensuring the response adds value and relevance.

4. **Clarity & Professionalism**:
   - Use concise, direct language, avoiding unnecessary jargon unless contextually appropriate.
   - Keep the message organized: acknowledge key points, respond to issues raised, and conclude positively.
   - The response should be free of defensive or dismissive language. Emphasize understanding and constructive support.

5. **Output Format**:
   - DO NOT include a subject line in the final output.
   - ONLY output the final rewritten email response. Do not include these instructions or any additional commentary.
   - The final output should stand on its own as a fully-formed, contextually appropriate reply.
   - The final output should follow the 3 Bs of email communication:
   -- Be Clear:  
   Write with clarity to ensure your message is easy to understand. Avoid ambiguity, jargon, or overly complex language. Clear emails save time and reduce back-and-forth communication.
   -- Be Concise:  
   Keep your emails short and to the point. Respect the recipient's time by including only necessary information and using bullet points or numbered lists for easier readability.
   -- Be Courteous:  
   Maintain a polite and respectful tone, regardless of the situation. Courtesy fosters positive communication, builds rapport, and helps achieve your desired outcomes effectively.

You will receive a user message containing:
- A specific tone to use.
- Suggestion context.
- The original email thread.

Using all of the above guidelines, produce the best possible email response.`;

const sentimentAnalysisPrompt = `You are a communication analysis assistant. Analyze the following email thread and provide a structured output in the exact format below. Ensure all placeholders are replaced with the correct values and no extra commentary is included.

sentiment score: [number between -100 and +100]
predominant tone is [tone description]
urgency level: [low/medium/high]
sender's intent is [short intent description]
Primary emotions include [comma-separated emotions]
suggested tone is [recommended tone]
Key phrases to include are [comma-separated phrases]
Phrases to avoid are [comma-separated phrases]

[Insert Email Thread Here]
`;

// Add utility function to format sentiment analysis
function formatSentimentAnalysis(analysis: string): string {
  try {
    // Extract key information using regex
    const scoreMatch = analysis.match(/sentiment score.*?([+-]\d+)/i);
    const toneMatch = analysis.match(/predominant tone is ([^,.]+)/i);
    const urgencyMatch = analysis.match(/urgency level.*?(low|medium|high)/i);
    const intentMatch = analysis.match(/sender's intent is ([^,.]+)/i);
    const emotionsMatch = analysis.match(/Primary emotions.*?include ([^.]+)/i);
    const recommendedToneMatch = analysis.match(/suggested tone is ([^,.]+)/i);
    const phrasesToIncludeMatch = analysis.match(/Key phrases to include are ([^.]+)/i);
    const phrasesToAvoidMatch = analysis.match(/Phrases to avoid are ([^.]+)/i);

    // Build formatted output
    return `📊 **Sentiment Overview**
• Score: ${scoreMatch?.[1] || 'N/A'}
• Tone: ${toneMatch?.[1]?.trim() || 'N/A'}
• Urgency: ${urgencyMatch?.[1]?.toUpperCase() || 'N/A'}

🎯 **Key Points**
• Intent: ${intentMatch?.[1]?.trim() || 'N/A'}
• Emotions: ${emotionsMatch?.[1]?.trim() || 'N/A'}

💡 **Recommendations**
• Reply Tone: ${recommendedToneMatch?.[1]?.trim() || 'N/A'}
• Include: ${phrasesToIncludeMatch?.[1]?.trim() || 'N/A'}
• Avoid: ${phrasesToAvoidMatch?.[1]?.trim() || 'N/A'}`;
  } catch (error) {
    log('formatSentimentAnalysis', 'Error formatting analysis', { error });
    // Return original analysis if formatting fails
    return analysis;
  }
}

// Improved token estimation using character classes
function estimateTokens(text: string): number {
  // Count different types of tokens
  const words = text.split(/\s+/).length;
  const numbers = (text.match(/\d+/g) || []).length;
  const specialChars = (text.match(/[^a-zA-Z0-9\s]/g) || []).length;
  
  // Apply weighted calculation
  return Math.ceil(words * 1.3 + numbers * 0.5 + specialChars * 0.5);
}

// Enhanced cache key generation
function generateCacheKey(text: string): string {
  // Normalize text by removing extra spaces and converting to lowercase
  const normalized = text.toLowerCase().replace(/\s+/g, ' ').trim();
  // Create a hash of the normalized text
  return `sentiment_${hashString(normalized)}`;
}

// Simple string hashing function
function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(36);
}

// Enhanced TokenBucket with sliding window
class TokenBucket {
  private tokenUsage: TokenUsage[] = [];
  private readonly windowMs = 60000; // 1 minute
  private readonly maxTokens = 6000; // 6k tokens per minute
  private requestQueue: Array<() => Promise<void>> = [];
  private isProcessingQueue = false;

  constructor() {
    // Load persisted token usage
    this.loadPersistedUsage();
    // Start periodic cleanup
    setInterval(() => this.cleanup(), 5000);
  }

  private loadPersistedUsage() {
    try {
      const saved = localStorage.getItem('tokenUsage');
      if (saved) {
        const parsed = JSON.parse(saved);
        this.tokenUsage = parsed.filter((usage: TokenUsage) => 
          Date.now() - usage.timestamp < this.windowMs
        );
      }
    } catch (error) {
      log('TokenBucket', 'Error loading persisted usage', { error });
    }
  }

  private persistUsage() {
    try {
      localStorage.setItem('tokenUsage', JSON.stringify(this.tokenUsage));
    } catch (error) {
      log('TokenBucket', 'Error persisting usage', { error });
    }
  }

  private cleanup() {
    const now = Date.now();
    const beforeCount = this.tokenUsage.length;
    this.tokenUsage = this.tokenUsage.filter(
      usage => now - usage.timestamp < this.windowMs
    );
    const afterCount = this.tokenUsage.length;
    
    if (beforeCount !== afterCount) {
      log('TokenBucket', 'Cleanup', {
        removed: beforeCount - afterCount,
        remaining: afterCount
      });
      this.persistUsage();
      this.processQueue();
    }
  }

  private getCurrentUsage(): number {
    this.cleanup();
    return this.tokenUsage.reduce((sum, usage) => sum + usage.tokens, 0);
  }

  private async processQueue() {
    if (this.isProcessingQueue || this.requestQueue.length === 0) return;
    
    this.isProcessingQueue = true;
    while (this.requestQueue.length > 0) {
      const request = this.requestQueue[0];
      try {
        await request();
        this.requestQueue.shift();
      } catch (error) {
        if (error instanceof ApiError && error.type === ApiErrorType.RATE_LIMIT) {
          // Wait before trying again
          await delay(1000);
          continue;
        }
        // For other errors, remove from queue and continue
        this.requestQueue.shift();
      }
    }
    this.isProcessingQueue = false;
  }

  async checkAndAddTokens(tokens: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = async () => {
        const currentUsage = this.getCurrentUsage();
        if (currentUsage + tokens > this.maxTokens) {
          throw new ApiError(
            'Rate limit exceeded',
            429,
            ApiErrorType.RATE_LIMIT
          );
        }
        this.tokenUsage.push({ timestamp: Date.now(), tokens });
        this.persistUsage();
        resolve();
      };

      this.requestQueue.push(request);
      this.processQueue().catch(reject);
    });
  }
}

const tokenBucket = new TokenBucket();

// Token tracking
interface TokenUsage {
  timestamp: number;
  tokens: number;
}

// Token buffers
const TOKEN_BUFFERS = {
  SYSTEM_MESSAGE: 500,
  RESPONSE: 800,
  SAFETY_MARGIN: 200
} as const;

// API Configuration
interface ApiConfig {
  retryDelay: number;
  maxRetries: number;
  maxTokens: number;
  defaultModel: string;
}

const API_CONFIG: ApiConfig = {
  retryDelay: 1000,
  maxRetries: 3,
  maxTokens: 10000,
  defaultModel: "llama-3.3-70b-versatile"
} as const;

// Error types
export enum ApiErrorType {
  RATE_LIMIT = 'RATE_LIMIT_ERROR',
  EMPTY_RESPONSE = 'EMPTY_RESPONSE',
  INVALID_TONE = 'INVALID_TONE',
  SENTIMENT_ANALYSIS = 'SENTIMENT_ANALYSIS_ERROR',
  LENGTH_ADJUSTMENT = 'LENGTH_ADJUSTMENT_ERROR'
}

// Utility function to delay execution
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Enhanced API request wrapper with better typing
async function makeApiRequest<T>(
  apiCall: () => Promise<T>,
  errorType: ApiErrorType,
  retryCount = 0
): Promise<T> {
  try {
    return await apiCall();
  } catch (error: any) {
    if (error?.statusCode === 429 && retryCount < API_CONFIG.maxRetries) {
      await delay(API_CONFIG.retryDelay * (retryCount + 1));
      log('makeApiRequest', 'Retrying API request', {
        retryCount,
        delay: API_CONFIG.retryDelay * (retryCount + 1)
      });
      return makeApiRequest(apiCall, errorType, retryCount + 1);
    }
    
    if (error?.statusCode === 429) {
      log('makeApiRequest', 'Rate limit exceeded', {
        retryCount,
        maxRetries: API_CONFIG.maxRetries
      });
      throw new ApiError(
        'Rate limit exceeded. Please try again in a few moments.',
        429,
        ApiErrorType.RATE_LIMIT
      );
    }
    
    log('makeApiRequest', 'Error', {
      type: error.type,
      message: error.message,
      statusCode: error.statusCode
    });
    
    throw new ApiError(
      error.message || 'An error occurred during the API request',
      error.statusCode || 500,
      errorType
    );
  }
}

export const analyzeSentiment = async (
  emailThread: string,
  apiKey?: string,
  model: string = API_CONFIG.defaultModel
): Promise<string> => {
  log('analyzeSentiment', 'Starting analysis');
  
  const sanitizedEmailThread = validateInput(emailThread, 6000);
  log('analyzeSentiment', 'Input sanitized', {
    originalLength: emailThread.length,
    sanitizedLength: sanitizedEmailThread.length
  });
  
  const isDevelopment = import.meta.env.DEV;
  const effectiveApiKey = apiKey || import.meta.env.VITE_GROQ_API_KEY;

  if (isDevelopment || !effectiveApiKey) {
    log('analyzeSentiment', 'Using mock response (development mode)');
    return formatSentimentAnalysis(`
      The overall sentiment score is +50. The predominant tone is professional.
      The sender's intent is to request information. Urgency level is medium.
      Primary emotions include curiosity and interest.
      The suggested tone is friendly and professional.
      Key phrases to include are acknowledgments and clear explanations.
      Phrases to avoid are technical jargon and dismissive language.
    `);
  }

  // Check cache first
  const cacheKey = generateCacheKey(sanitizedEmailThread);
  const cachedAnalysis = localStorage.getItem(cacheKey);
  if (cachedAnalysis) {
    log('analyzeSentiment', 'Cache hit', { cacheKey });
    return formatSentimentAnalysis(cachedAnalysis);
  }
  log('analyzeSentiment', 'Cache miss', { cacheKey });

  try {
    // More conservative token estimation
    const estimatedTokens = 
      estimateTokens(sanitizedEmailThread) +
      estimateTokens(sentimentAnalysisPrompt) +
      TOKEN_BUFFERS.SYSTEM_MESSAGE +
      TOKEN_BUFFERS.RESPONSE;

    log('analyzeSentiment', 'Token estimation', {
      emailThreadTokens: estimateTokens(sanitizedEmailThread),
      promptTokens: estimateTokens(sentimentAnalysisPrompt),
      systemBuffer: TOKEN_BUFFERS.SYSTEM_MESSAGE,
      responseBuffer: TOKEN_BUFFERS.RESPONSE,
      total: estimatedTokens
    });

    await tokenBucket.checkAndAddTokens(estimatedTokens);
    log('analyzeSentiment', 'Token check passed');

    const groq = new Groq({
      apiKey: effectiveApiKey,
      dangerouslyAllowBrowser: true
    });

    const prompt = sentimentAnalysisPrompt.replace('[Insert Email Thread Here]', sanitizedEmailThread);
    log('analyzeSentiment', 'Making API request');

    const completion = await makeApiRequest(
      () => groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: "You are an advanced communication intelligence assistant specializing in email sentiment analysis.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        model: model,
        max_tokens: API_CONFIG.maxTokens,
      }),
      ApiErrorType.SENTIMENT_ANALYSIS
    );

    log('analyzeSentiment', 'API request completed');

    if (!completion.choices?.[0]?.message?.content) {
      log('analyzeSentiment', 'Empty response from API');
      throw new ApiError(
        'No sentiment analysis generated',
        500,
        ApiErrorType.EMPTY_RESPONSE
      );
    }

    const analysis = completion.choices[0].message.content;
    localStorage.setItem(cacheKey, analysis);
    log('analyzeSentiment', 'Analysis cached', {
      analysisLength: analysis.length
    });
    
    return formatSentimentAnalysis(analysis);
  } catch (error: any) {
    log('analyzeSentiment', 'Error', {
      type: error.type,
      message: error.message,
      statusCode: error.statusCode
    });
    
    if (error.type === ApiErrorType.RATE_LIMIT) {
      throw error;
    }
    throw new ApiError(
      'Failed to analyze sentiment. Please try again.',
      error.statusCode || 500,
      ApiErrorType.SENTIMENT_ANALYSIS
    );
  }
};

export async function generateEmailResponse(
  emailThread: string,
  suggestion: string,
  tone: string,
  apiKey?: string,
  model: string = API_CONFIG.defaultModel
): Promise<string> {
  log('generateEmailResponse', 'Starting generation', {
    toneRequested: tone,
    threadLength: emailThread.length,
    suggestionLength: suggestion.length
  });

  // Reduce max lengths
  const sanitizedEmailThread = validateInput(emailThread, 6000); // Reduced from 10000
  const sanitizedSuggestion = validateInput(suggestion, 2000); // Reduced from 5000
  const sanitizedTone = validateInput(tone, 50).toLowerCase();

  log('generateEmailResponse', 'Input sanitized', {
    threadLength: sanitizedEmailThread.length,
    suggestionLength: sanitizedSuggestion.length,
    tone: sanitizedTone
  });

  const validTones = [
    'apologetic', 'assertive', 'casual', 'conciliatory', 'direct',
    'empathetic', 'encouraging', 'formal', 'friendly', 'humorous',
    'informative', 'inspirational', 'motivational', 'neutral',
    'optimistic', 'professional', 'persuasive', 'respectful',
    'serious', 'sincere', 'sympathetic', 'technical', 'warm'
  ] as const;

  if (!validTones.includes(sanitizedTone as typeof validTones[number])) {
    log('generateEmailResponse', 'Invalid tone', { tone: sanitizedTone });
    throw new ApiError(
      'Invalid tone selected',
      400,
      ApiErrorType.INVALID_TONE
    );
  }

  const isDevelopment = import.meta.env.DEV;
  const effectiveApiKey = apiKey || import.meta.env.VITE_GROQ_API_KEY;

  if (isDevelopment || !effectiveApiKey) {
    log('generateEmailResponse', 'Using mock response (development mode)');
    return generateMockResponse(sanitizedTone, sanitizedSuggestion);
  }

  try {
    let sentimentAnalysis: string | null = null;
    try {
      // Try to get cached sentiment analysis first
      const cacheKey = generateCacheKey(sanitizedEmailThread);
      const cachedAnalysis = localStorage.getItem(cacheKey);
      if (cachedAnalysis) {
        log('generateEmailResponse', 'Using cached sentiment analysis');
        sentimentAnalysis = cachedAnalysis;
      }
      // Skip sentiment analysis if not cached to save tokens
      else {
        log('generateEmailResponse', 'Skipping sentiment analysis to save tokens');
        sentimentAnalysis = 'Sentiment analysis skipped to optimize token usage';
      }
    } catch (error) {
      log('generateEmailResponse', 'Sentiment analysis error', { error });
      sentimentAnalysis = 'Sentiment analysis unavailable';
    }

    // More conservative token estimation
    const estimatedTokens = 
      estimateTokens(sanitizedEmailThread) +
      estimateTokens(sentimentAnalysis || '') +
      estimateTokens(sanitizedSuggestion) +
      estimateTokens(systemMessage) +
      TOKEN_BUFFERS.SYSTEM_MESSAGE +
      TOKEN_BUFFERS.RESPONSE +
      TOKEN_BUFFERS.SAFETY_MARGIN;

    log('generateEmailResponse', 'Token estimation', {
      emailThreadTokens: estimateTokens(sanitizedEmailThread),
      sentimentTokens: estimateTokens(sentimentAnalysis || ''),
      suggestionTokens: estimateTokens(sanitizedSuggestion),
      systemTokens: estimateTokens(systemMessage),
      buffers: TOKEN_BUFFERS,
      total: estimatedTokens
    });

    await tokenBucket.checkAndAddTokens(estimatedTokens);
    log('generateEmailResponse', 'Token check passed');

    const groq = new Groq({
      apiKey: effectiveApiKey,
      dangerouslyAllowBrowser: true
    });

    const prompt = `Please generate an email response with a ${sanitizedTone} tone.
Context: ${sanitizedSuggestion}
Original email thread:
${sanitizedEmailThread}
Sentiment Analysis:
${sentimentAnalysis}
ONLY OUTPUT THE REWRITTEN RESPONSE.
DO NOT INCLUDE THE SUBJECT LINE.`;

    log('generateEmailResponse', 'Making API request');

    const completion = await makeApiRequest(
      () => groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: systemMessage,
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        model: model,
        max_tokens: API_CONFIG.maxTokens,
      }),
      ApiErrorType.SENTIMENT_ANALYSIS
    );

    log('generateEmailResponse', 'API request completed');

    if (!completion.choices?.[0]?.message?.content) {
      log('generateEmailResponse', 'Empty response from API');
      throw new ApiError(
        'No response generated',
        500,
        ApiErrorType.EMPTY_RESPONSE
      );
    }

    const response = sanitizeHtml(completion.choices[0].message.content, {
      allowedTags: ['p', 'br', 'b', 'i', 'ul', 'ol', 'li'],
    });

    log('generateEmailResponse', 'Response generated', {
      responseLength: response.length
    });

    return response;
  } catch (error: any) {
    log('generateEmailResponse', 'Error', {
      type: error.type,
      message: error.message,
      statusCode: error.statusCode
    });

    if (error.type === ApiErrorType.RATE_LIMIT) {
      throw error;
    }
    return generateMockResponse(sanitizedTone, sanitizedSuggestion);
  }
}

export type LengthAction = 'shorten' | 'lengthen';

export async function adjustResponseLength(
  currentResponse: string,
  lengthAction: LengthAction,
  apiKey: string,
  model: string = API_CONFIG.defaultModel
): Promise<string> {
  log('adjustResponseLength', 'Starting adjustment', {
    action: lengthAction,
    responseLength: currentResponse.length
  });
  
  const sanitizedResponse = validateInput(currentResponse, 10000);
  
  try {
    const groq = new Groq({
      apiKey,
      dangerouslyAllowBrowser: true
    });

    const actionText = lengthAction === 'shorten' ? 'shorter' : 'longer';
    const prompt = `Please rewrite the following email response to make it ${actionText}, while maintaining the same tone and context. ONLY OUTPUT THE REWRITTEN RESPONSE. DO NOT INCLUDE THE SUBJECT LINE. Keep the essential information but ${lengthAction === 'shorten' ? 'be more concise' : 'add more detail and elaboration'}:\n\n${sanitizedResponse}`;

    log('adjustResponseLength', 'Making API request');

    const completion = await makeApiRequest(
      () => groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: 'You are a helpful email response generator.',
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        model: model,
        max_tokens: API_CONFIG.maxTokens,
      }),
      ApiErrorType.LENGTH_ADJUSTMENT
    );

    log('adjustResponseLength', 'API request completed');

    if (!completion.choices?.[0]?.message?.content) {
      log('adjustResponseLength', 'Empty response from API');
      throw new ApiError(
        'No response generated',
        500,
        ApiErrorType.EMPTY_RESPONSE
      );
    }

    const adjustedResponse = sanitizeHtml(completion.choices[0].message.content, {
      allowedTags: ['p', 'br', 'b', 'i', 'ul', 'ol', 'li'],
    });

    log('adjustResponseLength', 'Response adjusted', {
      originalLength: currentResponse.length,
      adjustedLength: adjustedResponse.length
    });

    return adjustedResponse;
  } catch (error: any) {
    log('adjustResponseLength', 'Error', {
      type: error.type,
      message: error.message,
      statusCode: error.statusCode
    });
    
    throw new ApiError(
      'Failed to adjust response length. Please try again.',
      error.statusCode || 500,
      ApiErrorType.LENGTH_ADJUSTMENT
    );
  }
}
