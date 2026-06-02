import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { ArrowLeft } from 'lucide-react'

const PRODUCTS = ['Potatoes', 'Apples', 'Onions', 'Wheat', 'Meat', 'Cheese', 'Dairy', 'Frozen Goods', 'Other']

export default function NewTransaction() {
  const nav = useNavigate()
  const { user } = useAuth()
  const [type, setType] = useState<'in' | 'out'>('in')
  const [clients, setClients] = useState<any[]>([])
  const [rooms, setRooms] = useState<any[]>([])
  const [clientId, setClientId] = useState('')
  const [roomId, setRoomId] = useState('')
  const [product, setProduct] = useState('Potatoes')
  const [tonnes, setTonnes] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    supabase.from('fridge_clients').select('*').eq('is_active', true).order('name').then(({ data }) => setClients(data ?? []))
    supabase.from('fridge_rooms').select('*').eq('is_active', true).order('name').then(({ data }) => setRooms(data ?? []))
  }, [])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setError('')
    if (!clientId || !roomId || !tonnes) { setError('Fill all required fields'); return }
    const t = parseFloat(tonnes)
    if (isNaN(t) || t <= 0) { setError('Enter valid tonnage'); return }
    const room = rooms.find((r: any) => r.id === roomId)
    if (type === 'in' && room && room.current_tonnes + t > room.capacity_tonnes) { setError(`${room.name} only has ${(room.capacity_tonnes - room.current_tonnes).toFixed(1)}t free`); return }
    if (type === 'out' && room && room.current_tonnes < t) { setError(`${room.name} only has ${room.current_tonnes}t stored`); return }

    setSaving(true)
    await supabase.from('fridge_transactions').insert({ client_id: clientId, room_id: roomId, type, product_type: product, tonnes: t, date: new Date().toISOString().split('T')[0], notes: notes || null, recorded_by: user?.id })
    await supabase.from('fridge_rooms').update({ current_tonnes: (room?.current_tonnes ?? 0) + (type === 'in' ? t : -t) }).eq('id', roomId)
    if (type === 'in') {
      await supabase.from('fridge_inventory').insert({ client_id: clientId, room_id: roomId, product_type: product, tonnes: t, rate_per_tonne: clients.find(c => c.id === clientId)?.rate_per_tonne ?? 45 })
    }
    setSaving(false)
    nav('/transactions')
  }

  const chip = (selected: boolean) => `px-4 py-2 rounded-full text-sm font-bold border cursor-pointer transition-all ${selected ? 'bg-frost-blue border-frost-blue text-white' : 'bg-frost-elevated border-frost-border text-frost-dim hover:border-frost-blue'}`

  return (
    <div className="p-4 max-w-lg mx-auto">
      <button onClick={() => nav(-1)} className="text-frost-blue text-sm font-bold flex items-center gap-1 mb-4"><ArrowLeft size={16} /> Back</button>
      <h1 className="text-xl font-black text-frost-steel mb-6">New Transaction</h1>

      <div className="flex gap-3 mb-6">
        <button onClick={() => setType('in')} className={`flex-1 py-3 rounded-xl font-bold uppercase tracking-wide border-2 transition-all ${type === 'in' ? 'bg-green-500 border-green-500 text-black' : 'border-frost-border text-frost-dim'}`}>▼ Product IN</button>
        <button onClick={() => setType('out')} className={`flex-1 py-3 rounded-xl font-bold uppercase tracking-wide border-2 transition-all ${type === 'out' ? 'bg-red-500 border-red-500 text-white' : 'border-frost-border text-frost-dim'}`}>▲ Product OUT</button>
      </div>

      <form onSubmit={submit} className="card space-y-5">
        <div>
          <label className="label-f">Client</label>
          <div className="flex flex-wrap gap-2">{clients.map(c => <button type="button" key={c.id} onClick={() => setClientId(c.id)} className={chip(clientId === c.id)}>{c.name}</button>)}</div>
        </div>
        <div>
          <label className="label-f">Room</label>
          <div className="flex flex-wrap gap-2">{rooms.map(r => {
            const pct = Math.round((r.current_tonnes / r.capacity_tonnes) * 100)
            return <button type="button" key={r.id} onClick={() => setRoomId(r.id)} className={chip(roomId === r.id)}>{r.name} ({pct}%)</button>
          })}</div>
        </div>
        <div>
          <label className="label-f">Product</label>
          <div className="flex flex-wrap gap-2">{PRODUCTS.map(p => <button type="button" key={p} onClick={() => setProduct(p)} className={chip(product === p)}>{p}</button>)}</div>
        </div>
        <div>
          <label className="label-f">Tonnes</label>
          <input type="number" step="0.1" value={tonnes} onChange={e => setTonnes(e.target.value)} className="input-f" placeholder="e.g. 150" />
        </div>
        <div>
          <label className="label-f">Notes (optional)</label>
          <input value={notes} onChange={e => setNotes(e.target.value)} className="input-f" placeholder="Batch, quality..." />
        </div>
        {error && <p className="text-red-400 text-sm font-semibold">{error}</p>}
        <button type="submit" disabled={saving || !clientId || !roomId || !tonnes} className="btn-blue">
          {saving ? 'Saving...' : `Log ${type.toUpperCase()} — ${tonnes || '0'}t ${product}`}
        </button>
      </form>
    </div>
  )
}
