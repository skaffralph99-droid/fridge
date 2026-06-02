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

  // For OUT: track what client actually has in selected room
  const [clientInventory, setClientInventory] = useState<any[]>([])

  useEffect(() => {
    supabase.from('fridge_clients').select('*').eq('is_active', true).order('name').then(({ data }) => setClients(data ?? []))
    supabase.from('fridge_rooms').select('*').eq('is_active', true).order('name').then(({ data }) => setRooms(data ?? []))
  }, [])

  // When client + room selected, fetch what they have stored (for OUT validation)
  useEffect(() => {
    if (!clientId || !roomId) { setClientInventory([]); return }
    supabase.from('fridge_inventory').select('*')
      .eq('client_id', clientId).eq('room_id', roomId).gt('tonnes', 0)
      .then(({ data }) => setClientInventory(data ?? []))
  }, [clientId, roomId])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setError('')
    if (!clientId || !roomId || !tonnes) { setError('Fill all required fields'); return }
    const t = parseFloat(tonnes)
    if (isNaN(t) || t <= 0) { setError('Enter valid tonnage'); return }

    // Re-fetch room for fresh data (avoid stale state)
    const { data: freshRoom } = await supabase.from('fridge_rooms').select('*').eq('id', roomId).single()
    if (!freshRoom) { setError('Room not found'); return }

    if (type === 'in' && freshRoom.current_tonnes + t > freshRoom.capacity_tonnes) {
      setError(`${freshRoom.name} only has ${(freshRoom.capacity_tonnes - freshRoom.current_tonnes).toFixed(1)}t free`)
      return
    }

    if (type === 'out') {
      // Check client has this product in this room
      const inv = clientInventory.find(i => i.product_type === product)
      if (!inv) {
        setError(`This client has no ${product} in ${freshRoom.name}`)
        return
      }
      const available = parseFloat(inv.tonnes)
      if (t > available) {
        setError(`Client only has ${available}t of ${product} in ${freshRoom.name}`)
        return
      }
    }

    setSaving(true)

    // 1. Insert transaction
    const { error: txErr } = await supabase.from('fridge_transactions').insert({
      client_id: clientId, room_id: roomId, type, product_type: product, tonnes: t,
      date: new Date().toISOString().split('T')[0], notes: notes || null, recorded_by: user?.id,
    })
    if (txErr) { setError(txErr.message); setSaving(false); return }

    // 2. Update room tonnage (use fresh value)
    const newRoomTonnes = parseFloat(freshRoom.current_tonnes) + (type === 'in' ? t : -t)
    await supabase.from('fridge_rooms').update({ current_tonnes: Math.max(0, newRoomTonnes) }).eq('id', roomId)

    // 3. Update inventory
    if (type === 'in') {
      const { data: existing } = await supabase.from('fridge_inventory')
        .select('id, tonnes')
        .eq('client_id', clientId).eq('room_id', roomId).eq('product_type', product)
        .gt('tonnes', 0).limit(1).single()
      if (existing) {
        const newTonnes = parseFloat(existing.tonnes) + t
        await supabase.from('fridge_inventory').update({ tonnes: newTonnes }).eq('id', existing.id)
      } else {
        await supabase.from('fridge_inventory').insert({
          client_id: clientId, room_id: roomId, product_type: product, tonnes: t,
          rate_per_tonne: clients.find(c => c.id === clientId)?.rate_per_tonne ?? 45,
        })
      }
    } else {
      const { data: existing } = await supabase.from('fridge_inventory')
        .select('id, tonnes')
        .eq('client_id', clientId).eq('room_id', roomId).eq('product_type', product)
        .gt('tonnes', 0).limit(1).single()
      if (existing) {
        const remaining = parseFloat(existing.tonnes) - t
        if (remaining <= 0) {
          await supabase.from('fridge_inventory').delete().eq('id', existing.id)
        } else {
          await supabase.from('fridge_inventory').update({ tonnes: remaining }).eq('id', existing.id)
        }
      }
    }

    setSaving(false)
    nav('/transactions')
  }

  const chip = (selected: boolean) => `px-4 py-2 rounded-full text-sm font-bold border cursor-pointer transition-all ${selected ? 'bg-frost-blue border-frost-blue text-white' : 'bg-frost-elevated border-frost-border text-frost-dim hover:border-frost-blue'}`

  // For OUT mode, show only products the client has in this room
  const availableProducts = type === 'out' && clientId && roomId
    ? clientInventory.map(i => i.product_type)
    : PRODUCTS

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
            const pct = Math.round((parseFloat(r.current_tonnes) / parseFloat(r.capacity_tonnes)) * 100)
            return <button type="button" key={r.id} onClick={() => setRoomId(r.id)} className={chip(roomId === r.id)}>{r.name} ({pct}%)</button>
          })}</div>
        </div>
        <div>
          <label className="label-f">Product {type === 'out' && clientId && roomId && availableProducts.length === 0 ? '— No products stored here' : ''}</label>
          <div className="flex flex-wrap gap-2">
            {(type === 'out' && clientId && roomId ? availableProducts : PRODUCTS).map(p => {
              const inv = clientInventory.find(i => i.product_type === p)
              return (
                <button type="button" key={p} onClick={() => setProduct(p)} className={chip(product === p)}>
                  {p}{type === 'out' && inv ? ` (${parseFloat(inv.tonnes)}t)` : ''}
                </button>
              )
            })}
          </div>
        </div>
        <div>
          <label className="label-f">Tonnes</label>
          <input type="number" step="0.1" value={tonnes} onChange={e => setTonnes(e.target.value)} className="input-f" placeholder="e.g. 150" />
          {type === 'out' && product && clientInventory.find(i => i.product_type === product) && (
            <p className="text-frost-dim text-xs mt-1">Available: {parseFloat(clientInventory.find(i => i.product_type === product)?.tonnes ?? 0)}t</p>
          )}
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
