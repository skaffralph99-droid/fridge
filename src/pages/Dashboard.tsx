import { useLang } from '../lib/i18n'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { LogOut, Plus, TrendingUp, ChevronRight } from 'lucide-react'

export default function Dashboard() {
  const { tr, dir } = useLang()
  const { signOut } = useAuth()
  const [rooms, setRooms] = useState<any[]>([])
  const [clientCount, setClientCount] = useState(0)
  const [recentTx, setRecentTx] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      supabase.from('fridge_rooms').select('*').eq('is_active', true).order('name'),
      supabase.from('fridge_clients').select('*', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('fridge_transactions').select('*, fridge_clients(name), fridge_rooms(name)').order('created_at', { ascending: false }).limit(4),
    ]).then(([{ data: r }, { count: c }, { data: tx }]) => {
      if (r) setRooms(r)
      setClientCount(c ?? 0)
      if (tx) setRecentTx(tx)
      setLoading(false)
    })
  }, [])

  if (loading) return <div className="flex items-center justify-center h-screen"><div className="w-10 h-10 border-4 border-frost-blue border-t-transparent rounded-full animate-spin" /></div>

  const totalCap = rooms.reduce((s, r) => s + parseFloat(r.capacity_tonnes), 0)
  const totalUsed = rooms.reduce((s, r) => s + parseFloat(r.current_tonnes), 0)
  const occupancy = totalCap ? Math.round((totalUsed / totalCap) * 100) : 0

  return (
    <div className="p-5 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-2xl font-black text-frost-steel">{tr('dashboard')} ❄️</h1>
          <p className="text-frost-dim text-xs mt-1">{format(new Date(), 'EEEE, MMM dd')}</p>
        </div>
        <button onClick={signOut} className="text-frost-dim hover:text-red-400 p-2 mt-1"><LogOut size={18} /></button>
      </div>

      {/* Main KPI */}
      <div className="card mb-5">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-frost-dim text-xs mb-1">إجمالي المخزون</p>
            <p className="text-4xl font-black text-frost-steel">{totalUsed.toLocaleString()}<span className="text-lg text-frost-dim ml-1">t</span></p>
          </div>
          <div className="text-right">
            <p className="text-frost-dim text-xs mb-1">of {totalCap.toLocaleString()}t</p>
            <p className={`text-2xl font-black ${occupancy > 80 ? 'text-red-400' : occupancy > 50 ? 'text-yellow-300' : 'text-green-400'}`}>{occupancy}%</p>
          </div>
        </div>
        <div className="h-2 bg-frost-elevated rounded-full overflow-hidden mt-4">
          <div className={`h-full rounded-full transition-all ${occupancy > 80 ? 'bg-red-500' : occupancy > 50 ? 'bg-yellow-400' : 'bg-green-400'}`} style={{ width: `${occupancy}%` }} />
        </div>
        <div className="flex justify-between mt-2 text-frost-dim text-xs">
          <span>{clientCount} clients</span>
          <span>{(totalCap - totalUsed).toLocaleString()}t free</span>
        </div>
      </div>

      {/* Analytics Link */}
      <Link to="/analytics" className="card mb-5 flex items-center gap-3 hover:border-frost-blue transition-colors">
        <div className="w-10 h-10 rounded-xl bg-frost-blue/15 flex items-center justify-center shrink-0">
          <TrendingUp size={18} className="text-frost-blue" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-frost-steel font-bold text-sm">تحليلات الإيرادات</p>
          <p className="text-frost-dim text-xs">الأرباح الفعلية مقابل المحتملة</p>
        </div>
        <ChevronRight size={16} className="text-frost-dim shrink-0" />
      </Link>

      {/* Rooms */}
      <p className="section-title">{tr('rooms')}</p>
      <div className="space-y-2 mb-2">
        {rooms.map(r => {
          const pct = parseFloat(r.capacity_tonnes) > 0 ? (parseFloat(r.current_tonnes) / parseFloat(r.capacity_tonnes)) * 100 : 0
          const barColor = pct > 85 ? 'bg-red-500' : pct > 60 ? 'bg-yellow-400' : 'bg-green-400'
          const textColor = pct > 85 ? 'text-red-400' : pct > 60 ? 'text-yellow-400' : 'text-green-400'
          return (
            <Link key={r.id} to={`/rooms/${r.id}`} className="card flex items-center gap-4 hover:border-frost-blue transition-colors py-3">
              <div className="flex-1 min-w-0">
                <p className="text-frost-steel font-semibold">{r.name}</p>
                <p className="text-frost-dim text-xs mt-0.5">{parseFloat(r.current_tonnes)}t / {parseFloat(r.capacity_tonnes)}t</p>
              </div>
              <div className="w-16">
                <div className="h-1.5 bg-frost-elevated rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
                </div>
              </div>
              <p className={`text-sm font-bold min-w-[36px] text-right ${textColor}`}>{Math.round(pct)}%</p>
            </Link>
          )
        })}
      </div>

      {/* Recent Activity */}
      <p className="section-title">{tr('recentActivity')}</p>
      {recentTx.length === 0 ? (
        <p className="text-frost-dim text-sm text-center py-6">لا توجد حركات بعد</p>
      ) : (
        <div className="space-y-2 mb-2">
          {recentTx.map(tx => (
            <Link to={`/transactions/${tx.id}`} key={tx.id} className="card flex items-center gap-3 py-3 hover:border-frost-blue transition-colors">
              <span className={`text-[10px] font-black px-2 py-1 rounded-md ${tx.type === 'in' ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'}`}>
                {tx.type === 'in' ? 'IN' : 'OUT'}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-frost-steel text-sm font-medium truncate">{tx.fridge_clients?.name}</p>
                <p className="text-frost-dim text-xs">{tx.product_type} · {tx.fridge_rooms?.name} · {format(new Date(tx.date), 'MMM dd')}</p>
              </div>
              <p className={`font-bold text-sm ${tx.type === 'in' ? 'text-green-400' : 'text-red-400'}`}>
                {tx.type === 'in' ? '+' : '−'}{parseFloat(tx.tonnes)}t
              </p>
            </Link>
          ))}
        </div>
      )}

      {/* Quick Actions */}
      <div className="mt-6 space-y-3">
        <Link to="/transactions/new" className="btn-blue flex items-center justify-center gap-2">
          <Plus size={16} /> حركة جديدة
        </Link>
        <div className="flex gap-3">
          <Link to="/clients/new" className="flex-1 text-center border border-frost-border text-frost-dim rounded-xl py-3 text-sm font-semibold hover:border-frost-blue transition-colors">+ Client</Link>
          <Link to="/invoices" className="flex-1 text-center border border-frost-border text-frost-dim rounded-xl py-3 text-sm font-semibold hover:border-frost-blue transition-colors">الفواتير</Link>
        </div>
      </div>
    </div>
  )
}
