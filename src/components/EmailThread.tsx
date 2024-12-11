import { MessageSquare } from 'lucide-react'

interface EmailThreadProps {
  emailThread: string
  setEmailThread: (emailThread: string) => void
  children?: React.ReactNode
}

export function EmailThread({ emailThread, setEmailThread, children }: EmailThreadProps) {
  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Email Thread
      </label>
      <div className="relative">
        <MessageSquare className="absolute top-3 left-3 w-5 h-5 text-gray-400" />
        <textarea
          className="w-full h-48 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Paste the email thread or context here..."
          value={emailThread}
          onChange={(e) => setEmailThread(e.target.value)}
        />
      </div>
      {children}
    </div>
  )
}
