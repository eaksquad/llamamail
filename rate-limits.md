Rate Limits
Rate limits act as control measures to regulate how frequently a user or application can make requests within a given timeframe.

Current rate limits for chat completions:
You can view the current rate limits for chat completions in your organization settings


The team is working on introducing paid tiers with stable and increased rate limits in the near future.

Status code & rate limit headers
We set the following x-ratelimit headers to inform you on current rate limits applicable to the API key and associated organization.


The following headers are set (values are illustrative):


Header	Value	Notes
retry-after	2	In seconds
x-ratelimit-limit-requests	14400	Always refers to Requests Per Day (RPD)
x-ratelimit-limit-tokens	18000	Always refers to Tokens Per Minute (TPM)
x-ratelimit-remaining-requests	14370	Always refers to Requests Per Day (RPD)
x-ratelimit-remaining-tokens	17997	Always refers to Tokens Per Minute (TPM)
x-ratelimit-reset-requests	2m59.56s	Always refers to Requests Per Day (RPD)
x-ratelimit-reset-tokens	7.66s	Always refers to Tokens Per Minute (TPM)

When the rate limit is reached we return a 429 Too Many Requests HTTP status code.


Note, retry-after is only set if you hit the rate limit and status code 429 is returned. The other headers are always included.

These are the rate limits for your organization

Chat Completion
ID	Requests per Minute	Requests per Day	Tokens per Minute	Tokens per Day
gemma-7b-it	30	14,400	15,000	500,000
gemma2-9b-it	30	14,400	15,000	500,000
llama-3.1-70b-versatile	30	14,400	6,000	200,000
llama-3.1-8b-instant	30	14,400	20,000	500,000
llama-3.2-11b-text-preview	30	7,000	7,000	500,000
llama-3.2-11b-vision-preview	30	7,000	7,000	500,000
llama-3.2-1b-preview	30	7,000	7,000	500,000
llama-3.2-3b-preview	30	7,000	7,000	500,000
llama-3.2-90b-text-preview	30	7,000	7,000	500,000
llama-3.2-90b-vision-preview	15	3,500	7,000	250,000
llama-3.3-70b-specdec	30	1,000	6,000	100,000
llama-3.3-70b-versatile	30	14,400	6,000	(No limit)
llama-guard-3-8b	30	14,400	15,000	500,000
llama3-70b-8192	30	14,400	6,000	500,000
llama3-8b-8192	30	14,400	30,000	500,000
llama3-groq-70b-8192-tool-use-preview	30	14,400	15,000	500,000
llama3-groq-8b-8192-tool-use-preview	30	14,400	15,000	500,000
llava-v1.5-7b-4096-preview	30	14,400	30,000	(No limit)
mixtral-8x7b-32768	30	14,400	5,000	500,000
Speech To Text
ID	Requests per Minute	Requests per Day	Audio Seconds per Hour	Audio Seconds per Day
distil-whisper-large-v3-en	20	2,000	7,200	28,800
whisper-large-v3	20	2,000	7,200	28,800
whisper-large-v3-turbo	20	2,000	7,200	28,800

# Groq API Rate Limits

## Current Limits
- **Token Rate**: 6,000 tokens per minute
- **Request Rate**: Not explicitly stated, but tied to token usage

## Our Usage Analysis
1. **Sentiment Analysis Request**:
   - System message: ~100 tokens
   - Sentiment analysis prompt: ~1,000 tokens
   - Email thread input: Variable (~500-2000 tokens)
   - Expected response: ~1,000-2,000 tokens
   - **Total per request**: ~2,600-5,100 tokens

2. **Email Generation Request**:
   - System message: ~500 tokens
   - Generation prompt: ~200 tokens
   - Email thread: Variable (~500-2000 tokens)
   - Sentiment analysis results: ~1,500 tokens
   - Expected response: ~500-1,000 tokens
   - **Total per request**: ~3,200-5,200 tokens

## Current Issues
- Each user action triggers both sentiment analysis and email generation
- Combined token usage per action: ~5,800-10,300 tokens
- This can easily exceed the 6,000 tokens/minute limit with a single user action

## Recommended Solutions

### 1. Token Usage Optimization
- Truncate email threads to last few relevant messages
- Compress sentiment analysis output
- Cache sentiment analysis results for identical threads
- Optimize system prompts to be more concise

### 2. Rate Limiting Implementation
- Track token usage with a rolling window
- Queue requests when approaching limits
- Provide user feedback during rate limiting
- Implement exponential backoff for retries

### 3. Request Management
- Prioritize email generation over sentiment analysis
- Cache frequently used responses
- Implement request queuing
- Show appropriate loading states to users

## Implementation Notes
1. Need to track token usage across all requests
2. Implement a token bucket algorithm
3. Add request queuing mechanism
4. Improve error messaging for rate limits
5. Consider adding a simple cache for sentiment analysis
