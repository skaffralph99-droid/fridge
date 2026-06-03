import { useLang } from '../lib/i18n'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ArrowLeft, TrendingDown } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

const COLORS = ['#3B82F6', '#22D3EE', '#34D399', '#FBBF24', '#F97316', '#EF4444', '#A78BFA']

export default function Analytics() {
  const { tr, dir } = useLang()
  const [rooms, setRooms] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [inventory, setInventory] = useState<any[]>([])
  const [invoices, setInvoices] = useState<any[]>([])
  const [workerCosts, setWorkerCosts] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      supabase.from('fridge_rooms').select('*').eq('is_active', true).order('name'),
      supabase.from('fridge_clients').select('*').eq('is_active', true),
      supabase.from('fridge_inventory').select('*, fridge_clients(name, rate_per_tonne)').gt('tonnes', 0),
      supabase.from('fridge_invoices').select('*'),
      supabase.from('fridge_transaction_workers').select('amount'),
    ]).then(([{ data: r }, { data: c }, { data: inv }, { data: invoic }, { data: tw }]) => {
      setRooms(r ?? []); setClients(c ?? []); setInventory(inv ?? []); setInvoices(invoic ?? [])
      setWorkerCosts(tw?.reduce((s, w) => s + parseFloat(w.amount), 0) ?? 0)
      setLoading(false)
    })
  }, [])

  if (loading) return <div className="flex items-center justify-center h-screen"><div className="w-10 h-10 border-4 border-frost-blue border-t-transparent rounded-full animate-spin" /></div>

  const totalCap = rooms.reduce((s, r) => s + parseFloat(r.capacity_tonnes), 0)
  const totalStored = rooms.reduce((s, r) => s + parseFloat(r.current_tonnes), 0)
  const avgRate = clients.length > 0 ? clients.reduce((s, c) => s + parseFloat(c.rate_per_tonne), 0) / clients.length : 45
  const actualRev = inventory.reduce((s, i) => s + parseFloat(i.tonnes) * (i.fridge_clients?.rate_per_tonne ? parseFloat(i.fridge_clients.rate_per_tonne) : 45), 0)
  const maxRev = totalCap * avgRate
  const gap = maxRev - actualRev
  const revPct = maxRev > 0 ? Math.round((actualRev / maxRev) * 100) : 0
  const invoicePaid = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + parseFloat(i.amount), 0)
  const invoicePending = invoices.filter(i => i.status !== 'paid').reduce((s, i) => s + parseFloat(i.amount), 0)

  const roomData = rooms.map(r => ({
    name: r.name.replace('غرفة ', 'R'),
    used: parseFloat(r.current_tonnes),
    free: parseFloat(r.capacity_tonnes) - parseFloat(r.current_tonnes),
  }))

  const clientTonnes: Record<string, number> = {}
  inventory.forEach(i => { clientTonnes[i.fridge_clients?.name ?? '?'] = (clientTonnes[i.fridge_clients?.name ?? '?'] ?? 0) + parseFloat(i.tonnes) })
  const pieData = Object.entries(clientTonnes).map(([name, value]) => ({ name, value: Math.round(value) })).sort((a, b) => b.value - a.value)

  const tt = { contentStyle: { background: '#132238', border: '1px solid #1E3350', borderRadius: 12, color: '#E8EDF2', fontSize: 13 } }

  return (
    <div className="p-5 max-w-lg mx-auto">
      <Link to="/" className="text-frost-blue text-sm font-semibold flex items-center gap-1 mb-6"><ArrowLeft size={16} /> Back</Link>

      {/* Revenue gauge */}
      <div className="card mb-5">
        <p className="text-frost-dim text-xs mb-4">الإيرادات الشهرية</p>
        <div className="flex items-end justify-between mb-4">
          <div>
            <p className="text-frost-dim text-[10px] uppercase mb-1">الفعلي</p>
            <p className="text-green-400 text-3xl font-black">${actualRev.toLocaleString()}</p>
          </div>
          <div className="text-right">
            <p className="text-frost-dim text-[10px] uppercase mb-1">المحتمل</p>
            <p className="text-frost-blue text-3xl font-black">${maxRev.toLocaleString()}</p>
          </div>
        </div>
        <div className="h-3 bg-frost-elevated rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-green-600 to-green-400 rounded-full" style={{ width: `${Math.max(3, revPct)}%` }} />
        </div>
        <p className="text-frost-dim text-xs text-center mt-2">{revPct}% of capacity</p>

        {gap > 0 && (
          <div className="mt-4 bg-red-500/8 border border-red-500/20 rounded-xl p-3 flex items-start gap-2">
            <TrendingDown size={16} className="text-red-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-red-400 text-sm font-semibold">${gap.toLocaleString()}/mo opportunity</p>
              <p className="text-frost-dim text-xs">تعبئة {(totalCap - totalStored).toLocaleString()}t مساحة إضافية</p>
            </div>
          </div>
        )}
      </div>

      {/* Room chart */}
      <div className="card mb-5">
        <p className="text-frost-dim text-xs mb-3">إشغال الغرف</p>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={roomData} barGap={2}>
            <XAxis dataKey="name" tick={{ fill: '#7A8FA6', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#7A8FA6', fontSize: 10 }} axisLine={false} tickLine={false} width={35} />
            <Tooltip {...tt} formatter={(v: any) => [`${v}t`]} />
            <Bar dataKey="used" stackId="a" fill="#3B82F6" name="مخزّن" />
            <Bar dataKey="free" stackId="a" fill="#1A2D47" radius={[4, 4, 0, 0]} name="فارغ" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Client pie */}
      {pieData.length > 0 && (
        <div className="card mb-5">
          <p className="text-frost-dim text-xs mb-3">التخزين حسب الزبون</p>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="value">
                {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip {...tt} formatter={(v: any) => [`${v}t`]} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-x-4 gap-y-1 justify-center mt-2">
            {pieData.map((d, i) => (
              <span key={d.name} className="text-xs text-frost-dim flex items-center gap-1">
                <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                {d.name} ({d.value}t)
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Financials */}
      <div className="card">
        <p className="text-frost-dim text-xs mb-4">الحسابات</p>
        <div className="space-y-3">
          <div className="flex justify-between"><span className="text-frost-dim text-sm">الإيرادات</span><span className="text-green-400 font-bold">${actualRev.toLocaleString()}/mo</span></div>
          <div className="flex justify-between"><span className="text-frost-dim text-sm">المحصّل</span><span className="text-green-400 font-semibold">${invoicePaid.toLocaleString()}</span></div>
          <div className="flex justify-between"><span className="text-frost-dim text-sm">المعلّق</span><span className="text-yellow-300 font-semibold">${invoicePending.toLocaleString()}</span></div>
          <div className="flex justify-between"><span className="text-frost-dim text-sm">تكاليف العمالة</span><span className="text-red-400 font-semibold">-${workerCosts.toLocaleString()}</span></div>
          <div className="border-t border-frost-border pt-3 flex justify-between">
            <span className="text-frost-steel font-bold">صافي الربح</span>
            <span className="text-frost-steel font-black text-lg">${(actualRev - workerCosts).toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
