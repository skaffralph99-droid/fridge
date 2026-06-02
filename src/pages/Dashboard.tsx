import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { Warehouse, Users, TrendingUp, AlertTriangle, Plus, LogOut } from 'lucide-react'

interface Room { id: string; name: string; capacity_tonnes: number; current_tonnes: number; current_temp: number | null; target_temp: number }

export default function Dashboard() {
  const { user, signOut } = useAuth()
  const [rooms, setRooms] = useState<Room[]>([])
  const [clientCount, setClientCount] = useState(0)
  const [recentTx, setRecentTx] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      supabase.from('fridge_rooms').select('*').eq('is_active', true).order('name'),
      supabase.from('fridge_clients').select('*', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('fridge_transactions').select('*, fridge_clients(name), fridge_rooms(name)').order('created_at', { ascending: false }).limit(5),
    ]).then(([{ data: r }, { count: c }, { data: tx }]) => {
      if (r) setRooms(r)
      setClientCount(c ?? 0)
      if (tx) setRecentTx(tx)
      setLoading(false)
    })
  }, [])

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-10 h-10 border-4 border-frost-blue border-t-transparent rounded-full animate-spin" /></div>

  const totalCap = rooms.reduce((s, r) => s + parseFloat(r.capacity_tonnes), 0)
  const totalUsed = rooms.reduce((s, r) => s + parseFloat(r.current_tonnes), 0)
  const occupancy = totalCap ? Math.round((totalUsed / totalCap) * 100) : 0

  return (
    <div className="p-4 max-w-lg mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-black text-frost-steel tracking-wide">❄️ Cold Storage</h1>
          <p className="text-frost-dim text-xs uppercase tracking-widest mt-1">{format(new Date(), 'EEEE · MMM dd yyyy')}</p>
        </div>
        <button onClick={signOut} className="text-frost-dim hover:text-red-400 p-2"><LogOut size={20} /></button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {[
          { label: 'Stored', value: `${totalUsed.toLocaleString()}t`, color: 'border-blue-500', icon: Warehouse },
          { label: 'Capacity', value: `${totalCap.toLocaleString()}t`, color: 'border-cyan-400', icon: TrendingUp },
          { label: 'Occupancy', value: `${occupancy}%`, color: occupancy > 80 ? 'border-red-500' : 'border-green-400', icon: AlertTriangle },
          { label: 'Clients', value: clientCount.toString(), color: 'border-blue-400', icon: Users },
        ].map(k => (
          <div key={k.label} className={`card border-l-[3px] ${k.color}`}>
            <p className="text-frost-dim text-[10px] font-bold uppercase tracking-widest">{k.label}</p>
            <p className="text-2xl font-black text-frost-steel mt-1">{k.value}</p>
          </div>
        ))}
      </div>

      {/* Rooms */}
      <h2 className="text-frost-steel text-xs font-black uppercase tracking-widest mb-3">Rooms</h2>
      <div className="space-y-2 mb-6">
        {rooms.map(r => {
          const pct = parseFloat(r.capacity_tonnes) > 0 ? (parseFloat(r.current_tonnes) / parseFloat(r.capacity_tonnes)) * 100 : 0
          const barColor = pct > 85 ? 'bg-red-500' : pct > 60 ? 'bg-yellow-400' : 'bg-green-400'
          const textColor = pct > 85 ? 'text-red-400' : pct > 60 ? 'text-yellow-400' : 'text-green-400'
          return (
            <Link key={r.id} to={`/rooms/${r.id}`} className="card flex items-center gap-3 hover:border-frost-blue transition-colors">
              <div className="flex-1">
                <p className="text-frost-steel font-bold text-sm">{r.name}</p>
                <p className="text-frost-dim text-xs">{parseFloat(r.current_tonnes)}t / {parseFloat(r.capacity_tonnes)}t</p>
              </div>
              <div className="w-20">
                <div className="h-2 bg-frost-elevated rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
                </div>
                <p className={`text-right text-xs font-bold mt-1 ${textColor}`}>{Math.round(pct)}%</p>
              </div>
              {r.current_temp !== null && <p className="text-cyan-400 text-sm font-bold min-w-[40px] text-right">{r.current_temp}°</p>}
            </Link>
          )
        })}
      </div>

      {/* Recent Activity */}
      <h2 className="text-frost-steel text-xs font-black uppercase tracking-widest mb-3">Recent Activity</h2>
      {recentTx.length === 0 ? (
        <p className="text-frost-dim text-center py-6">No transactions yet</p>
      ) : (
        <div className="space-y-2 mb-6">
          {recentTx.map((tx: any) => (
            <div key={tx.id} className="card flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${tx.type === 'in' ? 'bg-green-500/15' : 'bg-red-500/15'}`}>
                <span className={`text-xs font-black ${tx.type === 'in' ? 'text-green-400' : 'text-red-400'}`}>{tx.type === 'in' ? 'IN' : 'OUT'}</span>
              </div>
              <div className="flex-1">
                <p className="text-frost-steel text-sm font-semibold">{tx.fridge_clients?.name}</p>
                <p className="text-frost-dim text-xs">{tx.product_type} · {tx.fridge_rooms?.name} · {format(new Date(tx.date), 'MMM dd yyyy')}</p>
              </div>
              <p className={`font-black ${tx.type === 'in' ? 'text-green-400' : 'text-red-400'}`}>
                {tx.type === 'in' ? '+' : '−'}{tx.tonnes}t
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Analytics */}
      <Link to="/analytics" className="card mb-4 flex items-center gap-3 border-frost-blue hover:bg-frost-elevated transition-colors">
        <div className="w-10 h-10 rounded-lg bg-frost-blue/15 flex items-center justify-center"><TrendingUp size={20} className="text-frost-blue" /></div>
        <div className="flex-1">
          <p className="text-frost-steel font-bold text-sm">Revenue Analytics</p>
          <p className="text-frost-dim text-xs">See what you're making vs what you could make</p>
        </div>
        <span className="text-frost-blue text-lg">→</span>
      </Link>

      {/* Quick Actions */}
      <div className="flex gap-3">
        <Link to="/transactions/new" className="btn-blue flex-1 text-center flex items-center justify-center gap-2">
          <Plus size={16} /> New Transaction
        </Link>
        <Link to="/clients/new" className="flex-1 text-center border border-frost-border text-frost-dim rounded-xl py-3 font-bold text-sm uppercase tracking-wide hover:border-frost-blue transition-colors flex items-center justify-center gap-2">
          <Plus size={16} /> New Client
        </Link>
      </div>
      <div className="flex gap-3 mt-3">
        <Link to="/invoices" className="flex-1 text-center border border-frost-border text-frost-dim rounded-xl py-3 font-bold text-sm uppercase tracking-wide hover:border-frost-blue transition-colors">
          🧾 Invoices
        </Link>
        <Link to="/workers" className="flex-1 text-center border border-frost-border text-frost-dim rounded-xl py-3 font-bold text-sm uppercase tracking-wide hover:border-frost-blue transition-colors">
          👷 Workers
        </Link>
      </div>
    </div>
  )
}
