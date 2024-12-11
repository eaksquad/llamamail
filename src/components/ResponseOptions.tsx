import { Sliders } from 'lucide-react'

interface ResponseOptionsProps {
  tone: string;
  setTone: (tone: string) => void;
}

export function ResponseOptions({ tone, setTone }: ResponseOptionsProps) {
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
            <option value="apologetic">Apologetic</option>
            <option value="assertive">Assertive</option>
            <option value="casual">Casual</option>
            <option value="conciliatory">Conciliatory</option>
            <option value="direct">Direct</option>
            <option value="empathetic">Empathetic</option>
            <option value="encouraging">Encouraging</option>
            <option value="formal">Formal</option>
            <option value="friendly">Friendly</option>
            <option value="humorous">Humorous</option>
            <option value="informative">Informative</option>
            <option value="inspirational">Inspirational</option>
            <option value="motivational">Motivational</option>
            <option value="neutral">Neutral</option>
            <option value="optimistic">Optimistic</option>
            <option value="professional">Professional</option>
            <option value="persuasive">Persuasive</option>
            <option value="respectful">Respectful</option>
            <option value="serious">Serious</option>
            <option value="sincere">Sincere</option>
            <option value="sympathetic">Sympathetic</option>
            <option value="technical">Technical</option>
            <option value="warm">Warm</option>
          </select>
        </div>
      </div>
    </div>
  )
}
