import { useLang } from '../lib/i18n'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { LogOut, TrendingUp, ChevronRight, ArrowLeftRight, Users, FileText, HardHat, AlertTriangle, Trash2, Snowflake, Plus } from 'lucide-react'

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

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[80vh]">
      <div className="text-6xl mb-5 animate-float">❄️</div>
      <p className="text-gradient-blue text-xl font-black tracking-wider animate-fade-up delay-2">Fridge Manager</p>
      <div className="flex gap-1.5 mt-4">
        <div className="w-2 h-2 rounded-full bg-frost-blue animate-pulse" /><div className="w-2 h-2 rounded-full bg-frost-blue animate-pulse delay-2" /><div className="w-2 h-2 rounded-full bg-frost-blue animate-pulse delay-4" />
      </div>
    </div>
  )

  const totalCap = rooms.reduce((s, r) => s + parseFloat(r.capacity_tonnes), 0)
  const totalUsed = rooms.reduce((s, r) => s + parseFloat(r.current_tonnes), 0)
  const occupancy = totalCap ? Math.round((totalUsed / totalCap) * 100) : 0
  const criticalRooms = rooms.filter(r => (parseFloat(r.current_tonnes) / parseFloat(r.capacity_tonnes)) >= 0.9)

  return (
    <div className="p-5 max-w-lg mx-auto pb-24">
      {/* Header */}
      <div className="flex justify-between items-start mb-6 animate-fade-up">
        <div>
          <p className="text-frost-dim text-xs font-bold tracking-[0.15em] flex items-center gap-1.5 mb-1"><Snowflake size={12} className="text-frost-blue" /> {format(new Date(), 'EEEE, dd MMM')}</p>
          <h1 className="text-2xl font-black text-frost-steel">مرحباً 👋</h1>
        </div>
        <button onClick={signOut} className="text-frost-dim hover:text-red-400 transition-colors p-2 mt-1 border border-frost-border rounded-lg hover:border-red-400/30"><LogOut size={16} /></button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="card kpi-cyan animate-fade-up delay-1">
          <div className="flex items-center gap-2 mb-2"><div className="w-7 h-7 rounded-lg bg-cyan-500/20 flex items-center justify-center"><span className="text-sm">📦</span></div><p className="text-cyan-300 text-[10px] font-bold">المخزون</p></div>
          <p className="text-3xl font-black text-white">{totalUsed.toLocaleString()}<span className="text-sm text-frost-dim mr-1">t</span></p>
          <p className="text-cyan-300/50 text-[10px] mt-0.5">من {totalCap.toLocaleString()} طن</p>
        </div>
        <div className={`card animate-fade-up delay-2 animate-glow ${occupancy > 80 ? 'kpi-red' : occupancy > 50 ? 'kpi-amber' : 'kpi-green'}`}>
          <div className="flex items-center gap-2 mb-2"><div className={`w-7 h-7 rounded-lg flex items-center justify-center ${occupancy > 80 ? 'bg-red-500/20' : occupancy > 50 ? 'bg-amber-500/20' : 'bg-green-500/20'}`}><span className="text-sm">📊</span></div><p className={`text-[10px] font-bold ${occupancy > 80 ? 'text-red-300' : occupancy > 50 ? 'text-amber-300' : 'text-green-300'}`}>الإشغال</p></div>
          <p className={`text-3xl font-black ${occupancy > 80 ? 'text-red-400' : occupancy > 50 ? 'text-amber-400' : 'text-green-400'}`}>{occupancy}%</p>
          <p className="text-frost-dim/50 text-[10px] mt-0.5">{(totalCap - totalUsed).toLocaleString()}t فارغ</p>
        </div>
        <div className="card kpi-blue animate-fade-up delay-3">
          <div className="flex items-center gap-2 mb-2"><div className="w-7 h-7 rounded-lg bg-blue-500/20 flex items-center justify-center"><span className="text-sm">👥</span></div><p className="text-blue-300 text-[10px] font-bold">الزبائن</p></div>
          <p className="text-3xl font-black text-white">{clientCount}</p>
          <p className="text-blue-300/50 text-[10px] mt-0.5">زبون نشط</p>
        </div>
        <div className={`card animate-fade-up delay-4 ${pendingPayments > 0 ? 'kpi-amber' : 'kpi-green'}`}>
          <div className="flex items-center gap-2 mb-2"><div className={`w-7 h-7 rounded-lg flex items-center justify-center ${pendingPayments > 0 ? 'bg-amber-500/20' : 'bg-green-500/20'}`}><span className="text-sm">💵</span></div><p className={`text-[10px] font-bold ${pendingPayments > 0 ? 'text-amber-300' : 'text-green-300'}`}>مستحقات</p></div>
          <p className={`text-3xl font-black ${pendingPayments > 0 ? 'text-amber-400' : 'text-green-400'}`}>${pendingPayments.toLocaleString()}</p>
          <p className="text-frost-dim/50 text-[10px] mt-0.5">{pendingPayments > 0 ? 'معلّقة' : 'لا مستحقات'}</p>
        </div>
      </div>

      {/* New Transaction Button */}
      <Link to="/transactions/new" className="block mb-5 animate-fade-up delay-5">
        <div className="relative overflow-hidden rounded-2xl p-4" style={{ background: 'linear-gradient(135deg, #2563EB, #3B82F6, #60A5FA)' }}>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center"><Plus size={24} className="text-white" /></div>
            <div>
              <p className="text-white font-black text-base">{tr('newTransaction')}</p>
              <p className="text-white/70 text-xs">إدخال أو إخراج بضاعة</p>
            </div>
          </div>
          <div className="absolute -left-4 -bottom-4 w-24 h-24 rounded-full bg-white/10" />
          <div className="absolute -left-8 -top-8 w-20 h-20 rounded-full bg-white/5" />
        </div>
      </Link>

      {/* Capacity Alert */}
      {criticalRooms.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 mb-5 flex items-center gap-3 animate-scale-in delay-5">
          <AlertTriangle size={20} className="text-red-400 shrink-0" />
          <div>
            <p className="text-red-400 font-bold text-sm">تنبيه سعة!</p>
            <p className="text-frost-dim text-xs">{criticalRooms.map(r => r.name).join('، ')} — فوق 90%</p>
          </div>
        </div>
      )}

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-3 mb-5 animate-fade-up delay-6">
        <Link to="/analytics" className="card kpi-blue flex items-center gap-3 hover:-translate-y-0.5 transition-all duration-200">
          <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center"><TrendingUp size={18} className="text-blue-400" /></div>
          <div><p className="text-frost-steel text-sm font-bold">{tr('analytics')}</p><p className="text-frost-dim text-[10px]">تقارير</p></div>
        </Link>
        <Link to="/workers" className="card kpi-amber flex items-center gap-3 hover:-translate-y-0.5 transition-all duration-200">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center"><HardHat size={18} className="text-amber-400" /></div>
          <div><p className="text-frost-steel text-sm font-bold">{tr('workers')}</p><p className="text-frost-dim text-[10px]">الأجور</p></div>
        </Link>
      </div>

      {/* Rooms */}
      <div className="animate-fade-up delay-7">
        <p className="section-title">{tr('rooms')}</p>
        <div className="space-y-2.5 mb-6">
          {rooms.map((r, i) => {
            const pct = Math.round((parseFloat(r.current_tonnes) / parseFloat(r.capacity_tonnes)) * 100)
            const color = pct >= 90 ? '#ef4444' : pct >= 70 ? '#f59e0b' : pct >= 50 ? '#22d3ee' : '#4ade80'
            return (
              <Link key={r.id} to={`/rooms/${r.id}`} className={`card flex items-center gap-4 hover:-translate-y-0.5 transition-all duration-200 animate-slide-right delay-${Math.min(i + 7, 10)}`}>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl" style={{ background: color + '15' }}>❄️</div>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1.5">
                    <p className="text-frost-steel font-bold text-sm">{r.name}</p>
                    <p className="text-sm font-black" style={{ color }}>{pct}%</p>
                  </div>
                  <div className="h-2 bg-frost-elevated rounded-full overflow-hidden">
                    <div className="h-full rounded-full animate-bar transition-all" style={{ width: `${Math.min(pct, 100)}%`, background: `linear-gradient(90deg, ${color}88, ${color})` }} />
                  </div>
                  <p className="text-frost-dim text-[10px] mt-1.5">{parseFloat(r.current_tonnes).toFixed(0)} / {parseFloat(r.capacity_tonnes)}t</p>
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="animate-fade-up delay-9">
        <p className="section-title">{tr('recentActivity')}</p>
        {recentTx.length === 0 ? (
          <p className="text-frost-dim text-sm text-center py-8">لا توجد حركات بعد</p>
        ) : (
          <div className="card divide-y divide-frost-border/30 mb-6">
            {recentTx.map((tx, i) => (
              <Link to={`/transactions/${tx.id}`} key={tx.id} className={`flex items-center gap-3 py-3 first:pt-1 last:pb-1 hover:opacity-80 transition-all animate-fade-in delay-${Math.min(i + 9, 10)}`}>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm shrink-0 ${tx.type === 'in' ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'}`}>
                  {tx.type === 'in' ? '▼' : '▲'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-frost-steel text-sm font-bold truncate">{tx.fridge_clients?.name}</p>
                  <p className="text-frost-dim text-[10px]">{tx.product_type} · {tx.fridge_rooms?.name}</p>
                </div>
                <div className="text-left shrink-0">
                  <p className="text-frost-steel font-black">{parseFloat(tx.tonnes)}t</p>
                  <p className="text-frost-dim text-[10px]">{tx.date ? format(new Date(tx.date), 'dd/MM') : ''}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="animate-fade-up delay-10">
        <p className="section-title">{tr('quickActions')}</p>
        <div className="space-y-2">
          <Link to="/clients/new" className="card flex items-center gap-3 py-3 hover:border-frost-blue/40 hover:-translate-y-0.5 transition-all duration-200"><div className="w-8 h-8 rounded-lg bg-purple-500/15 flex items-center justify-center"><Users size={16} className="text-purple-400" /></div><span className="text-frost-steel text-sm font-bold">{tr('newClient')}</span></Link>
          <Link to="/invoices/new" className="card flex items-center gap-3 py-3 hover:border-frost-blue/40 hover:-translate-y-0.5 transition-all duration-200"><div className="w-8 h-8 rounded-lg bg-green-500/15 flex items-center justify-center"><FileText size={16} className="text-green-400" /></div><span className="text-frost-steel text-sm font-bold">{tr('newInvoice')}</span></Link>
        </div>
      </div>

      {/* Reset */}
      <div className="mt-10 pt-6 border-t border-frost-border/20">
        <button
          disabled={resetting}
          onClick={async () => {
            if (!confirm('⚠️ هل أنت متأكد؟ سيتم حذف جميع البيانات وإعادة الغرف إلى صفر.')) return
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
          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-red-500/20 text-red-400/70 text-xs font-bold hover:bg-red-500/10 hover:text-red-400 transition-all"
        >
          <Trash2 size={14} />
          {resetting ? 'جاري الحذف...' : 'حذف جميع البيانات'}
        </button>
      </div>
    </div>
  )
}
