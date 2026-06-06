import { useLang } from '../lib/i18n'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { LogOut, TrendingUp, ChevronRight, ArrowLeftRight, Users, FileText, HardHat, AlertTriangle, Trash2 } from 'lucide-react'

export default function Dashboard() {
  const { tr } = useLang()
  const { signOut } = useAuth()
  const [rooms, setRooms] = useState<any[]>([])
  const [clientCount, setClientCount] = useState(0)
  const [recentTx, setRecentTx] = useState<any[]>([])
  const [pendingPayments, setPendingPayments] = useState(0)
  const [loading, setLoading] = useState(true)
  const [resetting, setResetting] = useState(false)

  useEffect(() => {
    Promise.all([
      supabase.from('fridge_rooms').select('*').eq('is_active', true).order('name'),
      supabase.from('fridge_clients').select('*', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('fridge_transactions').select('*, fridge_clients(name), fridge_rooms(name), fridge_transaction_workers(earnings, fridge_workers(name))').order('created_at', { ascending: false }).limit(5),
      supabase.from('fridge_invoices').select('amount').eq('status', 'pending'),
    ]).then(([{ data: r }, { count: c }, { data: tx }, { data: pend }]) => {
      if (r) setRooms(r)
      setClientCount(c ?? 0)
      if (tx) setRecentTx(tx)
      setPendingPayments((pend ?? []).reduce((s: number, i: any) => s + parseFloat(i.amount), 0))
      setLoading(false)
    })
  }, [])

  if (loading) return <div className="flex items-center justify-center h-screen"><div className="w-10 h-10 border-4 border-frost-blue border-t-transparent rounded-full animate-spin" /></div>

  const totalCap = rooms.reduce((s, r) => s + parseFloat(r.capacity_tonnes), 0)
  const totalUsed = rooms.reduce((s, r) => s + parseFloat(r.current_tonnes), 0)
  const occupancy = totalCap ? Math.round((totalUsed / totalCap) * 100) : 0
  const criticalRooms = rooms.filter(r => (parseFloat(r.current_tonnes) / parseFloat(r.capacity_tonnes)) >= 0.9)

  return (
    <div className="p-5 max-w-lg mx-auto pb-24">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-2xl font-black text-frost-steel">❄️ {tr('dashboard')}</h1>
          <p className="text-frost-dim text-xs mt-1">{format(new Date(), 'EEEE, MMM dd')}</p>
        </div>
        <button onClick={signOut} className="text-frost-dim hover:text-red-400 p-2 mt-1"><LogOut size={18} /></button>
      </div>

      {/* Main KPI */}
      <div className="card mb-5">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-frost-dim text-xs mb-1">إجمالي المخزون</p>
            <p className="text-4xl font-black text-frost-steel">{totalUsed.toLocaleString()}<span className="text-lg text-frost-dim mr-1">t</span></p>
          </div>
          <div className="text-left">
            <p className="text-frost-dim text-xs mb-1">من {totalCap.toLocaleString()}t</p>
            <p className={`text-2xl font-black ${occupancy > 80 ? 'text-red-400' : occupancy > 50 ? 'text-yellow-300' : 'text-green-400'}`}>{occupancy}%</p>
          </div>
        </div>
        <div className="h-2 bg-frost-elevated rounded-full overflow-hidden mt-4">
          <div className={`h-full rounded-full transition-all ${occupancy > 80 ? 'bg-red-500' : occupancy > 50 ? 'bg-yellow-400' : 'bg-green-400'}`} style={{ width: `${occupancy}%` }} />
        </div>
        <div className="flex justify-between mt-2 text-frost-dim text-xs">
          <span>{clientCount} زبون</span>
          <span>{(totalCap - totalUsed).toLocaleString()}t free</span>
        </div>
      </div>

      {/* Pending Payments */}
      {pendingPayments > 0 && (
        <div className="card mb-5 flex items-center justify-between">
          <div>
            <p className="text-frost-dim text-xs">مستحقات معلّقة</p>
            <p className="text-yellow-400 font-black text-xl">${pendingPayments.toLocaleString()}</p>
          </div>
          <Link to="/invoices" className="text-frost-blue text-sm font-bold">عرض الفواتير →</Link>
        </div>
      )}

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

      {/* Analytics Link */}
      <Link to="/analytics" className="card mb-3 flex items-center gap-3 hover:border-frost-blue transition-colors">
        <div className="w-10 h-10 rounded-xl bg-frost-blue/15 flex items-center justify-center shrink-0">
          <TrendingUp size={18} className="text-frost-blue" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-frost-steel font-bold text-sm">{tr('analytics')}</p>
          <p className="text-frost-dim text-xs">الأرباح والإشغال والتفاصيل</p>
        </div>
        <ChevronRight size={16} className="text-frost-dim shrink-0" />
      </Link>

      {/* Workers Link */}
      <Link to="/workers" className="card mb-5 flex items-center gap-3 hover:border-frost-blue transition-colors">
        <div className="w-10 h-10 rounded-xl bg-orange-500/15 flex items-center justify-center shrink-0">
          <HardHat size={18} className="text-orange-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-frost-steel font-bold text-sm">{tr('workers')}</p>
          <p className="text-frost-dim text-xs">العمال والسائقين والأجور</p>
        </div>
        <ChevronRight size={16} className="text-frost-dim shrink-0" />
      </Link>

      {/* Rooms */}
      <p className="section-title">{tr('rooms')}</p>
      <div className="space-y-2 mb-6">
        {rooms.map(r => {
          const pct = Math.round((parseFloat(r.current_tonnes) / parseFloat(r.capacity_tonnes)) * 100)
          const color = pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-yellow-400' : 'bg-green-400'
          const textColor = pct >= 90 ? 'text-red-400' : pct >= 70 ? 'text-yellow-300' : 'text-frost-blue'
          return (
            <Link key={r.id} to={`/rooms/${r.id}`} className="card flex items-center gap-4 hover:border-frost-blue transition-colors py-3">
              <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                  <p className="text-frost-steel font-bold text-sm">{r.name}</p>
                  <p className={`text-sm font-black ${textColor}`}>{pct}%</p>
                </div>
                <div className="h-1.5 bg-frost-elevated rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                </div>
                <p className="text-frost-dim text-[10px] mt-1">{parseFloat(r.current_tonnes).toFixed(0)} / {parseFloat(r.capacity_tonnes)}t</p>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Recent Activity */}
      <p className="section-title">{tr('recentActivity')}</p>
      {recentTx.length === 0 ? (
        <p className="text-frost-dim text-sm text-center py-6">لا توجد حركات بعد</p>
      ) : (
        <div className="space-y-2 mb-6">
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
      <p className="section-title">{tr('quickActions')}</p>
      <div className="space-y-2">
        <Link to="/transactions/new" className="card flex items-center gap-3 py-3 hover:border-frost-blue"><ArrowLeftRight size={18} className="text-frost-blue" /><span className="text-frost-steel text-sm font-bold">{tr('newTransaction')}</span></Link>
        <Link to="/clients/new" className="card flex items-center gap-3 py-3 hover:border-frost-blue"><Users size={18} className="text-frost-blue" /><span className="text-frost-steel text-sm font-bold">{tr('newClient')}</span></Link>
        <Link to="/invoices/new" className="card flex items-center gap-3 py-3 hover:border-frost-blue"><FileText size={18} className="text-frost-blue" /><span className="text-frost-steel text-sm font-bold">{tr('newInvoice')}</span></Link>
      </div>

      {/* Reset */}
      <div className="mt-10 pt-6 border-t border-frost-border/30">
        <button
          disabled={resetting}
          onClick={async () => {
            if (!confirm('⚠️ هل أنت متأكد؟ سيتم حذف جميع البيانات (الزبائن، الحركات، العمال، الفواتير) وإعادة الغرف إلى صفر.')) return
            if (!confirm('تأكيد نهائي — لا يمكن التراجع. متأكد؟')) return
            setResetting(true)
            await supabase.from('fridge_transaction_workers').delete().neq('id', '00000000-0000-0000-0000-000000000000')
            await supabase.from('fridge_transactions').delete().neq('id', '00000000-0000-0000-0000-000000000000')
            await supabase.from('fridge_inventory').delete().neq('id', '00000000-0000-0000-0000-000000000000')
            await supabase.from('fridge_invoices').delete().neq('id', '00000000-0000-0000-0000-000000000000')
            await supabase.from('fridge_contracts').delete().neq('id', '00000000-0000-0000-0000-000000000000')
            await supabase.from('fridge_temp_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000')
            await supabase.from('fridge_clients').delete().neq('id', '00000000-0000-0000-0000-000000000000')
            await supabase.from('fridge_workers').delete().neq('id', '00000000-0000-0000-0000-000000000000')
            await supabase.from('fridge_rooms').update({ current_tonnes: 0 }).neq('id', '00000000-0000-0000-0000-000000000000')
            setResetting(false)
            window.location.reload()
          }}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-red-500/30 text-red-400 text-sm font-bold hover:bg-red-500/10 transition-colors"
        >
          <Trash2 size={16} />
          {resetting ? 'جاري الحذف...' : 'حذف جميع البيانات وإعادة التعيين'}
        </button>
      </div>
    </div>
  )
}
