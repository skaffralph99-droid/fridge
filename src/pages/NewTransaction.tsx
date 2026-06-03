import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { ArrowRight, Plus, ChevronLeft, ChevronRight, Check } from 'lucide-react'

const PRODUCTS = ['بطاطا', 'تفاح', 'بصل', 'قمح', 'لحوم', 'جبنة', 'ألبان', 'مجمّدات', 'أخرى']

export default function NewTransaction() {
  const nav = useNavigate()
  const { user } = useAuth()

  // Step tracker
  const [step, setStep] = useState(1)

  // Data
  const [type, setType] = useState<'in' | 'out'>('in')
  const [clients, setClients] = useState<any[]>([])
  const [rooms, setRooms] = useState<any[]>([])
  const [workers, setWorkers] = useState<any[]>([])
  const [clientId, setClientId] = useState('')
  const [roomId, setRoomId] = useState('')
  const [product, setProduct] = useState('بطاطا')
  const [company, setCompany] = useState('')
  const [txDate, setTxDate] = useState(() => new Date().toISOString().slice(0, 10))

  // Weighbridge
  const [plateNumber, setPlateNumber] = useState('')
  const [weightFirst, setWeightFirst] = useState('')
  const [weightSecond, setWeightSecond] = useState('')
  const wFirst = parseFloat(weightFirst) || 0
  const wSecond = parseFloat(weightSecond) || 0
  const netKg = Math.abs(wSecond - wFirst)
  const tonnes = netKg > 0 ? (netKg / 1000).toFixed(2) : ''

  // Workers
  const [selectedLoaders, setSelectedLoaders] = useState<string[]>([])
  const [noLoaders, setNoLoaders] = useState(false)
  const [selectedDriver, setSelectedDriver] = useState('')
  const [noDriver, setNoDriver] = useState(false)

  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [showAddClient, setShowAddClient] = useState(false)
  const [showAddWorker, setShowAddWorker] = useState(false)
  const [newClientName, setNewClientName] = useState('')
  const [newClientPhone, setNewClientPhone] = useState('')
  const [newWorkerName, setNewWorkerName] = useState('')
  const [newWorkerPhone, setNewWorkerPhone] = useState('')
  const [newWorkerRole, setNewWorkerRole] = useState<'loader'|'driver'>('loader')
  const [newWorkerRateL, setNewWorkerRateL] = useState('')
  const [newWorkerRateU, setNewWorkerRateU] = useState('')
  const [newWorkerRateD, setNewWorkerRateD] = useState('')
  const [addingSaving, setAddingSaving] = useState(false)
  const [error, setError] = useState('')

  // Inventory for OUT
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

  const loaders = workers.filter(w => w.role === 'loader')
  const drivers = workers.filter(w => w.role === 'driver')
  const t = parseFloat(tonnes) || 0
  const loaderCost = selectedLoaders.reduce((sum, id) => {
    const w = workers.find(x => x.id === id)
    const r = type === 'in' ? parseFloat(w?.rate_loading ?? w?.rate ?? 0) : parseFloat(w?.rate_unloading ?? w?.rate ?? 0)
    return sum + r * t
  }, 0)
  const driverCost = selectedDriver ? parseFloat(workers.find(w => w.id === selectedDriver)?.rate ?? 0) : 0

  const toggleLoader = (id: string) => {
    setNoLoaders(false)
    setSelectedLoaders(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const addClient = async () => {
    if (!newClientName.trim()) return
    setAddingSaving(true)
    const { data } = await supabase.from('fridge_clients').insert({
      name: newClientName.trim(), phone: newClientPhone || null, is_active: true, rate: 0
    }).select().single()
    if (data) {
      setClients(prev => [...prev, data].sort((a,b) => a.name.localeCompare(b.name)))
      setClientId(data.id)
    }
    setNewClientName(''); setNewClientPhone('')
    setShowAddClient(false); setAddingSaving(false)
  }

  const addWorker = async () => {
    if (!newWorkerName.trim()) return
    setAddingSaving(true)
    const rate = newWorkerRole === 'driver' ? parseFloat(newWorkerRateD) || 0 : parseFloat(newWorkerRateL) || 0
    const { data } = await supabase.from('fridge_workers').insert({
      name: newWorkerName.trim(), phone: newWorkerPhone || null,
      role: newWorkerRole, rate,
      rate_loading: newWorkerRole === 'loader' ? parseFloat(newWorkerRateL) || 0 : 0,
      rate_unloading: newWorkerRole === 'loader' ? parseFloat(newWorkerRateU) || 0 : 0,
      is_active: true,
    }).select().single()
    if (data) {
      setWorkers(prev => [...prev, data].sort((a,b) => a.name.localeCompare(b.name)))
    }
    setNewWorkerName(''); setNewWorkerPhone(''); setNewWorkerRateL(''); setNewWorkerRateU(''); setNewWorkerRateD('')
    setShowAddWorker(false); setAddingSaving(false)
  }

  const clientName = clients.find(c => c.id === clientId)?.name ?? ''
  const roomName = rooms.find(r => r.id === roomId)?.name ?? ''

  // Validation per step
  const canNext = () => {
    setError('')
    if (step === 1 && !clientId) { setError('اختر الزبون'); return false }
    if (step === 1 && !roomId) { setError('اختر الغرفة'); return false }
    if (step === 2 && !plateNumber) { setError('أدخل رقم الشاحنة'); return false }
    if (step === 2 && (!weightFirst || !weightSecond)) { setError('أدخل الوزنتين'); return false }
    if (step === 3 && !noLoaders && selectedLoaders.length === 0) { setError('اختر العمال أو اضغط "بدون"'); return false }
    if (step === 3 && !noDriver && !selectedDriver) { setError('اختر السائق أو اضغط "بدون"'); return false }
    return true
  }

  const next = () => { if (canNext()) setStep(s => s + 1) }
  const prev = () => { setError(''); setStep(s => s - 1) }

  const submit = async () => {
    setSaving(true); setError('')

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
        setError(`الكمية المخزنة غير كافية`)
        setSaving(false); return
      }
    }

    const { data: tx, error: txErr } = await supabase.from('fridge_transactions').insert({
      client_id: clientId, room_id: roomId, type, product_type: product,
      tonnes: t, date: txDate, notes: notes || null, recorded_by: user?.id,
      plate_number: plateNumber || null,
      weight_first: wFirst || null, weight_second: wSecond || null,
      weight_net: netKg || null, company: company || null,
    }).select('id, ticket_no').single()

    if (txErr) { setError(txErr.message); setSaving(false); return }

    const newTonnes = type === 'in' ? currentTonnes + t : Math.max(0, currentTonnes - t)
    await supabase.from('fridge_rooms').update({ current_tonnes: newTonnes }).eq('id', roomId)

    const { data: existingInv } = await supabase.from('fridge_inventory').select('*')
      .eq('client_id', clientId).eq('room_id', roomId).eq('product_type', product).single()

    if (existingInv) {
      const newQty = type === 'in' ? parseFloat(existingInv.tonnes) + t : Math.max(0, parseFloat(existingInv.tonnes) - t)
      if (newQty <= 0) await supabase.from('fridge_inventory').delete().eq('id', existingInv.id)
      else await supabase.from('fridge_inventory').update({ tonnes: newQty }).eq('id', existingInv.id)
    } else if (type === 'in') {
      await supabase.from('fridge_inventory').insert({ client_id: clientId, room_id: roomId, product_type: product, tonnes: t })
    }

    if ((selectedLoaders.length > 0 && !noLoaders) || (selectedDriver && !noDriver)) {
      const records: any[] = []
      for (const lid of selectedLoaders) {
        const w = workers.find(x => x.id === lid)
        if (w) {
          const r = type === 'in' ? parseFloat(w.rate_loading ?? w.rate) : parseFloat(w.rate_unloading ?? w.rate)
          records.push({ transaction_id: tx.id, worker_id: lid, role: 'loader', earnings: r * t })
        }
      }
      if (selectedDriver && !noDriver) {
        const w = workers.find(x => x.id === selectedDriver)
        if (w) records.push({ transaction_id: tx.id, worker_id: selectedDriver, role: 'driver', earnings: parseFloat(w.rate) })
      }
      if (records.length > 0) await supabase.from('fridge_transaction_workers').insert(records)
    }

    setSaving(false)
    alert(`✅ تم الحفظ — رقم البطاقة ${tx.ticket_no}`)
    nav('/transactions')
  }

  const chip = (sel: boolean) => `px-4 py-2.5 rounded-2xl text-sm font-bold border-2 cursor-pointer transition-all ${sel ? 'bg-frost-blue border-frost-blue text-white scale-105' : 'bg-frost-elevated border-frost-border text-frost-dim'}`
  const chipGreen = (sel: boolean) => `px-4 py-2.5 rounded-2xl text-sm font-bold border-2 cursor-pointer transition-all ${sel ? 'bg-green-600 border-green-600 text-white' : 'bg-frost-elevated border-frost-border text-frost-dim'}`
  const chipOrange = (sel: boolean) => `px-4 py-2.5 rounded-2xl text-sm font-bold border-2 cursor-pointer transition-all ${sel ? 'bg-orange-600 border-orange-600 text-white' : 'bg-frost-elevated border-frost-border text-frost-dim'}`

  const steps = ['الزبون والغرفة', 'القبان', 'العمال', 'تأكيد']

  return (
    <div className="p-4 max-w-lg mx-auto pb-32" dir="rtl">
      <button onClick={() => nav(-1)} className="text-frost-blue text-sm font-bold flex items-center gap-1 mb-4"><ArrowRight size={16} /> رجوع</button>

      {/* Type toggle */}
      <div className="flex gap-3 mb-5">
        <button onClick={() => setType('in')} className={`flex-1 py-3.5 rounded-2xl font-bold text-lg border-2 transition-all ${type === 'in' ? 'bg-green-500 border-green-500 text-black' : 'border-frost-border text-frost-dim'}`}>▼ إدخال</button>
        <button onClick={() => setType('out')} className={`flex-1 py-3.5 rounded-2xl font-bold text-lg border-2 transition-all ${type === 'out' ? 'bg-red-500 border-red-500 text-white' : 'border-frost-border text-frost-dim'}`}>▲ إخراج</button>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-1 mb-6">
        {steps.map((s, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div className={`w-full h-1.5 rounded-full transition-all ${i + 1 <= step ? 'bg-frost-blue' : 'bg-frost-border'}`} />
            <span className={`text-[9px] font-bold ${i + 1 <= step ? 'text-frost-blue' : 'text-frost-dim'}`}>{s}</span>
          </div>
        ))}
      </div>

      {/* STEP 1: Client + Room + Product */}
      {step === 1 && (
        <div className="space-y-5">
          <div>
            <label className="label-f text-base mb-2 block">من الزبون؟</label>
            <div className="flex flex-wrap gap-2">
              {clients.map(c => <button key={c.id} onClick={() => setClientId(c.id)} className={chip(clientId === c.id)}>{c.name}</button>)}
              <button onClick={() => setShowAddClient(true)} className="text-frost-blue text-sm font-bold flex items-center gap-1 px-3"><Plus size={14} /></button>
            </div>
          </div>

          {clientId && (
            <div>
              <label className="label-f">الشركة — اشترى من (اختياري)</label>
              <input value={company} onChange={e => setCompany(e.target.value)} className="input-f" placeholder="اسم الشركة المورّدة" />
            </div>
          )}

          <div>
            <label className="label-f text-base mb-2 block">أي غرفة؟</label>
            <div className="flex flex-wrap gap-2">{rooms.map(r => {
              const pct = Math.round((parseFloat(r.current_tonnes) / parseFloat(r.capacity_tonnes)) * 100)
              return <button key={r.id} onClick={() => setRoomId(r.id)} className={chip(roomId === r.id)}>{r.name} ({pct}%)</button>
            })}</div>
          </div>

          <div>
            <label className="label-f text-base mb-2 block">شو المنتج؟</label>
            <div className="flex flex-wrap gap-2">
              {(type === 'out' && clientId && roomId ? clientInventory.map(i => i.product_type) : PRODUCTS).map(p => (
                <button key={p} onClick={() => setProduct(p)} className={chip(product === p)}>{p}</button>
              ))}
            </div>
          </div>

          <div>
            <label className="label-f">{type === 'in' ? 'تاريخ التحميل' : 'تاريخ التنزيل'}</label>
            <input type="date" value={txDate} onChange={e => setTxDate(e.target.value)} className="input-f" />
          </div>
        </div>
      )}

      {/* STEP 2: Weighbridge */}
      {step === 2 && (
        <div className="space-y-5">
          <h2 className="text-lg font-black text-frost-steel">⚖️ القبان</h2>

          <div>
            <label className="label-f">رقم الشاحنة</label>
            <input value={plateNumber} onChange={e => setPlateNumber(e.target.value)} className="input-f text-lg" placeholder="338455" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-f">الوزنة الأولى (كغ)</label>
              <input type="number" value={weightFirst} onChange={e => setWeightFirst(e.target.value)} className="input-f text-lg" placeholder="5360" />
            </div>
            <div>
              <label className="label-f">الوزنة الثانية (كغ)</label>
              <input type="number" value={weightSecond} onChange={e => setWeightSecond(e.target.value)} className="input-f text-lg" placeholder="17300" />
            </div>
          </div>

          {netKg > 0 && (
            <div className="bg-frost-blue/10 border-2 border-frost-blue/30 rounded-2xl p-4 text-center">
              <p className="text-frost-dim text-sm mb-1">الوزن الصافي</p>
              <p className="text-frost-blue font-black text-3xl">{(netKg / 1000).toFixed(2)} طن</p>
              <p className="text-frost-dim text-xs mt-1">{netKg.toLocaleString()} كغ</p>
            </div>
          )}

          <div>
            <label className="label-f">ملاحظات (اختياري)</label>
            <input value={notes} onChange={e => setNotes(e.target.value)} className="input-f" placeholder="دفعة، نوعية..." />
          </div>
        </div>
      )}

      {/* STEP 3: Workers */}
      {step === 3 && (
        <div className="space-y-5">
          <h2 className="text-lg font-black text-frost-steel">👷 العمال</h2>

          <div>
            <label className="label-f text-base mb-2 block">مين حمّل؟</label>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => { setNoLoaders(true); setSelectedLoaders([]) }} className={chipGreen(noLoaders)}>بدون عمال</button>
              {loaders.map(w => (
                <button key={w.id} onClick={() => toggleLoader(w.id)} className={chipGreen(!noLoaders && selectedLoaders.includes(w.id))}>
                  {w.name} (${type === 'in' ? parseFloat(w.rate_loading ?? w.rate) : parseFloat(w.rate_unloading ?? w.rate)}/طن)
                </button>
              ))}
              <button onClick={() => { setNewWorkerRole('loader'); setShowAddWorker(true) }} className="text-frost-blue text-sm font-bold flex items-center gap-1 px-3"><Plus size={14} /></button>
            </div>
            {selectedLoaders.length > 0 && t > 0 && (
              <p className="text-green-400 text-sm mt-2 font-bold">{selectedLoaders.length} عامل × {t} طن = ${loaderCost.toFixed(0)}</p>
            )}
          </div>

          <div>
            <label className="label-f text-base mb-2 block">مين السائق؟</label>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => { setNoDriver(true); setSelectedDriver('') }} className={chipOrange(noDriver)}>بدون سائق</button>
              {drivers.map(w => (
                <button key={w.id} onClick={() => { setNoDriver(false); setSelectedDriver(w.id) }} className={chipOrange(!noDriver && selectedDriver === w.id)}>
                  {w.name} (${parseFloat(w.rate)}/رحلة)
                </button>
              ))}
              <button onClick={() => { setNewWorkerRole('driver'); setShowAddWorker(true) }} className="text-frost-blue text-sm font-bold flex items-center gap-1 px-3"><Plus size={14} /></button>
            </div>
            {selectedDriver && !noDriver && <p className="text-orange-400 text-sm mt-2 font-bold">السائق: ${driverCost.toFixed(0)}</p>}
          </div>
        </div>
      )}

      {/* STEP 4: Review */}
      {step === 4 && (
        <div className="space-y-4">
          <h2 className="text-lg font-black text-frost-steel">📋 مراجعة</h2>
          <div className="card space-y-3">
            <div className="flex justify-between"><span className="text-frost-dim">النوع</span><span className={`font-bold ${type === 'in' ? 'text-green-400' : 'text-red-400'}`}>{type === 'in' ? '▼ إدخال' : '▲ إخراج'}</span></div>
            <div className="flex justify-between"><span className="text-frost-dim">الزبون</span><span className="text-frost-steel font-bold">{clientName}</span></div>
            {company && <div className="flex justify-between"><span className="text-frost-dim">الشركة</span><span className="text-frost-steel font-bold">{company}</span></div>}
            <div className="flex justify-between"><span className="text-frost-dim">الغرفة</span><span className="text-frost-steel font-bold">{roomName}</span></div>
            <div className="flex justify-between"><span className="text-frost-dim">المنتج</span><span className="text-frost-steel font-bold">{product}</span></div>
            <div className="flex justify-between"><span className="text-frost-dim">التاريخ</span><span className="text-frost-steel font-bold">{txDate}</span></div>
            <div className="flex justify-between"><span className="text-frost-dim">الشاحنة</span><span className="text-frost-steel font-bold">{plateNumber}</span></div>
            <div className="flex justify-between border-t border-frost-border pt-3 mt-2">
              <span className="text-frost-dim text-lg">الكمية</span>
              <span className="text-frost-blue font-black text-2xl">{tonnes} طن</span>
            </div>
            {(selectedLoaders.length > 0 || selectedDriver) && (
              <div className="flex justify-between"><span className="text-frost-dim">تكلفة العمالة</span><span className="text-frost-steel font-bold">${(loaderCost + driverCost).toFixed(0)}</span></div>
            )}
          </div>
        </div>
      )}

      {/* Error */}
      {error && <p className="text-red-400 text-sm font-bold mt-4 text-center">{error}</p>}

      {/* Navigation buttons - fixed at bottom */}
      <div className="fixed bottom-20 left-0 right-0 px-4 max-w-lg mx-auto">
        <div className="flex gap-3">
          {step > 1 && (
            <button onClick={prev} className="flex-1 py-3.5 rounded-2xl font-bold border-2 border-frost-border text-frost-dim">
              السابق
            </button>
          )}
          {step < 4 ? (
            <button onClick={next} className="flex-1 py-3.5 rounded-2xl font-bold bg-frost-blue text-white text-lg">
              التالي
            </button>
          ) : (
            <button onClick={submit} disabled={saving} className="flex-1 py-3.5 rounded-2xl font-bold bg-green-500 text-black text-lg flex items-center justify-center gap-2">
              {saving ? 'جاري الحفظ...' : <><Check size={20} /> تأكيد وحفظ</>}
            </button>
          )}
        </div>
      </div>
      {/* Add Client Modal */}
      {showAddClient && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center" onClick={() => setShowAddClient(false)}>
          <div className="bg-frost-dark w-full max-w-lg rounded-t-3xl p-6 space-y-4" dir="rtl" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-black text-frost-steel">زبون جديد</h2>
            <input value={newClientName} onChange={e => setNewClientName(e.target.value)} className="input-f" placeholder="الاسم" autoFocus />
            <input value={newClientPhone} onChange={e => setNewClientPhone(e.target.value)} className="input-f" placeholder="الهاتف (اختياري)" />
            <button onClick={addClient} disabled={addingSaving || !newClientName.trim()} className="btn-blue w-full">
              {addingSaving ? 'جاري الإضافة...' : 'إضافة'}
            </button>
          </div>
        </div>
      )}

      {/* Add Worker Modal */}
      {showAddWorker && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center" onClick={() => setShowAddWorker(false)}>
          <div className="bg-frost-dark w-full max-w-lg rounded-t-3xl p-6 space-y-4" dir="rtl" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-black text-frost-steel">{newWorkerRole === 'driver' ? 'سائق جديد' : 'عامل جديد'}</h2>
            <input value={newWorkerName} onChange={e => setNewWorkerName(e.target.value)} className="input-f" placeholder="الاسم" autoFocus />
            <input value={newWorkerPhone} onChange={e => setNewWorkerPhone(e.target.value)} className="input-f" placeholder="الهاتف (اختياري)" />
            {newWorkerRole === 'loader' ? (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label-f">سعر التحميل ($/طن)</label>
                  <input type="number" step="0.5" value={newWorkerRateL} onChange={e => setNewWorkerRateL(e.target.value)} className="input-f" placeholder="2" />
                </div>
                <div>
                  <label className="label-f">سعر التنزيل ($/طن)</label>
                  <input type="number" step="0.5" value={newWorkerRateU} onChange={e => setNewWorkerRateU(e.target.value)} className="input-f" placeholder="3" />
                </div>
              </div>
            ) : (
              <div>
                <label className="label-f">سعر الرحلة ($)</label>
                <input type="number" step="0.5" value={newWorkerRateD} onChange={e => setNewWorkerRateD(e.target.value)} className="input-f" placeholder="50" />
              </div>
            )}
            <button onClick={addWorker} disabled={addingSaving || !newWorkerName.trim()} className="btn-blue w-full">
              {addingSaving ? 'جاري الإضافة...' : 'إضافة'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
