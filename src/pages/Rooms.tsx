import { useLang } from '../lib/i18n'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Rooms() {
  const { tr, dir } = useLang()
  const [rooms, setRooms] = useState<any[]>([])
  useEffect(() => {
    supabase.from('fridge_rooms').select('*').eq('is_active', true).order('name')
      .then(({ data }) => setRooms(data ?? []))
  }, [])

  const totalStored = rooms.reduce((s, r) => s + parseFloat(r.current_tonnes || 0), 0)
  const totalCap = rooms.reduce((s, r) => s + parseFloat(r.capacity_tonnes || 0), 0)

  return (
    <div dir={dir} className="p-5 max-w-lg mx-auto">
      <h1 className="text-xl font-black text-frost-steel mb-2">{tr('rooms')}</h1>
      <p className="text-frost-dim text-sm mb-5">{totalStored.toFixed(0)} / {totalCap.toFixed(0)} طن مستخدم</p>

      <div className="space-y-3">
        {rooms.map(r => {
          const cur = parseFloat(r.current_tonnes || 0)
          const cap = parseFloat(r.capacity_tonnes || 0)
          const pct = cap > 0 ? Math.round((cur / cap) * 100) : 0
          const color = pct >= 90 ? 'red' : pct >= 70 ? 'yellow' : 'green'
          const barColor = pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-yellow-500' : 'bg-frost-blue'
          const textColor = pct >= 90 ? 'text-red-400' : pct >= 70 ? 'text-yellow-400' : 'text-frost-blue'

          return (
            <Link key={r.id} to={`/rooms/${r.id}`} className="card hover:border-frost-blue transition-colors">
              <div className="flex justify-between items-center mb-3">
                <p className="text-frost-steel font-bold text-lg">{r.name}</p>
                <p className={`text-lg font-black ${textColor}`}>{pct}%</p>
              </div>
              <div className="w-full bg-frost-elevated rounded-full h-2.5 mb-2">
                <div className={`h-2.5 rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${Math.min(pct, 100)}%` }} />
              </div>
              <div className="flex justify-between text-xs text-frost-dim">
                <span>{cur.toFixed(0)} طن مخزّن</span>
                <span>{(cap - cur).toFixed(0)} طن متاح</span>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
