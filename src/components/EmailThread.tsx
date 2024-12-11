import { MessageSquare, Trash2 } from 'lucide-react'
import React from 'react'

interface EmailThreadProps {
  emailThread: string
  setEmailThread: (value: string) => void
}

export function EmailThread({ emailThread, setEmailThread }: EmailThreadProps) {
  const handleClearEmailThread = () => {
    setEmailThread('');
  }

  const handleEmailThreadChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEmailThread(e.target.value);
  }

  return (
    <div className="w-full">
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
