import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { ArrowLeft, Plus } from 'lucide-react'

const PRODUCTS = ['Potatoes', 'Apples', 'Onions', 'Wheat', 'Meat', 'Cheese', 'Dairy', 'Frozen Goods', 'Other']

export default function NewTransaction() {
  const nav = useNavigate()
  const { user } = useAuth()
  const [type, setType] = useState<'in' | 'out'>('in')
  const [clients, setClients] = useState<any[]>([])
  const [rooms, setRooms] = useState<any[]>([])
  const [workers, setWorkers] = useState<any[]>([])
  const [clientId, setClientId] = useState('')
  const [roomId, setRoomId] = useState('')
  const [product, setProduct] = useState('Potatoes')
  const [tonnes, setTonnes] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Worker/driver selection
  const [selectedLoaders, setSelectedLoaders] = useState<string[]>([])
  const [selectedDriver, setSelectedDriver] = useState('')

  // For OUT: track what client has
  const [clientInventory, setClientInventory] = useState<any[]>([])

  useEffect(() => {
    supabase.from('fridge_clients').select('*').eq('is_active', true).order('name').then(({ data }) => setClients(data ?? []))
    supabase.from('fridge_rooms').select('*').eq('is_active', true).order('name').then(({ data }) => setRooms(data ?? []))
    supabase.from('fridge_workers').select('*').eq('is_active', true).order('name').then(({ data }) => setWorkers(data ?? []))
  }, [])

  // Fetch client inventory when client+room selected
  useEffect(() => {
    if (!clientId || !roomId) { setClientInventory([]); return }
    supabase.from('fridge_inventory').select('*')
      .eq('client_id', clientId).eq('room_id', roomId).gt('tonnes', 0)
      .then(({ data }) => setClientInventory(data ?? []))
  }, [clientId, roomId])

  const loaders = workers.filter(w => w.role === 'loader')
  const drivers = workers.filter(w => w.role === 'driver')

  const toggleLoader = (id: string) => {
    setSelectedLoaders(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  // Calculate worker costs
  const t = parseFloat(tonnes) || 0
  const loaderCost = selectedLoaders.reduce((sum, lid) => {
    const w = loaders.find(l => l.id === lid)
    return sum + (w ? parseFloat(w.rate) * t : 0)
  }, 0)
  const driverWorker = drivers.find(d => d.id === selectedDriver)
  const driverCost = driverWorker ? parseFloat(driverWorker.rate) : 0
  const totalLaborCost = loaderCost + driverCost

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setError('')
    if (!clientId || !roomId || !tonnes) { setError('Fill all required fields'); return }
    if (isNaN(t) || t <= 0) { setError('Enter valid tonnage'); return }

    // Fresh room data
    const { data: freshRoom } = await supabase.from('fridge_rooms').select('*').eq('id', roomId).single()
    if (!freshRoom) { setError('Room not found'); return }

    if (type === 'in' && parseFloat(freshRoom.current_tonnes) + t > parseFloat(freshRoom.capacity_tonnes)) {
      setError(`${freshRoom.name} only has ${(parseFloat(freshRoom.capacity_tonnes) - parseFloat(freshRoom.current_tonnes)).toFixed(1)}t free`)
      return
    }

    if (type === 'out') {
      const inv = clientInventory.find(i => i.product_type === product)
      if (!inv) { setError(`No ${product} stored here by this client`); return }
      if (t > parseFloat(inv.tonnes)) { setError(`Only ${parseFloat(inv.tonnes)}t of ${product} available`); return }
    }

    setSaving(true)

    // 1. Insert transaction
    const { data: txData, error: txErr } = await supabase.from('fridge_transactions').insert({
      client_id: clientId, room_id: roomId, type, product_type: product, tonnes: t,
      date: new Date().toISOString().split('T')[0], notes: notes || null, recorded_by: user?.id,
    }).select().single()
    if (txErr || !txData) { setError(txErr?.message ?? 'Failed'); setSaving(false); return }

    // 2. Update room tonnage
    const newRoomTonnes = parseFloat(freshRoom.current_tonnes) + (type === 'in' ? t : -t)
    await supabase.from('fridge_rooms').update({ current_tonnes: Math.max(0, newRoomTonnes) }).eq('id', roomId)

    // 3. Update inventory
    if (type === 'in') {
      const { data: existing } = await supabase.from('fridge_inventory')
        .select('id, tonnes').eq('client_id', clientId).eq('room_id', roomId).eq('product_type', product)
        .gt('tonnes', 0).limit(1).single()
      if (existing) {
        await supabase.from('fridge_inventory').update({ tonnes: parseFloat(existing.tonnes) + t }).eq('id', existing.id)
      } else {
        await supabase.from('fridge_inventory').insert({
          client_id: clientId, room_id: roomId, product_type: product, tonnes: t,
          rate_per_tonne: clients.find(c => c.id === clientId)?.rate_per_tonne ?? 45,
        })
      }
    } else {
      const { data: existing } = await supabase.from('fridge_inventory')
        .select('id, tonnes').eq('client_id', clientId).eq('room_id', roomId).eq('product_type', product)
        .gt('tonnes', 0).limit(1).single()
      if (existing) {
        const remaining = parseFloat(existing.tonnes) - t
        if (remaining <= 0) await supabase.from('fridge_inventory').delete().eq('id', existing.id)
        else await supabase.from('fridge_inventory').update({ tonnes: remaining }).eq('id', existing.id)
      }
    }

    // 4. Record workers — loaders get paid per tonne, drivers per trip
    const workerRecords = [
      ...selectedLoaders.map(lid => {
        const w = loaders.find(l => l.id === lid)
        return { transaction_id: txData.id, worker_id: lid, role: 'loader', amount: (w ? parseFloat(w.rate) * t : 0) }
      }),
      ...(selectedDriver ? [{
        transaction_id: txData.id, worker_id: selectedDriver, role: 'driver', amount: driverCost,
      }] : []),
    ]
    if (workerRecords.length > 0) {
      await supabase.from('fridge_transaction_workers').insert(workerRecords)
    }

    setSaving(false)
    nav('/transactions')
  }

  const chip = (selected: boolean) => `px-4 py-2 rounded-full text-sm font-bold border cursor-pointer transition-all ${selected ? 'bg-frost-blue border-frost-blue text-white' : 'bg-frost-elevated border-frost-border text-frost-dim hover:border-frost-blue'}`
  const chipGreen = (selected: boolean) => `px-4 py-2 rounded-full text-sm font-bold border cursor-pointer transition-all ${selected ? 'bg-green-600 border-green-600 text-white' : 'bg-frost-elevated border-frost-border text-frost-dim hover:border-green-600'}`
  const chipOrange = (selected: boolean) => `px-4 py-2 rounded-full text-sm font-bold border cursor-pointer transition-all ${selected ? 'bg-orange-600 border-orange-600 text-white' : 'bg-frost-elevated border-frost-border text-frost-dim hover:border-orange-600'}`

  const availableProducts = type === 'out' && clientId && roomId
    ? clientInventory.map(i => i.product_type) : PRODUCTS

  return (
    <div className="p-4 max-w-lg mx-auto">
      <button onClick={() => nav(-1)} className="text-frost-blue text-sm font-bold flex items-center gap-1 mb-4"><ArrowLeft size={16} /> Back</button>
      <h1 className="text-xl font-black text-frost-steel mb-6">New Transaction</h1>

      {/* Type toggle */}
      <div className="flex gap-3 mb-6">
        <button onClick={() => setType('in')} className={`flex-1 py-3 rounded-xl font-bold uppercase tracking-wide border-2 transition-all ${type === 'in' ? 'bg-green-500 border-green-500 text-black' : 'border-frost-border text-frost-dim'}`}>▼ Product IN</button>
        <button onClick={() => setType('out')} className={`flex-1 py-3 rounded-xl font-bold uppercase tracking-wide border-2 transition-all ${type === 'out' ? 'bg-red-500 border-red-500 text-white' : 'border-frost-border text-frost-dim'}`}>▲ Product OUT</button>
      </div>

      <form onSubmit={submit} className="space-y-4">
        {/* Client + Room + Product + Tonnes */}
        <div className="card space-y-5">
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
            <label className="label-f">Product {type === 'out' && clientId && roomId && availableProducts.length === 0 ? '— Nothing stored' : ''}</label>
            <div className="flex flex-wrap gap-2">
              {(type === 'out' && clientId && roomId ? availableProducts : PRODUCTS).map(p => {
                const inv = clientInventory.find(i => i.product_type === p)
                return <button type="button" key={p} onClick={() => setProduct(p)} className={chip(product === p)}>{p}{type === 'out' && inv ? ` (${parseFloat(inv.tonnes)}t)` : ''}</button>
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
        </div>

        {/* Workers section */}
        <div className="card space-y-5">
          <h2 className="text-frost-steel text-sm font-black uppercase tracking-widest">👷 Workers & Driver</h2>

          {/* Loaders — multi-select */}
          <div>
            <label className="label-f">Loaders (select all who worked)</label>
            {loaders.length === 0 ? (
              <div className="flex items-center gap-2">
                <p className="text-frost-dim text-sm">No loaders added yet</p>
                <button type="button" onClick={() => nav('/workers/new')} className="text-frost-blue text-sm font-bold flex items-center gap-1"><Plus size={14} /> Add</button>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {loaders.map(w => (
                  <button type="button" key={w.id} onClick={() => toggleLoader(w.id)} className={chipGreen(selectedLoaders.includes(w.id))}>
                    🏗️ {w.name} (${parseFloat(w.rate)}/t)
                  </button>
                ))}
              </div>
            )}
            {selectedLoaders.length > 0 && t > 0 && (
              <p className="text-green-400 text-xs mt-2 font-semibold">
                {selectedLoaders.length} loader{selectedLoaders.length > 1 ? 's' : ''} × {t}t = ${loaderCost.toFixed(0)} total
              </p>
            )}
          </div>

          {/* Driver — single select */}
          <div>
            <label className="label-f">Driver (per trip)</label>
            {drivers.length === 0 ? (
              <div className="flex items-center gap-2">
                <p className="text-frost-dim text-sm">No drivers added yet</p>
                <button type="button" onClick={() => nav('/workers/new')} className="text-frost-blue text-sm font-bold flex items-center gap-1"><Plus size={14} /> Add</button>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => setSelectedDriver('')} className={chipOrange(!selectedDriver)}>None</button>
                {drivers.map(w => (
                  <button type="button" key={w.id} onClick={() => setSelectedDriver(w.id)} className={chipOrange(selectedDriver === w.id)}>
                    🚛 {w.name} (${parseFloat(w.rate)}/trip)
                  </button>
                ))}
              </div>
            )}
            {selectedDriver && <p className="text-orange-400 text-xs mt-2 font-semibold">Driver: ${driverCost.toFixed(0)}</p>}
          </div>

          {/* Labor cost summary */}
          {totalLaborCost > 0 && (
            <div className="bg-frost-elevated border border-frost-border rounded-xl p-3">
              <div className="flex justify-between text-sm">
                <span className="text-frost-dim">Total Labor Cost</span>
                <span className="text-frost-steel font-black">${totalLaborCost.toFixed(0)}</span>
              </div>
              {loaderCost > 0 && <div className="flex justify-between text-xs text-frost-dim mt-1"><span>Loaders ({selectedLoaders.length})</span><span>${loaderCost.toFixed(0)}</span></div>}
              {driverCost > 0 && <div className="flex justify-between text-xs text-frost-dim mt-1"><span>Driver</span><span>${driverCost.toFixed(0)}</span></div>}
            </div>
          )}
        </div>

        {error && <p className="text-red-400 text-sm font-semibold">{error}</p>}
        <button type="submit" disabled={saving || !clientId || !roomId || !tonnes} className="btn-blue">
          {saving ? 'Saving...' : `Log ${type.toUpperCase()} — ${tonnes || '0'}t ${product}`}
        </button>
      </form>
    </div>
  )
}
