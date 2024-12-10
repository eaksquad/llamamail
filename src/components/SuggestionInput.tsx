import { Lightbulb } from 'lucide-react'

interface SuggestionInputProps {
  suggestion: string
  setSuggestion: (value: string) => void
}

export function SuggestionInput({ suggestion, setSuggestion }: SuggestionInputProps) {
  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Your Suggestion
      </label>
      <div className="relative">
        <Lightbulb className="absolute top-3 left-3 w-5 h-5 text-gray-400" />
        <textarea
          className="w-full h-24 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Describe what you want the response to say (e.g., 'Politely decline the meeting invitation and suggest next week instead')..."
          value={suggestion}
          onChange={(e) => setSuggestion(e.target.value)}
        />
      </div>
      <p className="mt-1 text-sm text-gray-500">
        Guide the AI by describing what you want the response to convey
      </p>
    </div>
  )
}
