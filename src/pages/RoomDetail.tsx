import { useLang } from '../lib/i18n'
import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { format } from 'date-fns'
import { supabase } from '../lib/supabase'
import { ArrowLeft } from 'lucide-react'

export default function RoomDetail() {
  const { tr, dir } = useLang()
  const { id } = useParams()
  const [room, setRoom] = useState<any>(null)
  const [inventory, setInventory] = useState<any[]>([])
  const [txns, setTxns] = useState<any[]>([])

  useEffect(() => {
    if (!id) return
    supabase.from('fridge_rooms').select('*').eq('id', id).single().then(({ data }) => setRoom(data))
    supabase.from('fridge_inventory').select('*, fridge_clients(name)').eq('room_id', id).gt('tonnes', 0).then(({ data }) => setInventory(data ?? []))
    supabase.from('fridge_transactions').select('*, fridge_clients(name)').eq('room_id', id).order('created_at', { ascending: false }).limit(10).then(({ data }) => setTxns(data ?? []))
  }, [id])

  if (!room) return <div className="flex items-center justify-center h-64"><div className="w-10 h-10 border-4 border-frost-blue border-t-transparent rounded-full animate-spin" /></div>

  const pct = parseFloat(room.capacity_tonnes) > 0 ? (parseFloat(room.current_tonnes) / parseFloat(room.capacity_tonnes)) * 100 : 0
  const barColor = pct > 85 ? 'bg-red-500' : pct > 60 ? 'bg-yellow-400' : 'bg-green-400'

  return (
    <div dir={dir} className="p-4 max-w-lg mx-auto">
      <Link to="/rooms" className="text-frost-blue text-sm font-bold flex items-center gap-1 mb-4"><ArrowLeft size={16} /> Rooms</Link>
      <div className="card mb-4">
        <h1 className="text-xl font-black text-frost-steel">{room.name}</h1>
        <div className="h-3 bg-frost-elevated rounded-full overflow-hidden mt-3">
          <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
        </div>
        <div className="flex justify-between mt-2 text-frost-dim text-xs">
          <span>{parseFloat(room.current_tonnes)}t / {parseFloat(room.capacity_tonnes)}t</span>
          <span className={pct > 85 ? 'text-red-400' : pct > 60 ? 'text-yellow-400' : 'text-green-400'}>{Math.round(pct)}%</span>
        </div>
        <div className="flex gap-6 mt-4">
          <div><p className="text-frost-dim text-[10px] uppercase">السعة</p><p className="text-cyan-400 font-bold">{room.target_temp}°C</p></div>
          <div><p className="text-frost-dim text-[10px] uppercase">الحالي</p><p className="text-cyan-400 font-bold">{room.current_temp ?? '—'}°C</p></div>
          <div><p className="text-frost-dim text-[10px] uppercase">فارغ</p><p className="text-green-400 font-bold">{(parseFloat(room.capacity_tonnes) - parseFloat(room.current_tonnes)).toLocaleString()}t</p></div>
        </div>
      </div>

      <h2 className="text-frost-steel text-xs font-black uppercase tracking-widest mb-3">المخزون</h2>
      {inventory.length === 0 ? <p className="text-frost-dim text-center py-4">فارغ</p> : inventory.map(inv => (
        <div key={inv.id} className="card mb-2 flex justify-between items-center">
          <div>
            <p className="text-frost-steel font-semibold text-sm">{inv.fridge_clients?.name}</p>
            <p className="text-frost-dim text-xs">{inv.product_type} · منذ {format(new Date(inv.date_in), 'MMM dd')}</p>
          </div>
          <p className="text-frost-blue font-black">{inv.tonnes}t</p>
        </div>
      ))}

      <h2 className="text-frost-steel text-xs font-black uppercase tracking-widest mb-3 mt-6">الحركات</h2>
      {txns.map(tx => (
        <div key={tx.id} className="card mb-2 flex items-center gap-3">
          <span className={`text-xs font-black px-2 py-1 rounded ${tx.type === 'in' ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'}`}>{tx.type.toUpperCase()}</span>
          <div className="flex-1">
            <p className="text-frost-steel text-sm">{tx.fridge_clients?.name} · {tx.product_type}</p>
            <p className="text-frost-dim text-xs">{format(new Date(tx.date), 'MMM dd, yyyy')}</p>
          </div>
          <p className={`font-bold ${tx.type === 'in' ? 'text-green-400' : 'text-red-400'}`}>{tx.type === 'in' ? '+' : '−'}{tx.tonnes}t</p>
        </div>
      ))}
    </div>
  )
}
