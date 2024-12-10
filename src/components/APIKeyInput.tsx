import { useState, useEffect } from 'react'
import { Key, Save } from 'lucide-react'

interface APIKeyInputProps {
  hasApiKey: boolean;
  setHasApiKey: (value: boolean) => void;
}

export function APIKeyInput({ hasApiKey, setHasApiKey }: APIKeyInputProps) {
  const [apiKey, setApiKey] = useState('')
  const [isSaved, setIsSaved] = useState(false)
  const [isEnvKey, setIsEnvKey] = useState(false)

  useEffect(() => {
    const savedKey = localStorage.getItem('grog_api_key')
    const envKey = import.meta.env.VITE_GROG_API_KEY

    if (savedKey) {
      setApiKey(savedKey)
      setIsSaved(true)
      setHasApiKey(true)
    } else if (envKey) {
      setApiKey(envKey)
      setIsSaved(true)
      setIsEnvKey(true)
      setHasApiKey(true)
      // Store env key in localStorage for consistency
      localStorage.setItem('grog_api_key', envKey)
    }
  }, [setHasApiKey])

  const handleSaveKey = () => {
    if (apiKey.trim()) {
      localStorage.setItem('grog_api_key', apiKey.trim())
      setIsSaved(true)
      setIsEnvKey(false)
      setHasApiKey(true)
    }
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        Grog.com API Key
      </label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Key className="absolute top-2.5 left-3 w-5 h-5 text-gray-400" />
          <input
            type="password"
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter your API key"
            value={apiKey}
            onChange={(e) => {
              setApiKey(e.target.value)
              setIsSaved(false)
              setIsEnvKey(false)
            }}
          />
        </div>
        <button
          onClick={handleSaveKey}
          disabled={isEnvKey}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            isEnvKey
              ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
              : isSaved
              ? 'bg-green-100 text-green-700'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          <Save className="w-4 h-4" />
          {isEnvKey ? 'Using ENV' : isSaved ? 'Saved' : 'Save'}
        </button>
      </div>
      <p className="text-sm text-gray-500">
        {isEnvKey 
          ? 'Using API key from environment variables'
          : 'Your API key is stored securely in your browser\'s local storage.'}
      </p>
    </div>
  )
}
