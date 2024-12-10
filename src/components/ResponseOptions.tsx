import { Sliders, Cpu } from 'lucide-react'

interface ResponseOptionsProps {
  tone: string
  setTone: (value: string) => void
  model: string
  setModel: (value: string) => void
}

export function ResponseOptions({ tone, setTone, model, setModel }: ResponseOptionsProps) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Response Tone
        </label>
        <div className="relative">
          <Sliders className="absolute top-3 left-3 w-5 h-5 text-gray-400" />
          <select
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={tone}
            onChange={(e) => setTone(e.target.value)}
          >
            <option value="professional">Professional</option>
            <option value="friendly">Friendly</option>
            <option value="formal">Formal</option>
            <option value="casual">Casual</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          AI Model
        </label>
        <div className="relative">
          <Cpu className="absolute top-3 left-3 w-5 h-5 text-gray-400" />
          <select
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={model}
            onChange={(e) => setModel(e.target.value)}
          >
            <option value="mixtral-8x7b-32768">Mixtral 8x7B</option>
            <option value="llama-3.3-70b-versatile">LLaMA 3.3 70B</option>
          </select>
        </div>
      </div>
    </div>
  )
}
