import { MessageSquare, Trash2 } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { analyzeSentiment } from '../services/grogApi'

interface EmailThreadProps {
  emailThread: string
  setEmailThread: (value: string) => void
}

export function EmailThread({ emailThread, setEmailThread }: EmailThreadProps) {
  const [sentimentAnalysis, setSentimentAnalysis] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    const storedAnalysis = localStorage.getItem(`sentiment_${emailThread}`);
    if (emailThread && !storedAnalysis) {
      const performAnalysis = async () => {
        setIsAnalyzing(true);
        try {
          const analysis = await analyzeSentiment(emailThread);
          setSentimentAnalysis(analysis);
          localStorage.setItem(`sentiment_${emailThread}`, analysis);
        } catch (error) {
          console.error('Failed to analyze sentiment:', error);
        } finally {
          setIsAnalyzing(false);
        }
      };
      performAnalysis();
    } else if (storedAnalysis) {
      setSentimentAnalysis(storedAnalysis);
    } else {
      setSentimentAnalysis('');
    }
  }, [emailThread]);

  const handleClearEmailThread = () => {
    setEmailThread('');
    setSentimentAnalysis('');
  }

  const handleEmailThreadChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEmailThread(e.target.value);
  }

  return (
    <div className="w-full">
      {isAnalyzing && (
        <div className="mb-2 text-sm text-blue-600">
          Analyzing email sentiment...
        </div>
      )}
      {sentimentAnalysis && !isAnalyzing && (
        <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="text-sm font-medium text-gray-900 mb-2">Sentiment Analysis</h3>
          <div className="text-sm text-gray-600 whitespace-pre-wrap">
            {sentimentAnalysis}
          </div>
        </div>
      )}
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Email Thread
      </label>
      <div className="relative">
        <MessageSquare className="absolute top-3 left-3 w-5 h-5 text-gray-400" />
        {emailThread && (
          <button
            type="button"
            onClick={handleClearEmailThread}
            className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
            aria-label="Clear email thread"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        )}
        <textarea
          className="w-full h-48 pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Paste your email thread here..."
          value={emailThread}
          onChange={handleEmailThreadChange}
        />
      </div>
    </div>
  )
}
