import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { ArrowLeft, ArrowRight, Plus } from 'lucide-react'

const PRODUCTS = ['بطاطا', 'تفاح', 'بصل', 'قمح', 'لحوم', 'جبنة', 'ألبان', 'مجمّدات', 'أخرى']

export default function NewTransaction() {
  const nav = useNavigate()
  const { user } = useAuth()
  const [type, setType] = useState<'in' | 'out'>('in')
  const [clients, setClients] = useState<any[]>([])
  const [rooms, setRooms] = useState<any[]>([])
  const [workers, setWorkers] = useState<any[]>([])
  const [clientId, setClientId] = useState('')
  const [roomId, setRoomId] = useState('')
  const [product, setProduct] = useState('بطاطا')
  const [tonnes, setTonnes] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [txDate, setTxDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [company, setCompany] = useState('')

  // Weighbridge ticket
  // ticket_ref is auto-generated from ticket_no sequence
  const [plateNumber, setPlateNumber] = useState('')
  const [weightFirst, setWeightFirst] = useState('')
  const [weightSecond, setWeightSecond] = useState('')
  

  const wFirst = parseFloat(weightFirst) || 0
  const wSecond = parseFloat(weightSecond) || 0
  const netKg = Math.abs(wSecond - wFirst)

  // Workers
  const [selectedLoaders, setSelectedLoaders] = useState<string[]>([])
  const [noLoaders, setNoLoaders] = useState(false)
  const [selectedDriver, setSelectedDriver] = useState('')
  const [noDriver, setNoDriver] = useState(false)
  const [clientInventory, setClientInventory] = useState<any[]>([])

  useEffect(() => {
    supabase.from('fridge_clients').select('*').eq('is_active', true).order('name').then(({ data }) => setClients(data ?? []))
    supabase.from('fridge_rooms').select('*').eq('is_active', true).order('name').then(({ data }) => setRooms(data ?? []))
    supabase.from('fridge_workers').select('*').eq('is_active', true).order('name').then(({ data }) => setWorkers(data ?? []))
  }, [])

  useEffect(() => {
    if (!clientId || !roomId) { setClientInventory([]); return }
    supabase.from('fridge_inventory').select('*')
      .eq('client_id', clientId).eq('room_id', roomId).gt('tonnes', 0)
      .then(({ data }) => setClientInventory(data ?? []))
  }, [clientId, roomId])

  useEffect(() => {
    if (netKg > 0) setTonnes((netKg / 1000).toFixed(2))
  }, [netKg])

  const loaders = workers.filter(w => w.role === 'loader')
  const drivers = workers.filter(w => w.role === 'driver')
  const t = parseFloat(tonnes) || 0
  const loaderCost = selectedLoaders.reduce((sum, id) => {
    const w = workers.find(x => x.id === id)
    const r = type === 'in' ? parseFloat(w?.rate_loading ?? w?.rate ?? 0) : parseFloat(w?.rate_unloading ?? w?.rate ?? 0)
    return sum + r * t
  }, 0)
  const driverCost = selectedDriver ? parseFloat(workers.find(w => w.id === selectedDriver)?.rate ?? 0) : 0
  const totalLaborCost = loaderCost + driverCost

  const toggleLoader = (id: string) => {
    setSelectedLoaders(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!clientId) { setError('يرجى اختيار الزبون'); return }
    if (!roomId) { setError('يرجى اختيار الغرفة'); return }
    if (!product) { setError('يرجى اختيار المنتج'); return }
    if (!tonnes || t <= 0) { setError('يرجى إدخال الكمية'); return }
    if (!txDate) { setError('يرجى اختيار التاريخ'); return }
    // ticket_ref auto-generated
    if (!plateNumber) { setError('يرجى إدخال رقم الشاحنة'); return }
    if (!weightFirst || !weightSecond) { setError('يرجى إدخال الوزنتين'); return }
    if (!noLoaders && selectedLoaders.length === 0) { setError('يرجى اختيار العمال أو الضغط على "بدون"'); return }
    if (!noDriver && !selectedDriver) { setError('يرجى اختيار السائق أو الضغط على "بدون"'); return }
    
    setSaving(true); setError('')

    // Re-fetch room for latest data
    const { data: freshRoom } = await supabase.from('fridge_rooms').select('*').eq('id', roomId).single()
    if (!freshRoom) { setError('غرفة غير موجودة'); setSaving(false); return }

    const currentTonnes = parseFloat(freshRoom.current_tonnes) || 0
    const capacity = parseFloat(freshRoom.capacity_tonnes) || 0

    if (type === 'in' && currentTonnes + t > capacity) {
      setError(`لا توجد مساحة كافية — المتاح: ${(capacity - currentTonnes).toFixed(1)} طن`)
      setSaving(false); return
    }

    if (type === 'out') {
      const inv = clientInventory.find(i => i.product_type === product)
      if (!inv || parseFloat(inv.tonnes) < t) {
        setError(`الكمية المخزنة غير كافية — المتاح: ${parseFloat(inv?.tonnes ?? 0)} طن`)
        setSaving(false); return
      }
    }

    // Save transaction
    const { data: tx, error: txErr } = await supabase.from('fridge_transactions').insert({
      client_id: clientId, room_id: roomId, type, product_type: product,
      tonnes: t, date: txDate, notes: notes || null, recorded_by: user?.id,
       plate_number: plateNumber || null,
      weight_first: wFirst || null, weight_second: wSecond || null,
      weight_net: netKg || null, 
      company: company || null,
    }).select('ticket_no').single()

    if (txErr) { setError(txErr.message); setSaving(false); return }

    // Update room tonnage
    const newTonnes = type === 'in' ? currentTonnes + t : Math.max(0, currentTonnes - t)
    await supabase.from('fridge_rooms').update({ current_tonnes: newTonnes }).eq('id', roomId)

    // Update inventory
    const { data: existingInv } = await supabase.from('fridge_inventory').select('*')
      .eq('client_id', clientId).eq('room_id', roomId).eq('product_type', product).single()

    if (existingInv) {
      const newQty = type === 'in'
        ? parseFloat(existingInv.tonnes) + t
        : Math.max(0, parseFloat(existingInv.tonnes) - t)
      if (newQty <= 0) {
        await supabase.from('fridge_inventory').delete().eq('id', existingInv.id)
      } else {
        await supabase.from('fridge_inventory').update({ tonnes: newQty }).eq('id', existingInv.id)
      }
    } else if (type === 'in') {
      await supabase.from('fridge_inventory').insert({
        client_id: clientId, room_id: roomId, product_type: product, tonnes: t,
      })
    }

    // Save worker assignments
    if ((selectedLoaders.length > 0 && !noLoaders) || (selectedDriver && !noDriver)) {
      const workerRecords = []
      for (const lid of selectedLoaders) {
        const w = workers.find(x => x.id === lid)
        if (w) { const r = type === 'in' ? parseFloat(w.rate_loading ?? w.rate) : parseFloat(w.rate_unloading ?? w.rate); workerRecords.push({ transaction_id: tx.id, worker_id: lid, role: 'loader', earnings: r * t }) }
      }
      if (selectedDriver) {
        const w = workers.find(x => x.id === selectedDriver)
        if (w) workerRecords.push({ transaction_id: tx.id, worker_id: selectedDriver, role: 'driver', earnings: parseFloat(w.rate) })
      }
      await supabase.from('fridge_transaction_workers').insert(workerRecords)
    }

    setSaving(false)
    alert(`✅ تم الحفظ — رقم البطاقة ${tx.ticket_no}`)
    nav('/transactions')
  }

  const chip = (selected: boolean) => `px-4 py-2 rounded-full text-sm font-bold border cursor-pointer transition-all ${selected ? 'bg-frost-blue border-frost-blue text-white' : 'bg-frost-elevated border-frost-border text-frost-dim hover:border-frost-blue'}`
  const chipGreen = (selected: boolean) => `px-4 py-2 rounded-full text-sm font-bold border cursor-pointer transition-all ${selected ? 'bg-green-600 border-green-600 text-white' : 'bg-frost-elevated border-frost-border text-frost-dim hover:border-green-600'}`
  const chipOrange = (selected: boolean) => `px-4 py-2 rounded-full text-sm font-bold border cursor-pointer transition-all ${selected ? 'bg-orange-600 border-orange-600 text-white' : 'bg-frost-elevated border-frost-border text-frost-dim hover:border-orange-600'}`

  const availableProducts = type === 'out' && clientId && roomId
    ? clientInventory.map(i => i.product_type) : PRODUCTS

  return (
    <div className="p-4 max-w-lg mx-auto" dir="rtl">
      <button onClick={() => nav(-1)} className="text-frost-blue text-sm font-bold flex items-center gap-1 mb-4"><ArrowRight size={16} /> رجوع</button>
      <h1 className="text-xl font-black text-frost-steel mb-6">حركة جديدة</h1>

      {/* Type toggle */}
      <div className="flex gap-3 mb-6">
        <button onClick={() => setType('in')} className={`flex-1 py-3 rounded-xl font-bold uppercase tracking-wide border-2 transition-all ${type === 'in' ? 'bg-green-500 border-green-500 text-black' : 'border-frost-border text-frost-dim'}`}>▼ إدخال بضاعة</button>
        <button onClick={() => setType('out')} className={`flex-1 py-3 rounded-xl font-bold uppercase tracking-wide border-2 transition-all ${type === 'out' ? 'bg-red-500 border-red-500 text-white' : 'border-frost-border text-frost-dim'}`}>▲ إخراج بضاعة</button>
      </div>

      <form onSubmit={submit} className="space-y-4">
        {/* Client + Room + Product + Tonnes */}
        <div className="card space-y-5">
          <div>
            <label className="label-f">الزبون *</label>
            <div className="flex flex-wrap gap-2">{clients.map(c => <button type="button" key={c.id} onClick={() => setClientId(c.id)} className={chip(clientId === c.id)}>{c.name}</button>)}</div>
          </div>

          {/* Company field - appears after client selected */}
          {clientId && (
            <div>
              <label className="label-f">الشركة — اشترى من</label>
              <input value={company} onChange={e => setCompany(e.target.value)} className="input-f" placeholder="اسم الشركة المورّدة" />
            </div>
          )}

          <div>
            <label className="label-f">الغرفة *</label>
            <div className="flex flex-wrap gap-2">{rooms.map(r => {
              const pct = Math.round((parseFloat(r.current_tonnes) / parseFloat(r.capacity_tonnes)) * 100)
              return <button type="button" key={r.id} onClick={() => setRoomId(r.id)} className={chip(roomId === r.id)}>{r.name} ({pct}%)</button>
            })}</div>
          </div>
          <div>
            <label className="label-f">المنتج * {type === 'out' && clientId && roomId && availableProducts.length === 0 ? '— لا يوجد مخزون' : ''}</label>
            <div className="flex flex-wrap gap-2">
              {(type === 'out' && clientId && roomId ? availableProducts : PRODUCTS).map(p => {
                const inv = clientInventory.find(i => i.product_type === p)
                return <button type="button" key={p} onClick={() => setProduct(p)} className={chip(product === p)}>{p}{type === 'out' && inv ? ` (${parseFloat(inv.tonnes)}t)` : ''}</button>
              })}
            </div>
          </div>

          {/* Date picker */}
          <div>
            <label className="label-f">{type === 'in' ? 'تاريخ التحميل' : 'تاريخ التنزيل'}</label>
            <input type="date" value={txDate} onChange={e => setTxDate(e.target.value)} className="input-f" />
          </div>

          <div>
            <label className="label-f">الكمية (طن) *</label>
            <input type="number" step="0.1" value={tonnes} onChange={e => setTonnes(e.target.value)} className="input-f" placeholder="مثال: 12.5" />
            {type === 'out' && product && clientInventory.find(i => i.product_type === product) && (
              <p className="text-frost-dim text-xs mt-1">المتاح: {parseFloat(clientInventory.find(i => i.product_type === product)?.tonnes ?? 0)} طن</p>
            )}
          </div>
          <div>
            <label className="label-f">ملاحظات (اختياري)</label>
            <input value={notes} onChange={e => setNotes(e.target.value)} className="input-f" placeholder="دفعة، نوعية..." />
          </div>
        </div>

        {/* Weighbridge ticket */}
        <div className="card space-y-5">
          <h2 className="text-frost-steel text-sm font-black uppercase tracking-widest">⚖️ بطاقة القبان</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-f">المرجع</label>
              <div className="input-f bg-frost-elevated text-frost-dim cursor-not-allowed">تلقائي — يُحدد عند الحفظ</div>
            </div>
            <div>
              <label className="label-f">رقم الشاحنة *</label>
              <input value={plateNumber} onChange={e => setPlateNumber(e.target.value)} className="input-f" placeholder="338455" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-f">الوزنة الأولى (كغ) *</label>
              <input type="number" step="1" value={weightFirst} onChange={e => setWeightFirst(e.target.value)} className="input-f" placeholder="5360" />
            </div>
            <div>
              <label className="label-f">الوزنة الثانية (كغ) *</label>
              <input type="number" step="1" value={weightSecond} onChange={e => setWeightSecond(e.target.value)} className="input-f" placeholder="17300" />
            </div>
          </div>
          {netKg > 0 && (
            <div className="bg-frost-elevated border border-frost-border rounded-xl p-3 flex justify-between items-center">
              <span className="text-frost-dim text-sm">الوزن الصافي</span>
              <span className="text-frost-blue font-black">{netKg.toLocaleString()} كغ · {(netKg / 1000).toFixed(2)} طن</span>
            </div>
          )}

        </div>

        {/* Workers */}
        <div className="card space-y-5">
          <h2 className="text-frost-steel text-sm font-black uppercase tracking-widest">👷 العمال والسائق</h2>
          <div>
            <label className="label-f">العمال *</label>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => { setNoLoaders(true); setSelectedLoaders([]) }} className={chipGreen(noLoaders)}>بدون عمال</button>
                {loaders.map(w => (
                  <button type="button" key={w.id} onClick={() => { setNoLoaders(false); toggleLoader(w.id) }} className={chipGreen(!noLoaders && selectedLoaders.includes(w.id))}>
                    🏗️ {w.name} (${type === 'in' ? parseFloat(w.rate_loading ?? w.rate) : parseFloat(w.rate_unloading ?? w.rate)}/طن)
                  </button>
                ))}
                <button type="button" onClick={() => nav('/workers/new')} className="text-frost-blue text-sm font-bold flex items-center gap-1"><Plus size={14} /> إضافة</button>
              </div>
            {selectedLoaders.length > 0 && t > 0 && (
              <p className="text-green-400 text-xs mt-2 font-semibold">
                {selectedLoaders.length} عامل × {t} طن = ${loaderCost.toFixed(0)} المجموع
              </p>
            )}
          </div>
          <div>
            <label className="label-f">السائق *</label>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => { setNoDriver(true); setSelectedDriver('') }} className={chipOrange(noDriver)}>بدون سائق</button>
                {drivers.map(w => (
                  <button type="button" key={w.id} onClick={() => { setNoDriver(false); setSelectedDriver(w.id) }} className={chipOrange(!noDriver && selectedDriver === w.id)}>
                    🚛 {w.name} (${parseFloat(w.rate)}/رحلة)
                  </button>
                ))}
                <button type="button" onClick={() => nav('/workers/new')} className="text-frost-blue text-sm font-bold flex items-center gap-1"><Plus size={14} /> إضافة</button>
              </div>
            {selectedDriver && <p className="text-orange-400 text-xs mt-2 font-semibold">السائق: ${driverCost.toFixed(0)}</p>}
          </div>
          {totalLaborCost > 0 && (
            <div className="bg-frost-elevated border border-frost-border rounded-xl p-3">
              <div className="flex justify-between text-sm">
                <span className="text-frost-dim">إجمالي تكلفة العمالة</span>
                <span className="text-frost-steel font-black">${totalLaborCost.toFixed(0)}</span>
              </div>
              {loaderCost > 0 && <div className="flex justify-between text-xs text-frost-dim mt-1"><span>العمال ({selectedLoaders.length})</span><span>${loaderCost.toFixed(0)}</span></div>}
              {driverCost > 0 && <div className="flex justify-between text-xs text-frost-dim mt-1"><span>السائق</span><span>${driverCost.toFixed(0)}</span></div>}
            </div>
          )}
        </div>

        {error && <p className="text-red-400 text-sm font-semibold">{error}</p>}
        <button type="submit" disabled={saving} className="btn-blue w-full">
          {saving ? 'جاري الحفظ...' : `تسجيل ${type === 'in' ? 'إدخال' : 'إخراج'} — ${tonnes || '0'} طن ${product}`}
        </button>
      </form>
    </div>
  )
}
