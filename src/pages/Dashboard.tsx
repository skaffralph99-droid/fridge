import { useLang } from '../lib/i18n'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { LogOut, ArrowLeftRight, Users, FileText, HardHat, BarChart3, AlertTriangle } from 'lucide-react'

export default function Dashboard() {
  const { tr, dir } = useLang()
  const { signOut } = useAuth()
  const [rooms, setRooms] = useState<any[]>([])
  const [clientCount, setClientCount] = useState(0)
  const [recentTx, setRecentTx] = useState<any[]>([])
  const [pendingPayments, setPendingPayments] = useState(0)
  const [revenueThisMonth, setRevenueThisMonth] = useState(0)
  const [revenueLastMonth, setRevenueLastMonth] = useState(0)

  useEffect(() => {
    const now = new Date()
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0]
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0]

    Promise.all([
      supabase.from('fridge_rooms').select('*').eq('is_active', true).order('name'),
      supabase.from('fridge_clients').select('*', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('fridge_transactions').select('*, fridge_clients(name), fridge_rooms(name), fridge_transaction_workers(earnings, fridge_workers(name))').order('created_at', { ascending: false }).limit(5),
      supabase.from('fridge_invoices').select('amount').eq('status', 'pending'),
      supabase.from('fridge_invoices').select('amount').eq('status', 'paid').gte('paid_date', thisMonthStart),
      supabase.from('fridge_invoices').select('amount').eq('status', 'paid').gte('paid_date', lastMonthStart).lte('paid_date', lastMonthEnd),
    ]).then(([roomsR, clientsR, txR, pendingR, thisMonthR, lastMonthR]) => {
      setRooms(roomsR.data ?? [])
      setClientCount(clientsR.count ?? 0)
      setRecentTx(txR.data ?? [])
      setPendingPayments((pendingR.data ?? []).reduce((s: number, i: any) => s + parseFloat(i.amount), 0))
      setRevenueThisMonth((thisMonthR.data ?? []).reduce((s: number, i: any) => s + parseFloat(i.amount), 0))
      setRevenueLastMonth((lastMonthR.data ?? []).reduce((s: number, i: any) => s + parseFloat(i.amount), 0))
    })
  }, [])

  const totalStored = rooms.reduce((s, r) => s + parseFloat(r.current_tonnes || 0), 0)
  const totalCapacity = rooms.reduce((s, r) => s + parseFloat(r.capacity_tonnes || 0), 0)
  const occupancyPct = totalCapacity > 0 ? Math.round((totalStored / totalCapacity) * 100) : 0
  const criticalRooms = rooms.filter(r => (parseFloat(r.current_tonnes) / parseFloat(r.capacity_tonnes)) >= 0.9)
  const revChange = revenueLastMonth > 0 ? Math.round(((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100) : 0

  return (
    <div dir={dir} className="p-5 max-w-lg mx-auto pb-24">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-black text-frost-steel">❄️ {tr('dashboard')}</h1>
          <p className="text-frost-dim text-sm">{format(new Date(), 'EEEE, dd MMM yyyy')}</p>
        </div>
        <button onClick={signOut} className="text-frost-dim hover:text-red-400 p-2"><LogOut size={18} /></button>
      </div>

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "20px" }}>
        <div className="card" style={{ textAlign: "center" }}>
          <p className="text-frost-dim text-[10px] uppercase font-bold tracking-wider">المخزون</p>
          <p className="text-frost-steel font-black text-2xl mt-1">{totalStored.toFixed(0)}t</p>
          <div className="w-full bg-frost-elevated rounded-full h-1.5 mt-2">
            <div className={`h-1.5 rounded-full ${occupancyPct >= 90 ? 'bg-red-500' : occupancyPct >= 70 ? 'bg-yellow-500' : 'bg-frost-blue'}`} style={{ width: `${Math.min(occupancyPct, 100)}%` }} />
          </div>
          <p className="text-frost-dim text-[10px] mt-1">{occupancyPct}% من السعة</p>
        </div>
        <div className="card" style={{ textAlign: "center" }}>
          <p className="text-frost-dim text-[10px] uppercase font-bold tracking-wider">مستحقات معلّقة</p>
          <p className={`font-black text-2xl mt-1 ${pendingPayments > 0 ? 'text-yellow-400' : 'text-frost-blue'}`}>${pendingPayments.toLocaleString()}</p>
          <p className="text-frost-dim text-[10px] mt-1">{clientCount} زبون</p>
        </div>
      </div>

      {/* Revenue */}
      <div className="card mb-5 flex justify-between items-center">
        <div>
          <p className="text-frost-dim text-[10px] uppercase font-bold tracking-wider">إيرادات هذا الشهر</p>
          <p className="text-frost-steel font-black text-xl mt-1">${revenueThisMonth.toLocaleString()}</p>
        </div>
        {revenueLastMonth > 0 && (
          <div className={`text-sm font-bold px-3 py-1 rounded-full ${revChange >= 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
            {revChange >= 0 ? '↑' : '↓'} {Math.abs(revChange)}%
          </div>
        )}
      </div>

      {/* Capacity Alert */}
      {criticalRooms.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 mb-5 flex items-center gap-3">
          <AlertTriangle size={20} className="text-red-400 shrink-0" />
          <div>
            <p className="text-red-400 font-bold text-sm">تنبيه سعة!</p>
            <p className="text-frost-dim text-xs">{criticalRooms.map(r => r.name).join('، ')} — فوق 90%</p>
          </div>
        </div>
      )}

      {/* Rooms */}
      <p className="section-title mb-3">{tr('rooms')}</p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "20px" }}>
        {rooms.map(r => {
          const pct = Math.round((parseFloat(r.current_tonnes) / parseFloat(r.capacity_tonnes)) * 100)
          const color = pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-yellow-500' : 'bg-frost-blue'
          return (
            <Link key={r.id} to={`/rooms/${r.id}`} className="card hover:border-frost-blue transition-colors py-3">
              <div className="flex justify-between items-center mb-2">
                <p className="text-frost-steel font-bold text-sm">{r.name}</p>
                <p className={`text-xs font-bold ${pct >= 90 ? 'text-red-400' : pct >= 70 ? 'text-yellow-400' : 'text-frost-blue'}`}>{pct}%</p>
              </div>
              <div className="w-full bg-frost-elevated rounded-full h-1.5">
                <div className={`h-1.5 rounded-full transition-all ${color}`} style={{ width: `${Math.min(pct, 100)}%` }} />
              </div>
              <p className="text-frost-dim text-[10px] mt-1">{parseFloat(r.current_tonnes).toFixed(0)} / {parseFloat(r.capacity_tonnes)}t</p>
            </Link>
          )
        })}
      </div>

      {/* Recent Activity */}
      <p className="section-title mb-3">{tr('recentActivity')}</p>
      {recentTx.length === 0 ? (
        <p className="text-frost-dim text-sm text-center py-6">لا توجد حركات بعد</p>
      ) : (
        <div className="space-y-2 mb-5">
          {recentTx.map(tx => (
            <Link to={`/transactions/${tx.id}`} key={tx.id} className="card flex items-center gap-3 py-3 hover:border-frost-blue transition-colors">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm shrink-0 ${tx.type === 'in' ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'}`}>
                {tx.type === 'in' ? '▼' : '▲'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-frost-steel text-sm font-bold truncate">{tx.fridge_clients?.name}</p>
                <p className="text-frost-dim text-xs">{tx.product_type} · {tx.fridge_rooms?.name}</p>
              </div>
              <div className="text-left shrink-0">
                <p className="text-frost-steel font-black">{parseFloat(tx.tonnes)}t</p>
                <p className="text-frost-dim text-[10px]">{tx.date ? format(new Date(tx.date), 'dd/MM') : ''}</p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Quick Actions */}
      <p className="section-title mb-3">{tr('quickActions')}</p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
        <Link to="/transactions/new" className="card flex items-center gap-3 py-3 hover:border-frost-blue"><ArrowLeftRight size={18} className="text-frost-blue" /><span className="text-frost-steel text-sm font-bold">{tr('newTransaction')}</span></Link>
        <Link to="/clients/new" className="card flex items-center gap-3 py-3 hover:border-frost-blue"><Users size={18} className="text-frost-blue" /><span className="text-frost-steel text-sm font-bold">{tr('newClient')}</span></Link>
        <Link to="/invoices/new" className="card flex items-center gap-3 py-3 hover:border-frost-blue"><FileText size={18} className="text-frost-blue" /><span className="text-frost-steel text-sm font-bold">{tr('newInvoice')}</span></Link>
        <Link to="/analytics" className="card flex items-center gap-3 py-3 hover:border-frost-blue"><BarChart3 size={18} className="text-frost-blue" /><span className="text-frost-steel text-sm font-bold">{tr('analytics')}</span></Link>
      </div>
    </div>
  )
}
