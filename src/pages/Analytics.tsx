import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ArrowLeft, TrendingUp, TrendingDown, DollarSign } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'

const COLORS = ['#3B82F6', '#22D3EE', '#34D399', '#FBBF24', '#F97316', '#EF4444', '#A78BFA', '#EC4899']

export default function Analytics() {
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
      setRooms(r ?? [])
      setClients(c ?? [])
      setInventory(inv ?? [])
      setInvoices(invoic ?? [])
      setWorkerCosts(tw?.reduce((s, w) => s + parseFloat(w.amount), 0) ?? 0)
      setLoading(false)
    })
  }, [])

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-10 h-10 border-4 border-frost-blue border-t-transparent rounded-full animate-spin" /></div>

  // Calculations
  const totalCapacity = rooms.reduce((s, r) => s + parseFloat(r.capacity_tonnes), 0)
  const totalStored = rooms.reduce((s, r) => s + parseFloat(r.current_tonnes), 0)
  const avgRate = clients.length > 0 ? clients.reduce((s, c) => s + parseFloat(c.rate_per_tonne), 0) / clients.length : 45

  // Revenue: what we're actually earning (current inventory × their rates)
  const actualMonthlyRevenue = inventory.reduce((s, i) => {
    const rate = i.fridge_clients?.rate_per_tonne ? parseFloat(i.fridge_clients.rate_per_tonne) : 45
    return s + parseFloat(i.tonnes) * rate
  }, 0)

  // Potential: if facility was 100% full at average rate
  const maxMonthlyRevenue = totalCapacity * avgRate

  // Revenue gap
  const revenueGap = maxMonthlyRevenue - actualMonthlyRevenue
  const revenuePct = maxMonthlyRevenue > 0 ? Math.round((actualMonthlyRevenue / maxMonthlyRevenue) * 100) : 0

  // Invoices paid vs pending
  const invoicePaid = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + parseFloat(i.amount), 0)
  const invoicePending = invoices.filter(i => i.status !== 'paid').reduce((s, i) => s + parseFloat(i.amount), 0)

  // Room occupancy chart data
  const roomData = rooms.map(r => ({
    name: r.name.replace('Room ', 'R'),
    used: parseFloat(r.current_tonnes),
    free: parseFloat(r.capacity_tonnes) - parseFloat(r.current_tonnes),
    pct: parseFloat(r.capacity_tonnes) > 0 ? Math.round((parseFloat(r.current_tonnes) / parseFloat(r.capacity_tonnes)) * 100) : 0,
  }))

  // Revenue by client
  const clientRevenue: Record<string, number> = {}
  inventory.forEach(i => {
    const name = i.fridge_clients?.name ?? 'Unknown'
    const rate = i.fridge_clients?.rate_per_tonne ? parseFloat(i.fridge_clients.rate_per_tonne) : 45
    clientRevenue[name] = (clientRevenue[name] ?? 0) + parseFloat(i.tonnes) * rate
  })
  const clientRevenueData = Object.entries(clientRevenue)
    .map(([name, value]) => ({ name, value: Math.round(value) }))
    .sort((a, b) => b.value - a.value)

  // Tonnes by client for pie chart
  const clientTonnes: Record<string, number> = {}
  inventory.forEach(i => {
    const name = i.fridge_clients?.name ?? 'Unknown'
    clientTonnes[name] = (clientTonnes[name] ?? 0) + parseFloat(i.tonnes)
  })
  const clientTonnesData = Object.entries(clientTonnes)
    .map(([name, value]) => ({ name, value: Math.round(value) }))
    .sort((a, b) => b.value - a.value)

  const tooltipStyle = { contentStyle: { background: '#132238', border: '1px solid #253D5B', borderRadius: 10, color: '#E8EDF2', fontSize: 13 } }

  return (
    <div className="p-4 max-w-lg mx-auto">
      <Link to="/" className="text-frost-blue text-sm font-bold flex items-center gap-1 mb-4"><ArrowLeft size={16} /> Dashboard</Link>
      <h1 className="text-xl font-black text-frost-steel tracking-wide mb-6">📊 Analytics</h1>

      {/* Revenue vs Potential */}
      <div className="card mb-4">
        <h2 className="text-frost-dim text-[10px] font-bold uppercase tracking-widest mb-4">Revenue: Actual vs Potential</h2>
        <div className="flex justify-between items-end mb-3">
          <div>
            <p className="text-frost-dim text-xs">You're making</p>
            <p className="text-green-400 text-3xl font-black">${actualMonthlyRevenue.toLocaleString()}<span className="text-sm text-frost-dim">/mo</span></p>
          </div>
          <div className="text-right">
            <p className="text-frost-dim text-xs">You could make</p>
            <p className="text-frost-blue text-3xl font-black">${maxMonthlyRevenue.toLocaleString()}<span className="text-sm text-frost-dim">/mo</span></p>
          </div>
        </div>

        {/* Revenue bar */}
        <div className="h-8 bg-frost-elevated rounded-full overflow-hidden relative">
          <div className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full transition-all flex items-center justify-end pr-2"
            style={{ width: `${Math.max(5, revenuePct)}%` }}>
            <span className="text-xs font-black text-black">{revenuePct}%</span>
          </div>
        </div>

        <div className="mt-3 bg-red-500/10 border border-red-500/30 rounded-xl p-3">
          <div className="flex items-center gap-2">
            <TrendingDown size={16} className="text-red-400" />
            <p className="text-red-400 text-sm font-bold">You're leaving ${revenueGap.toLocaleString()}/mo on the table</p>
          </div>
          <p className="text-frost-dim text-xs mt-1">Fill {(totalCapacity - totalStored).toLocaleString()}t more to hit max revenue</p>
        </div>
      </div>

      {/* Room Occupancy Chart */}
      <div className="card mb-4">
        <h2 className="text-frost-dim text-[10px] font-bold uppercase tracking-widest mb-4">Room Occupancy</h2>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={roomData} barGap={4}>
            <XAxis dataKey="name" tick={{ fill: '#7A8FA6', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#7A8FA6', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip {...tooltipStyle} formatter={(v: number) => [`${v}t`, '']} />
            <Bar dataKey="used" stackId="a" fill="#3B82F6" radius={[0, 0, 0, 0]} name="Used" />
            <Bar dataKey="free" stackId="a" fill="#1A2D47" radius={[4, 4, 0, 0]} name="Free" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Revenue by Client */}
      {clientRevenueData.length > 0 && (
        <div className="card mb-4">
          <h2 className="text-frost-dim text-[10px] font-bold uppercase tracking-widest mb-4">Revenue by Client</h2>
          {clientRevenueData.map((c, i) => {
            const pct = actualMonthlyRevenue > 0 ? (c.value / actualMonthlyRevenue) * 100 : 0
            return (
              <div key={c.name} className="mb-3">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-frost-steel font-semibold">{c.name}</span>
                  <span className="text-green-400 font-bold">${c.value.toLocaleString()}</span>
                </div>
                <div className="h-2 bg-frost-elevated rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: COLORS[i % COLORS.length] }} />
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Storage Distribution Pie */}
      {clientTonnesData.length > 0 && (
        <div className="card mb-4">
          <h2 className="text-frost-dim text-[10px] font-bold uppercase tracking-widest mb-4">Storage by Client</h2>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={clientTonnesData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value"
                label={({ name, value }) => `${name}: ${value}t`} labelLine={false}>
                {clientTonnesData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip {...tooltipStyle} formatter={(v: number) => [`${v}t`, '']} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Financial Summary */}
      <div className="card mb-4">
        <h2 className="text-frost-dim text-[10px] font-bold uppercase tracking-widest mb-4">Financial Summary</h2>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-frost-dim text-sm">Current Monthly Revenue</span>
            <span className="text-green-400 font-black">${actualMonthlyRevenue.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-frost-dim text-sm">Invoices Collected</span>
            <span className="text-green-400 font-bold">${invoicePaid.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-frost-dim text-sm">Invoices Pending</span>
            <span className="text-yellow-300 font-bold">${invoicePending.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-frost-dim text-sm">Worker Costs (Total)</span>
            <span className="text-red-400 font-bold">-${workerCosts.toLocaleString()}</span>
          </div>
          <div className="border-t border-frost-border pt-3 flex justify-between items-center">
            <span className="text-frost-steel text-sm font-bold">Net After Labor</span>
            <span className="text-frost-steel font-black text-lg">${(actualMonthlyRevenue - workerCosts).toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="card">
        <h2 className="text-frost-dim text-[10px] font-bold uppercase tracking-widest mb-4">Key Metrics</h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-frost-elevated rounded-xl p-3">
            <p className="text-frost-dim text-[10px] uppercase">Avg Rate</p>
            <p className="text-frost-steel font-black text-xl">${avgRate.toFixed(0)}/t</p>
          </div>
          <div className="bg-frost-elevated rounded-xl p-3">
            <p className="text-frost-dim text-[10px] uppercase">Occupancy</p>
            <p className={`font-black text-xl ${revenuePct > 80 ? 'text-green-400' : revenuePct > 50 ? 'text-yellow-300' : 'text-red-400'}`}>{revenuePct}%</p>
          </div>
          <div className="bg-frost-elevated rounded-xl p-3">
            <p className="text-frost-dim text-[10px] uppercase">Empty Space</p>
            <p className="text-orange-400 font-black text-xl">{(totalCapacity - totalStored).toLocaleString()}t</p>
          </div>
          <div className="bg-frost-elevated rounded-xl p-3">
            <p className="text-frost-dim text-[10px] uppercase">Active Clients</p>
            <p className="text-frost-blue font-black text-xl">{clients.length}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
