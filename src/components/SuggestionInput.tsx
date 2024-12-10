import { Lightbulb } from 'lucide-react'
import { useEffect, useRef } from 'react'

interface SuggestionInputProps {
  suggestion: string
  setSuggestion: (value: string) => void
}

export function SuggestionInput({ suggestion, setSuggestion }: SuggestionInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const setupSpeechRecognition = () => {
      if (!textareaRef.current) return

      if ('webkitSpeechRecognition' in window) {
        const SpeechRecognition = (window as any).webkitSpeechRecognition
        const recognition = new SpeechRecognition()
        recognition.continuous = false
        recognition.interimResults = true

        recognition.onresult = (event: any) => {
          const transcript = Array.from(event.results)
            .map((result: any) => result[0])
            .map(result => result.transcript)
            .join('')
          
          if (event.results[0].isFinal) {
            setSuggestion(transcript)
          }
        }

        textareaRef.current.addEventListener('webkitspeechchange', () => {
          if (textareaRef.current?.value) {
            setSuggestion(textareaRef.current.value)
          }
        })
      }
    }

    setupSpeechRecognition()
  }, [setSuggestion])

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Your Suggestion
      </label>
      <div className="relative">
        <Lightbulb className="absolute top-3 left-3 w-5 h-5 text-gray-400" />
        <textarea
          ref={textareaRef}
          className="w-full h-24 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Describe what you want the response to say (e.g., 'Politely decline the meeting invitation and suggest next week instead')..."
          value={suggestion}
          onChange={(e) => setSuggestion(e.target.value)}
          spellCheck="true"
          inputMode="text"
          x-webkit-speech
          aria-label="Suggestion input field with voice dictation support"
        />
      </div>
      <p className="mt-1 text-sm text-gray-500">
        Guide the AI by describing what you want the response to convey
      </p>
    </div>
  )
}
