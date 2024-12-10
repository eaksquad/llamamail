import { useState, useEffect } from 'react'
import { Mail, AlertCircle } from 'lucide-react'
import { EmailThread } from './components/EmailThread'
import { ResponseOptions } from './components/ResponseOptions'
import { GeneratedResponse } from './components/GeneratedResponse'
import { APIKeyInput } from './components/APIKeyInput'
import { SuggestionInput } from './components/SuggestionInput'
import { generateEmailResponse, ApiError } from './services/grogApi'
import './index.css'

interface ErrorState {
  message: string;
  type: 'error' | 'warning';
}

function App() {
  const [emailThread, setEmailThread] = useState('')
  const [suggestion, setSuggestion] = useState('')
  const [tone, setTone] = useState('professional')
  const [model, setModel] = useState('llama-3.3-70b-versatile')
  const [response, setResponse] = useState('')
  const [hasApiKey, setHasApiKey] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<ErrorState | null>(null)

  useEffect(() => {
    const apiKey = localStorage.getItem('grog_api_key') || import.meta.env.VITE_GROG_API_KEY
    setHasApiKey(!!apiKey)
  }, [])

  const validateInputs = () => {
    if (!emailThread.trim()) {
      setError({ message: "Please provide an email thread.", type: 'error' })
      return false
    }

    if (!suggestion.trim()) {
      setError({ message: "Please provide a suggestion for the response.", type: 'error' })
      return false
    }

    return true
  }

  const handleError = (error: unknown) => {
    if (error instanceof ApiError) {
      switch (error.type) {
        case 'RATE_LIMIT':
          setError({ 
            message: "You've hit the rate limit. Please wait a moment before trying again.", 
            type: 'error' 
          })
          break
        case 'INVALID_API_KEY':
          setError({ 
            message: "Your API key appears to be invalid. Please check your settings.", 
            type: 'error' 
          })
          break
        case 'MISSING_API_KEY':
          setError({ 
            message: "Please add your API key in the settings section above.", 
            type: 'error' 
          })
          break
        default:
          setError({ 
            message: error.message || "An unexpected error occurred.", 
            type: 'error' 
          })
      }
    } else {
      setError({ 
        message: "An unexpected error occurred. Please try again later.", 
        type: 'error' 
      })
    }
    console.error('Generation error:', error)
  }

  const handleGenerate = async () => {
    const apiKey = localStorage.getItem('grog_api_key') || import.meta.env.VITE_GROG_API_KEY
    if (!apiKey) {
      setError({ 
        message: "Please add your API key in the settings section above.", 
        type: 'error' 
      })
      return
    }

    if (!validateInputs()) return

    setIsLoading(true)
    setError(null)
    
    try {
      const generatedResponse = await generateEmailResponse(
        emailThread,
        suggestion,
        tone,
        apiKey,
        model
      )
      setResponse(generatedResponse)
    } catch (err) {
      handleError(err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="flex items-center gap-2 mb-8">
          <Mail className="w-8 h-8 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">Email Response Assistant</h1>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Settings</h2>
            <APIKeyInput />
          </div>

          <div className="space-y-6 bg-white p-6 rounded-xl shadow-sm">
            {!hasApiKey && (
              <div className="flex items-center gap-2 p-4 bg-yellow-50 text-yellow-700 rounded-lg mb-4">
                <AlertCircle className="w-5 h-5" />
                <p className="text-sm">Please add your Grog.com API key in the settings section above.</p>
              </div>
            )}

            {error && (
              <div className={`flex items-center gap-2 p-4 rounded-lg ${
                error.type === 'error' 
                  ? 'bg-red-50 text-red-700' 
                  : 'bg-yellow-50 text-yellow-700'
              }`}>
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm">{error.message}</p>
              </div>
            )}

            <SuggestionInput 
              suggestion={suggestion}
              setSuggestion={setSuggestion}
            />

            <EmailThread 
              emailThread={emailThread}
              setEmailThread={setEmailThread}
            />
            
            <ResponseOptions 
              tone={tone}
              setTone={setTone}
              model={model}
              setModel={setModel}
            />

            <button
              onClick={handleGenerate}
              disabled={isLoading}
              className={`w-full py-2 px-4 rounded-lg transition-colors ${
                isLoading 
                  ? 'bg-blue-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              } text-white flex items-center justify-center`}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating...
                </>
              ) : 'Generate Response'}
            </button>

            <GeneratedResponse response={response} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
