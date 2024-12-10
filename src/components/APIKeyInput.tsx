import { useState, useEffect } from 'react'
import { Key, Save, Check } from 'lucide-react'

interface APIKeyInputProps {
  hasApiKey: boolean;
  setHasApiKey: (value: boolean) => void;
}

export function APIKeyInput({ hasApiKey, setHasApiKey }: APIKeyInputProps) {
  const [apiKey, setApiKey] = useState('')
  const [isEnvKey, setIsEnvKey] = useState(false)

  useEffect(() => {
    const savedKey = localStorage.getItem('grog_api_key')
    const envKey = import.meta.env.VITE_GROQ_API_KEY

    if (savedKey) {
      setApiKey(savedKey)
      setHasApiKey(true)
    } else if (envKey) {
      setApiKey(envKey)
      setIsEnvKey(true)
      setHasApiKey(true)
      localStorage.setItem('grog_api_key', envKey)
    }
  }, [setHasApiKey])

  const handleSaveKey = () => {
    if (apiKey.trim()) {
      localStorage.setItem('grog_api_key', apiKey.trim())
      setIsEnvKey(false)
      setHasApiKey(true)
    }
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        Groq API Key {hasApiKey && <span className="text-green-600 ml-2">(Active)</span>}
      </label>
      
      <div className="relative">
        <Key className="absolute top-3 left-3 w-5 h-5 text-gray-400" />
        <input
          type="password"
          placeholder={hasApiKey ? '••••••••••••••••' : 'Enter your Groq API key'}
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          className="w-full pl-10 pr-20 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          disabled={isEnvKey}
        />
        {!isEnvKey && (
          <button
            onClick={handleSaveKey}
            disabled={!apiKey.trim() || isEnvKey}
            className={`absolute right-2 top-2 px-3 py-1 rounded-md text-sm flex items-center gap-1
              ${hasApiKey 
                ? 'bg-green-100 text-green-700' 
                : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {hasApiKey ? (
              <>
                <Check className="w-4 h-4" />
                Saved
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save
              </>
            )}
          </button>
        )}
      </div>
      
      {isEnvKey && (
        <p className="text-sm text-gray-500">
          Using API key from environment variables
        </p>
      )}
    </div>
  )
}
