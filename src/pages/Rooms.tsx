import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Rooms() {
  const [rooms, setRooms] = useState<any[]>([])
  useEffect(() => { supabase.from('fridge_rooms').select('*').order('name').then(({ data }) => { if (data) setRooms(data) }) }, [])

  const totalCap = rooms.reduce((s, r) => s + parseFloat(r.capacity_tonnes), 0)
  const totalUsed = rooms.reduce((s, r) => s + parseFloat(r.current_tonnes), 0)

  return (
    <div className="p-4 max-w-lg mx-auto">
      <h1 className="text-xl font-black text-frost-steel tracking-wide mb-1">Rooms</h1>
      <p className="text-frost-dim text-xs mb-6">{totalUsed.toLocaleString()}t stored of {totalCap.toLocaleString()}t total</p>
      {rooms.map(r => {
        const pct = parseFloat(r.capacity_tonnes) > 0 ? (parseFloat(r.current_tonnes) / parseFloat(r.capacity_tonnes)) * 100 : 0
        const free = parseFloat(r.capacity_tonnes) - parseFloat(r.current_tonnes)
        const barColor = pct > 85 ? 'bg-red-500' : pct > 60 ? 'bg-yellow-400' : 'bg-green-400'
        const textColor = pct > 85 ? 'text-red-400' : pct > 60 ? 'text-yellow-400' : 'text-green-400'
        return (
          <Link key={r.id} to={`/rooms/${r.id}`} className="card block mb-3 hover:border-frost-blue transition-colors">
            <div className="flex justify-between items-center">
              <p className="text-frost-steel font-black text-lg">{r.name}</p>
              <div className="flex items-center gap-3">
                {r.current_temp !== null && <p className="text-cyan-400 font-bold">{r.current_temp}°C</p>}
                <p className={`font-black ${textColor}`}>{Math.round(pct)}%</p>
              </div>
            </div>
            <div className="h-3 bg-frost-elevated rounded-full overflow-hidden mt-3">
              <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
            </div>
            <div className="flex justify-between mt-2 text-frost-dim text-xs">
              <span>{parseFloat(r.current_tonnes).toLocaleString()}t stored</span>
              <span>{free}t free</span>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
