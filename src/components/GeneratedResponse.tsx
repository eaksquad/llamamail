import { Copy, Check } from 'lucide-react'
import { useState } from 'react'

interface GeneratedResponseProps {
  response: string
}

export function GeneratedResponse({ response }: GeneratedResponseProps) {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(response)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Format the response by preserving line breaks and adding proper spacing
  const formattedResponse = response
    ? response
        .split('\n')
        .map((line, index) => (
          <span key={index}>
            {line}
            <br />
          </span>
        ))
    : "Your AI-generated response will appear here..."

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-2">
        <label className="block text-sm font-medium text-gray-700">
          Generated Response
        </label>
        <button
          onClick={copyToClipboard}
          className="flex items-center gap-1.5 text-sm px-2 py-1 rounded-md hover:bg-gray-100 transition-colors"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-green-600" />
              <span className="text-green-600">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 text-gray-600" />
              <span className="text-gray-600">Copy</span>
            </>
          )}
        </button>
      </div>
      <div className="p-6 bg-white border border-gray-300 rounded-lg min-h-[200px] whitespace-pre-line text-gray-700 leading-relaxed">
        {formattedResponse}
      </div>
    </div>
  )
}