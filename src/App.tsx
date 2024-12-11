import { useState, useEffect } from 'react'
import { Mail, AlertCircle, Settings, ChevronDown, ChevronUp } from 'lucide-react'
import { EmailThread } from './components/EmailThread'
import { ResponseOptions } from './components/ResponseOptions'
import { GeneratedResponse } from './components/GeneratedResponse'
import { APIKeyInput } from './components/APIKeyInput'
import { SuggestionInput } from './components/SuggestionInput'
import { generateEmailResponse, adjustResponseLength, ApiError, type LengthAction } from './services/grogApi'
import './index.css'

interface ErrorState {
  message: string;
  type: 'error' | 'warning';
}

function App() {
  const [emailThread, setEmailThread] = useState('')
  const [suggestion, setSuggestion] = useState('')
  const [tone, setTone] = useState(() => {
    const savedTone = localStorage.getItem('selectedTone');
    return savedTone || 'professional';
  });
  const [model, setModel] = useState(() => {
    const savedModel = localStorage.getItem('selectedModel');
    return savedModel || 'llama-3.3-70b-versatile';
  });
  const [response, setResponse] = useState('')
  const [hasApiKey, setHasApiKey] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<ErrorState | null>(null)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  useEffect(() => {
    localStorage.setItem('selectedTone', tone);
  }, [tone]);

  useEffect(() => {
    localStorage.setItem('selectedModel', model);
  }, [model]);

  useEffect(() => {
    const apiKey = localStorage.getItem('grog_api_key')
    const envApiKey = import.meta.env.VITE_GROG_API_KEY
    setHasApiKey(!!(apiKey || envApiKey))
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

  const handleResponseLengthChange = async (lengthAction: LengthAction) => {
    const apiKey = localStorage.getItem('grog_api_key') || import.meta.env.VITE_GROG_API_KEY
    if (!apiKey) {
      setError({ 
        message: "Please add your API key in the settings section above.", 
        type: 'error' 
      })
      return
    }

    setIsLoading(true)
    setError(null)
    
    try {
      const adjustedResponse = await adjustResponseLength(
        response,
        lengthAction,
        apiKey,
        model
      )
      setResponse(adjustedResponse)
    } catch (err) {
      handleError(err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
      <div className="relative py-3 sm:max-w-xl sm:mx-auto w-full px-4 sm:px-0">
        <div className="relative px-4 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-20">
          <div className="max-w-md mx-auto">
            <div className="divide-y divide-gray-200">
              <div className="py-8 text-base leading-6 space-y-4 text-gray-700 sm:text-lg sm:leading-7">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center">
                    <Mail className="h-8 w-8 text-blue-500 mr-2" />
                    <h1 className="text-3xl font-bold text-gray-900">LlamaMail</h1>
                  </div>
                  <button
                    onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                    className="flex items-center text-gray-600 hover:text-gray-900"
                  >
                    <Settings className="h-5 w-5 mr-1" />
                    {isSettingsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                </div>

                {/* Settings Panel */}
                <div className={`transition-all duration-300 ease-in-out ${isSettingsOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                  <div className="bg-gray-50 p-4 rounded-lg mb-6">
                    <h2 className="text-lg font-semibold mb-4">Settings</h2>
                    <APIKeyInput
                      hasApiKey={hasApiKey}
                      setHasApiKey={setHasApiKey}
                    />
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Model
                      </label>
                      <select
                        value={model}
                        onChange={(e) => setModel(e.target.value)}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                      >
                        <option value="llama-3.3-70b-versatile">Llama 3.3 70B</option>
                        <option value="mixtral-8x7b-32768">Mixtral 8x7B</option>
                      </select>
                    </div>
                  </div>
                </div>

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

                <GeneratedResponse 
                  response={response}
                  onResponseLengthChange={handleResponseLengthChange}
                  isLoading={isLoading}
                />

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
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
