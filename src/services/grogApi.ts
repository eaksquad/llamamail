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

You will receive a user message containing:
- A specific tone to use.
- Suggestion context.
- The original email thread.

Using all of the above guidelines, produce the best possible email response.`;

const sentimentAnalysisPrompt = `You are an advanced communication intelligence assistant. Your task is to analyze the following email thread with unparalleled precision and generate a multi-layered report. The analysis must address the explicit content, underlying emotions, intent, tone dynamics, and actionable insights. Use the following format to ensure a holistic and detailed analysis:

### **1. Executive Summary:**
   - Summarize the overall sentiment, tone, and emotional dynamics of the thread in 2-3 sentences.
   - Clearly identify the sender's **intent** (e.g., request for action, complaint, proposal, follow-up).
   - Highlight the urgency level (low, medium, high) based on the language used.

### **2. Comprehensive Sentiment Analysis:**
   - Assign a **numerical sentiment score** to the thread on a scale of -100 (extremely negative) to +100 (extremely positive), with a justification for the score.
   - Identify **sentiment trajectory** across the thread (e.g., positive → neutral → negative) and explain contributing factors.
   - Flag any instances of **hidden or masked sentiment** (e.g., polite language masking frustration).

### **3. Tone Mapping:**
   - Provide a detailed breakdown of the **predominant tone** (e.g., professional, formal, sarcastic, empathetic, hostile).
   - Identify **tone shifts** and describe their triggers (e.g., a question or delay causing escalation).
   - Assess if the tone is **aligned** with the sender's intent (e.g., does formal language enhance or undermine the message?).

### **4. Emotional Landscape Analysis:**
   - Detect and list **primary emotions** conveyed (e.g., frustration, urgency, gratitude) with intensity levels (low, medium, high).
   - Identify **secondary emotions** or implicit feelings (e.g., disappointment hidden behind professional phrasing).
   - Provide examples of specific sentences or phrases demonstrating these emotions.

### **5. Contextual Insights and Unspoken Subtext:**
   - Analyze the underlying context and purpose of the email thread.
   - Highlight **unspoken concerns, expectations, or frustrations** inferred from the tone, phrasing, or repeated language.
   - Assess any potential **power dynamics** or negotiation strategies at play.

### **6. Key Issues and Action Points:**
   - Summarize the **core concerns, requests, or issues** raised in the thread.
   - Identify any **escalatory or conciliatory language** that signals the direction of the conversation.
   - Highlight any areas where the sender seeks explicit action or resolution.

### **7. Advanced Strategic Recommendations:**
   - Based on your analysis, provide a detailed strategy for crafting an optimal reply:
     - Suggested tone(s) to use (e.g., empathetic, neutral, assertive).
     - Key phrases or points to include to align with the sender's emotions and intent.
     - Phrases to **avoid** that may escalate or misalign the response.
   - Offer guidance on how to reframe the conversation if the thread is particularly negative or off-course.

### **8. Sentiment Timeline and Dynamics:**
   - For each email in the thread, provide:
     - **Sentiment Score** (on a scale from -100 to +100).
     - **Tone Tags** (e.g., "Professional but urgent").
     - **Emotional Tags** (e.g., "Gratitude with underlying frustration").
     - **Key Sentences:** Quote specific lines that best represent the tone or sentiment.

### **9. Visual Sentiment and Tone Trends:**
   - Represent the sentiment and tone progression using descriptors like:
     - Sentiment Flow: "Improving," "Deteriorating," "Fluctuating."
     - Tone Flow: "Consistently professional," "From polite to frustrated."
   - Use brief descriptive labels (e.g., "Positive start, sharp decline, neutral conclusion").

### **10. Advanced Pattern Recognition:**
   - Identify any **patterns of behavior** (e.g., repeated escalation, passive-aggressive tendencies).
   - Detect **language cues** indicating urgency, dissatisfaction, or attempts to influence.
   - Assess if the sender's communication is part of a **larger strategy or tactic**.

### **11. Predictive Insights:**
   - Predict how the sender might respond to various reply tones or strategies.
   - Suggest if additional follow-up steps are required to de-escalate or move the conversation forward.

Analyze the following email thread with this framework:
---
[Insert Email Thread Here]
---`;

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
      return makeApiRequest(apiCall, errorType, retryCount + 1);
    }
    
    if (error?.statusCode === 429) {
      throw new ApiError(
        'Rate limit exceeded. Please try again in a few moments.',
        429,
        ApiErrorType.RATE_LIMIT
      );
    }
    
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
  const sanitizedEmailThread = validateInput(emailThread, 10000);
  
  const isDevelopment = import.meta.env.DEV;
  const effectiveApiKey = apiKey || import.meta.env.VITE_GROQ_API_KEY;

  if (isDevelopment || !effectiveApiKey) {
    return "Mock Sentiment Analysis for Development";
  }

  try {
    const groq = new Groq({
      apiKey: effectiveApiKey,
      dangerouslyAllowBrowser: true
    });

    const prompt = sentimentAnalysisPrompt.replace('[Insert Email Thread Here]', sanitizedEmailThread);

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

    if (!completion.choices?.[0]?.message?.content) {
      throw new ApiError(
        'No sentiment analysis generated',
        500,
        ApiErrorType.EMPTY_RESPONSE
      );
    }

    return completion.choices[0].message.content;
  } catch (error: any) {
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
  const sanitizedEmailThread = validateInput(emailThread, 10000);
  const sanitizedSuggestion = validateInput(suggestion, 5000);
  const sanitizedTone = validateInput(tone, 50).toLowerCase();

  const validTones = [
    'apologetic', 'assertive', 'casual', 'conciliatory', 'direct',
    'empathetic', 'encouraging', 'formal', 'friendly', 'humorous',
    'informative', 'inspirational', 'motivational', 'neutral',
    'optimistic', 'professional', 'persuasive', 'respectful',
    'serious', 'sincere', 'sympathetic', 'technical', 'warm'
  ] as const;

  if (!validTones.includes(sanitizedTone as typeof validTones[number])) {
    throw new ApiError(
      'Invalid tone selected',
      400,
      ApiErrorType.INVALID_TONE
    );
  }

  const isDevelopment = import.meta.env.DEV;
  const effectiveApiKey = apiKey || import.meta.env.VITE_GROQ_API_KEY;

  if (isDevelopment || !effectiveApiKey) {
    return generateMockResponse(sanitizedTone, sanitizedSuggestion);
  }

  try {
    const groq = new Groq({
      apiKey: effectiveApiKey,
      dangerouslyAllowBrowser: true
    });
    
    let sentimentAnalysis: string;
    try {
      sentimentAnalysis = await analyzeSentiment(sanitizedEmailThread, effectiveApiKey, model);
    } catch (error) {
      console.warn('Sentiment analysis failed, proceeding without it:', error);
      sentimentAnalysis = 'Sentiment analysis unavailable';
    }

    const prompt = `Please generate an email response with a ${sanitizedTone} tone.
Context: ${sanitizedSuggestion}
Original email thread:
${sanitizedEmailThread}
Sentiment Analysis:
${sentimentAnalysis}
ONLY OUTPUT THE REWRITTEN RESPONSE.
DO NOT INCLUDE THE SUBJECT LINE.`;

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

    if (!completion.choices?.[0]?.message?.content) {
      throw new ApiError(
        'No response generated',
        500,
        ApiErrorType.EMPTY_RESPONSE
      );
    }

    return sanitizeHtml(completion.choices[0].message.content, {
      allowedTags: ['p', 'br', 'b', 'i', 'ul', 'ol', 'li'],
    });
  } catch (error: any) {
    if (error.type === ApiErrorType.RATE_LIMIT) {
      throw error;
    }
    // Fallback to mock response for other errors
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
  const sanitizedResponse = validateInput(currentResponse, 10000);
  
  try {
    const groq = new Groq({
      apiKey,
      dangerouslyAllowBrowser: true
    });

    const actionText = lengthAction === 'shorten' ? 'shorter' : 'longer';
    const prompt = `Please rewrite the following email response to make it ${actionText}, while maintaining the same tone and context. ONLY OUTPUT THE REWRITTEN RESPONSE. DO NOT INCLUDE THE SUBJECT LINE. Keep the essential information but ${lengthAction === 'shorten' ? 'be more concise' : 'add more detail and elaboration'}:\n\n${sanitizedResponse}`;

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

    if (!completion.choices?.[0]?.message?.content) {
      throw new ApiError(
        'No response generated',
        500,
        ApiErrorType.EMPTY_RESPONSE
      );
    }

    return sanitizeHtml(completion.choices[0].message.content, {
      allowedTags: ['p', 'br', 'b', 'i', 'ul', 'ol', 'li'],
    });
  } catch (error: any) {
    throw new ApiError(
      'Failed to adjust response length. Please try again.',
      error.statusCode || 500,
      ApiErrorType.LENGTH_ADJUSTMENT
    );
  }
}
