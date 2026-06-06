import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { ArrowRight, Plus, Check, ChevronLeft } from 'lucide-react'

const PRODUCTS = ['بطاطا', 'تفاح', 'بصل', 'قمح', 'لحوم', 'جبنة', 'ألبان', 'مجمّدات', 'أخرى']

export default function NewTransaction() {
  const nav = useNavigate()
  const { user } = useAuth()
  const [params] = useSearchParams()
  const [step, setStep] = useState(1)
  const [type, setType] = useState<'in' | 'out'>('in')
  const [clients, setClients] = useState<any[]>([])
  const [rooms, setRooms] = useState<any[]>([])
  const [workers, setWorkers] = useState<any[]>([])
  const [clientId, setClientId] = useState('')
  const [roomId, setRoomId] = useState('')
  const [product, setProduct] = useState('بطاطا')
  const [company, setCompany] = useState('')
  const [txDate, setTxDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [plateNumber, setPlateNumber] = useState('')
  const [weightFirst, setWeightFirst] = useState('')
  const [weightSecond, setWeightSecond] = useState('')
  const [selectedLoaders, setSelectedLoaders] = useState<string[]>([])
  const [noLoaders, setNoLoaders] = useState(false)
  const [selectedDriver, setSelectedDriver] = useState('')
  const [noDriver, setNoDriver] = useState(false)
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [clientInventory, setClientInventory] = useState<any[]>([])

  // Inline modals — no more navigating away
  const [showNewClient, setShowNewClient] = useState(false)
  const [showNewWorker, setShowNewWorker] = useState(false)
  const [newClientName, setNewClientName] = useState('')
  const [newClientPhone, setNewClientPhone] = useState('')
  const [newClientRate, setNewClientRate] = useState('45')
  const [newWorkerName, setNewWorkerName] = useState('')
  const [newWorkerRole, setNewWorkerRole] = useState<'loader' | 'driver'>('loader')
  const [newWorkerRateLoad, setNewWorkerRateLoad] = useState('')
  const [newWorkerRateUnload, setNewWorkerRateUnload] = useState('')
  const [newWorkerRateDriver, setNewWorkerRateDriver] = useState('')
  const [modalSaving, setModalSaving] = useState(false)
  const [modalError, setModalError] = useState('')

  const wFirst = parseFloat(weightFirst) || 0
  const wSecond = parseFloat(weightSecond) || 0
  const netKg = Math.abs(wSecond - wFirst)
  const tonnes = netKg > 0 ? (netKg / 1000).toFixed(2) : ''
  const t = parseFloat(tonnes) || 0

  useEffect(() => {
    supabase.from('fridge_clients').select('*').eq('is_active', true).order('name').then(({ data }) => setClients(data ?? []))
    supabase.from('fridge_rooms').select('*').eq('is_active', true).order('name').then(({ data }) => setRooms(data ?? []))
    supabase.from('fridge_workers').select('*').eq('is_active', true).order('name').then(({ data }) => setWorkers(data ?? []))
  }, [])

  // Restore newClientId from URL if coming back from standalone page (backwards compat)
  useEffect(() => {
    const nc = params.get('newClientId')
    if (nc) setClientId(nc)
  }, [params])

  useEffect(() => {
    if (!clientId || !roomId) { setClientInventory([]); return }
    supabase.from('fridge_inventory').select('*').eq('client_id', clientId).eq('room_id', roomId).gt('tonnes', 0)
      .then(({ data }) => setClientInventory(data ?? []))
  }, [clientId, roomId])

  const loaders = workers.filter(w => w.role === 'loader')
  const drivers = workers.filter(w => w.role === 'driver')
  const loaderCost = selectedLoaders.reduce((sum, id) => {
    const w = workers.find(x => x.id === id)
    const r = type === 'in' ? parseFloat(w?.rate_loading ?? w?.rate ?? 0) : parseFloat(w?.rate_unloading ?? w?.rate ?? 0)
    return sum + r * t
  }, 0)
  const driverCost = selectedDriver ? parseFloat(workers.find(w => w.id === selectedDriver)?.rate ?? 0) : 0

  const toggleLoader = (id: string) => { setNoLoaders(false); setSelectedLoaders(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]) }

  const clientName = clients.find(c => c.id === clientId)?.name ?? ''
  const roomName = rooms.find(r => r.id === roomId)?.name ?? ''

  const validate = () => {
    setError('')
    if (step === 1) {
      if (!clientId) return err('اختر الزبون')
      if (!roomId) return err('اختر الغرفة')
      if (type === 'out') {
        const room = rooms.find(r => r.id === roomId)
        if (room && parseFloat(room.current_tonnes) <= 0) return err('الغرفة فارغة — لا يوجد شيء للإخراج')
        if (clientInventory.length === 0) return err('هذا الزبون ليس لديه بضاعة في هذه الغرفة')
        const inv = clientInventory.find(i => i.product_type === product)
        if (!inv || parseFloat(inv.tonnes) <= 0) return err(`الزبون ليس لديه ${product} في هذه الغرفة`)
      }
    }
    if (step === 2) { if (!plateNumber) return err('أدخل رقم الشاحنة'); if (!weightFirst || !weightSecond) return err('أدخل الوزنتين') }
    if (step === 3) { if (!noLoaders && selectedLoaders.length === 0) return err('اختر العمال أو "بدون"'); if (!noDriver && !selectedDriver) return err('اختر السائق أو "بدون"') }
    return true
  }
  const err = (msg: string) => { setError(msg); return false }
  const next = () => { if (validate()) setStep(s => Math.min(s + 1, 4)) }
  const prev = () => { setError(''); setStep(s => Math.max(s - 1, 1)) }

  const submit = async () => {
    if (!confirm('تأكيد حفظ هذه الحركة؟')) return
    setSaving(true); setError('')
    const { data: room } = await supabase.from('fridge_rooms').select('*').eq('id', roomId).single()
    if (!room) { setError('غرفة غير موجودة'); setSaving(false); return }
    const cur = parseFloat(room.current_tonnes) || 0
    const cap = parseFloat(room.capacity_tonnes) || 0
    if (type === 'in' && cur + t > cap) { setError(`المساحة غير كافية (${(cap - cur).toFixed(1)}t متاح)`); setSaving(false); return }
    if (type === 'out') { const inv = clientInventory.find(i => i.product_type === product); if (!inv || parseFloat(inv.tonnes) < t) { setError('الكمية غير كافية'); setSaving(false); return } }

    const { data: tx, error: e } = await supabase.from('fridge_transactions').insert({ client_id: clientId, room_id: roomId, type, product_type: product, tonnes: t, date: txDate, notes: notes || null, recorded_by: user?.id, plate_number: plateNumber, weight_first: wFirst, weight_second: wSecond, weight_net: netKg, company: company || null }).select('id, ticket_no').single()
    if (e) { setError(e.message); setSaving(false); return }

    await supabase.from('fridge_rooms').update({ current_tonnes: type === 'in' ? cur + t : Math.max(0, cur - t) }).eq('id', roomId)

    const { data: inv } = await supabase.from('fridge_inventory').select('*').eq('client_id', clientId).eq('room_id', roomId).eq('product_type', product).single()
    if (inv) { const q = type === 'in' ? parseFloat(inv.tonnes) + t : Math.max(0, parseFloat(inv.tonnes) - t); q <= 0 ? await supabase.from('fridge_inventory').delete().eq('id', inv.id) : await supabase.from('fridge_inventory').update({ tonnes: q }).eq('id', inv.id) }
    else if (type === 'in') await supabase.from('fridge_inventory').insert({ client_id: clientId, room_id: roomId, product_type: product, tonnes: t })

    const recs: any[] = []
    if (!noLoaders) for (const lid of selectedLoaders) { const w = workers.find(x => x.id === lid); if (w) { const r = type === 'in' ? parseFloat(w.rate_loading ?? w.rate) : parseFloat(w.rate_unloading ?? w.rate); recs.push({ transaction_id: tx.id, worker_id: lid, role: 'loader', earnings: r * t }) } }
    if (!noDriver && selectedDriver) { const w = workers.find(x => x.id === selectedDriver); if (w) recs.push({ transaction_id: tx.id, worker_id: selectedDriver, role: 'driver', earnings: parseFloat(w.rate) }) }
    if (recs.length > 0) await supabase.from('fridge_transaction_workers').insert(recs)

    setSaving(false)
    
    // Open receipt directly (popup blockers block after confirm)
    {
      const lines = [
        '<div class="row"><span>النوع</span><span>' + (type === 'in' ? 'إدخال ▼' : 'إخراج ▲') + '</span></div>',
        '<div class="row"><span>الزبون</span><span>' + clientName + '</span></div>',
        company ? '<div class="row"><span>الشركة</span><span>' + company + '</span></div>' : '',
        '<div class="row"><span>الغرفة</span><span>' + roomName + '</span></div>',
        '<div class="row"><span>المنتج</span><span>' + product + '</span></div>',
        '<div class="row"><span>الشاحنة</span><span>' + plateNumber + '</span></div>',
        '<div class="row"><span>الوزنة ١</span><span>' + wFirst.toLocaleString() + ' كغ</span></div>',
        '<div class="row"><span>الوزنة ٢</span><span>' + wSecond.toLocaleString() + ' كغ</span></div>',
        '<div class="big">' + tonnes + ' طن</div>',
      ].filter(Boolean).join('')

      const html = '<!DOCTYPE html><html lang="ar"><head><meta charset="UTF-8"><title>إيصال</title>' +
        '<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Segoe UI,sans-serif;padding:30px;color:#1a1a2e;direction:rtl;max-width:400px;margin:0 auto}' +
        '.hdr{text-align:center;border-bottom:2px solid #000;padding-bottom:15px;margin-bottom:15px}.hdr h1{font-size:20px}.hdr p{color:#666;font-size:12px;margin-top:4px}' +
        '.row{display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #eee;font-size:14px}.row span:last-child{font-weight:700}' +
        '.big{font-size:24px;text-align:center;margin:15px 0;font-weight:900}.ft{text-align:center;margin-top:20px;color:#999;font-size:11px}' +
        '@media print{body{padding:10px}}</style></head><body>' +
        '<div class="hdr"><h1>❄️ إيصال تخزين</h1><p>بطاقة #' + tx.ticket_no + '</p></div>' +
        lines +
        '<div class="ft">❄️ إدارة التبريد</div>' +
        '<script>window.onload=function(){window.print()}<\/script></body></html>'
      
      const win = window.open('', '_blank')
      if (win) { win.document.write(html); win.document.close() }
    }
    alert('✅ تم الحفظ — بطاقة #' + tx.ticket_no)
    nav('/transactions')
  }

  // --- UI helpers ---
  const Chip = ({ selected, onClick, children, color = 'blue' }: any) => {
    const colors: any = {
      blue: selected ? 'bg-frost-blue border-frost-blue text-white shadow-lg shadow-frost-blue/20' : 'bg-frost-elevated border-frost-border text-frost-dim',
      green: selected ? 'bg-green-500 border-green-500 text-white shadow-lg shadow-green-500/20' : 'bg-frost-elevated border-frost-border text-frost-dim',
      orange: selected ? 'bg-orange-500 border-orange-500 text-white shadow-lg shadow-orange-500/20' : 'bg-frost-elevated border-frost-border text-frost-dim',
      red: selected ? 'bg-red-500/20 border-red-500 text-red-400' : 'bg-frost-elevated border-frost-border text-frost-dim',
    }
    return <button type="button" onClick={onClick} className={`px-5 py-3 rounded-2xl text-sm font-bold border-2 transition-all active:scale-95 ${colors[color]}`}>{children}</button>
  }

  const Label = ({ children }: any) => <p className="text-frost-steel font-bold text-base mb-3">{children}</p>
  const steps = ['الزبون', 'القبان', 'العمال', 'تأكيد']

  return (
    <div className="min-h-screen bg-frost-bg">
      {/* Top bar */}
      <div className="sticky top-0 z-10 bg-frost-dark/95 backdrop-blur-md border-b border-frost-border/50 px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <button onClick={() => step > 1 ? prev() : nav(-1)} className="text-frost-blue font-bold text-sm flex items-center gap-1">
            <ArrowRight size={16} /> {step > 1 ? 'السابق' : 'رجوع'}
          </button>
          <div className="flex gap-1.5">
            {steps.map((s, i) => (
              <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i + 1 <= step ? 'bg-frost-blue w-8' : 'bg-frost-border w-4'}`} />
            ))}
          </div>
          <span className="text-frost-dim text-xs font-bold">{step}/4</span>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-5 pb-32">

        {/* Type toggle — always visible */}
        <div className="flex gap-2 mb-6">
          <button onClick={() => setType('in')} className={`flex-1 py-4 rounded-2xl font-black text-lg border-2 transition-all active:scale-[0.98] ${type === 'in' ? 'bg-green-500 border-green-500 text-black shadow-lg shadow-green-500/20' : 'border-frost-border text-frost-dim'}`}>
            ▼ إدخال
          </button>
          <button onClick={() => setType('out')} className={`flex-1 py-4 rounded-2xl font-black text-lg border-2 transition-all active:scale-[0.98] ${type === 'out' ? 'bg-red-500 border-red-500 text-white shadow-lg shadow-red-500/20' : 'border-frost-border text-frost-dim'}`}>
            ▲ إخراج
          </button>
        </div>

        {/* ===== STEP 1 ===== */}
        {step === 1 && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <Label>من الزبون؟</Label>
              <div className="flex flex-wrap gap-2">
                {clients.map(c => <Chip key={c.id} selected={clientId === c.id} onClick={() => setClientId(c.id)}>{c.name}</Chip>)}
                <button onClick={() => { setNewClientName(''); setNewClientPhone(''); setNewClientRate('15'); setModalError(''); setShowNewClient(true) }} className="px-5 py-3 rounded-2xl border-2 border-dashed border-frost-border text-frost-blue text-sm font-bold flex items-center gap-1 active:scale-95"><Plus size={14} /> جديد</button>
              </div>
            </div>

            {clientId && (
              <div className="animate-fadeIn">
                <Label>الشركة المورّدة (اختياري)</Label>
                <input value={company} onChange={e => setCompany(e.target.value)} className="input-f text-base" placeholder="اسم الشركة" />
              </div>
            )}

            <div>
              <Label>أي غرفة؟</Label>
              <div className="flex flex-wrap gap-2">
                {rooms.map(r => {
                  const pct = Math.round((parseFloat(r.current_tonnes) / parseFloat(r.capacity_tonnes)) * 100)
                  const full = pct >= 95
                  return (
                    <Chip key={r.id} selected={roomId === r.id} onClick={() => !full && setRoomId(r.id)} color={full ? 'red' : 'blue'}>
                      {r.name}
                      <span className="text-[10px] opacity-70 mr-1">({pct}%)</span>
                    </Chip>
                  )
                })}
              </div>
            </div>

            <div>
              <Label>المنتج</Label>
              <div className="flex flex-wrap gap-2">
                {(type === 'out' && clientId && roomId ? clientInventory.map(i => i.product_type) : PRODUCTS).map(p => (
                  <Chip key={p} selected={product === p} onClick={() => setProduct(p)}>{p}</Chip>
                ))}
              </div>
            </div>

            <div>
              <Label>{type === 'in' ? 'تاريخ التحميل' : 'تاريخ التنزيل'}</Label>
              <input type="date" value={txDate} onChange={e => setTxDate(e.target.value)} className="input-f text-base" />
            </div>
          </div>
        )}

        {/* ===== STEP 2 ===== */}
        {step === 2 && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <Label>رقم الشاحنة</Label>
              <input value={plateNumber} onChange={e => setPlateNumber(e.target.value)} className="input-f text-xl text-center tracking-widest font-bold" placeholder="338455" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>الوزنة الأولى</Label>
                <input type="number" value={weightFirst} onChange={e => setWeightFirst(e.target.value)} className="input-f text-xl text-center font-bold" placeholder="كغ" />
              </div>
              <div>
                <Label>الوزنة الثانية</Label>
                <input type="number" value={weightSecond} onChange={e => setWeightSecond(e.target.value)} className="input-f text-xl text-center font-bold" placeholder="كغ" />
              </div>
            </div>

            {netKg > 0 && (
              <div className="bg-gradient-to-b from-frost-blue/10 to-frost-blue/5 border-2 border-frost-blue/30 rounded-3xl p-6 text-center animate-fadeIn">
                <p className="text-frost-dim text-sm mb-2">الوزن الصافي</p>
                <p className="text-frost-blue font-black text-5xl mb-1">{(netKg / 1000).toFixed(2)}</p>
                <p className="text-frost-blue/60 text-sm font-bold">طن</p>
              </div>
            )}

            <div>
              <Label>ملاحظات (اختياري)</Label>
              <input value={notes} onChange={e => setNotes(e.target.value)} className="input-f" placeholder="دفعة، نوعية..." />
            </div>
          </div>
        )}

        {/* ===== STEP 3 ===== */}
        {step === 3 && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <Label>مين حمّل؟</Label>
              <div className="flex flex-wrap gap-2">
                <Chip selected={noLoaders} onClick={() => { setNoLoaders(true); setSelectedLoaders([]) }} color="blue">بدون</Chip>
                {loaders.map(w => (
                  <Chip key={w.id} selected={!noLoaders && selectedLoaders.includes(w.id)} onClick={() => toggleLoader(w.id)} color="green">
                    {w.name}
                    <span className="text-[10px] opacity-70 mr-1">${type === 'in' ? parseFloat(w.rate_loading ?? w.rate) : parseFloat(w.rate_unloading ?? w.rate)}/t</span>
                  </Chip>
                ))}
                <button onClick={() => { setNewWorkerRole('loader'); setNewWorkerName(''); setNewWorkerRateLoad(''); setNewWorkerRateUnload(''); setModalError(''); setShowNewWorker(true) }} className="px-5 py-3 rounded-2xl border-2 border-dashed border-frost-border text-frost-blue text-sm font-bold flex items-center gap-1 active:scale-95"><Plus size={14} /></button>
              </div>
              {selectedLoaders.length > 0 && t > 0 && (
                <p className="text-green-400 text-sm mt-3 font-bold bg-green-500/10 rounded-xl px-4 py-2 inline-block">
                  {selectedLoaders.length} عامل × {t}t = ${loaderCost.toFixed(0)}
                </p>
              )}
            </div>

            <div>
              <Label>مين السائق؟</Label>
              <div className="flex flex-wrap gap-2">
                <Chip selected={noDriver} onClick={() => { setNoDriver(true); setSelectedDriver('') }} color="blue">بدون</Chip>
                {drivers.map(w => (
                  <Chip key={w.id} selected={!noDriver && selectedDriver === w.id} onClick={() => { setNoDriver(false); setSelectedDriver(w.id) }} color="orange">
                    {w.name}
                    <span className="text-[10px] opacity-70 mr-1">${parseFloat(w.rate)}</span>
                  </Chip>
                ))}
                <button onClick={() => { setNewWorkerRole('driver'); setNewWorkerName(''); setNewWorkerRateDriver(''); setModalError(''); setShowNewWorker(true) }} className="px-5 py-3 rounded-2xl border-2 border-dashed border-frost-border text-frost-blue text-sm font-bold flex items-center gap-1 active:scale-95"><Plus size={14} /></button>
              </div>
              {selectedDriver && !noDriver && (
                <p className="text-orange-400 text-sm mt-3 font-bold bg-orange-500/10 rounded-xl px-4 py-2 inline-block">
                  السائق: ${driverCost.toFixed(0)}
                </p>
              )}
            </div>

            {(loaderCost + driverCost) > 0 && (
              <div className="bg-frost-elevated rounded-2xl p-4 flex justify-between items-center">
                <span className="text-frost-dim">إجمالي العمالة</span>
                <span className="text-frost-steel font-black text-xl">${(loaderCost + driverCost).toFixed(0)}</span>
              </div>
            )}
          </div>
        )}

        {/* ===== STEP 4 ===== */}
        {step === 4 && (
          <div className="animate-fadeIn">
            <div className="rounded-3xl border-2 border-frost-border overflow-hidden">
              {/* Type header */}
              <div className={`px-5 py-4 ${type === 'in' ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                <div className="flex justify-between items-center">
                  <span className={`font-black text-lg ${type === 'in' ? 'text-green-400' : 'text-red-400'}`}>{type === 'in' ? '▼ إدخال بضاعة' : '▲ إخراج بضاعة'}</span>
                  {t > 0 && <span className="text-frost-blue font-black text-2xl">{tonnes} طن</span>}
                </div>
              </div>
              {/* Details */}
              <div className="p-5 space-y-3">
                <R label="الزبون" value={clientName} />
                {company && <R label="الشركة" value={company} />}
                <R label="الغرفة" value={roomName} />
                <R label="المنتج" value={product} />
                <R label="التاريخ" value={txDate} />
                <R label="الشاحنة" value={plateNumber} />
                <R label="الوزنة ١" value={`${wFirst.toLocaleString()} كغ`} />
                <R label="الوزنة ٢" value={`${wSecond.toLocaleString()} كغ`} />
                {(loaderCost + driverCost) > 0 && <R label="تكلفة العمالة" value={`$${(loaderCost + driverCost).toFixed(0)}`} />}
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {error && <div className="mt-4 bg-red-500/10 border border-red-500/30 rounded-2xl px-4 py-3 text-center"><p className="text-red-400 text-sm font-bold">{error}</p></div>}
      </div>

      {/* Bottom CTA */}
      <div className="fixed bottom-16 left-0 right-0 p-4 bg-gradient-to-t from-frost-bg via-frost-bg to-transparent">
        <div className="max-w-lg mx-auto">
          {step < 4 ? (
            <button onClick={next} className="w-full py-4 rounded-2xl font-black text-lg bg-frost-blue text-white shadow-lg shadow-frost-blue/30 active:scale-[0.98] transition-all">
              التالي
            </button>
          ) : (
            <button onClick={submit} disabled={saving} className="w-full py-4 rounded-2xl font-black text-lg bg-green-500 text-black shadow-lg shadow-green-500/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
              {saving ? <span className="animate-pulse">جاري الحفظ...</span> : <><Check size={22} strokeWidth={3} /> تأكيد وحفظ</>}
            </button>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: translateY(0) } }
        .animate-fadeIn { animation: fadeIn 0.25s ease-out }
      `}</style>

      {/* ===== NEW CLIENT MODAL ===== */}
      {showNewClient && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={() => setShowNewClient(false)}>
          <div className="bg-frost-dark border border-frost-border rounded-3xl p-6 w-full max-w-sm space-y-4" onClick={e => e.stopPropagation()}>
            <h2 className="text-frost-steel font-black text-lg">زبون جديد</h2>
            <div><label className="label-f">الاسم *</label><input value={newClientName} onChange={e => setNewClientName(e.target.value)} className="input-f" placeholder="أحمد خليل" /></div>
            <div><label className="label-f">الهاتف</label><input value={newClientPhone} onChange={e => setNewClientPhone(e.target.value)} className="input-f" placeholder="+961 XX XXX XXX" /></div>
            <div><label className="label-f">السعر ($/طن/شهر)</label><input value={newClientRate} onChange={e => setNewClientRate(e.target.value)} className="input-f" type="number" step="0.5" /></div>
            {modalError && <p className="text-red-400 text-sm font-semibold">{modalError}</p>}
            <div className="flex gap-3">
              <button disabled={modalSaving} onClick={async () => {
                if (!newClientName.trim()) { setModalError('الاسم مطلوب'); return }
                setModalSaving(true); setModalError('')
                const { data, error: err } = await supabase.from('fridge_clients').insert({
                  name: newClientName.trim(), phone: newClientPhone || null,
                  rate_per_tonne: parseFloat(newClientRate) || 15, payment_terms: 'seasonal',
                }).select().single()
                setModalSaving(false)
                if (err) { setModalError(err.message); return }
                const { data: refreshed } = await supabase.from('fridge_clients').select('*').eq('is_active', true).order('name')
                if (refreshed) setClients(refreshed)
                setClientId(data.id)
                setShowNewClient(false)
              }} className="btn-blue flex-1">{modalSaving ? 'جاري...' : 'إضافة'}</button>
              <button onClick={() => setShowNewClient(false)} className="px-4 py-2 text-frost-dim font-bold">إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {/* ===== NEW WORKER MODAL ===== */}
      {showNewWorker && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={() => setShowNewWorker(false)}>
          <div className="bg-frost-dark border border-frost-border rounded-3xl p-6 w-full max-w-sm space-y-4" onClick={e => e.stopPropagation()}>
            <h2 className="text-frost-steel font-black text-lg">{newWorkerRole === 'loader' ? 'عامل تحميل جديد' : 'سائق جديد'}</h2>
            <div><label className="label-f">الاسم *</label><input value={newWorkerName} onChange={e => setNewWorkerName(e.target.value)} className="input-f" placeholder="مثال: حسن" /></div>
            {newWorkerRole === 'loader' ? (
              <>
                <div><label className="label-f">سعر التحميل ($/طن) *</label><input type="number" step="0.5" value={newWorkerRateLoad} onChange={e => setNewWorkerRateLoad(e.target.value)} className="input-f" placeholder="2" /></div>
                <div><label className="label-f">سعر التنزيل ($/طن) *</label><input type="number" step="0.5" value={newWorkerRateUnload} onChange={e => setNewWorkerRateUnload(e.target.value)} className="input-f" placeholder="3" /></div>
              </>
            ) : (
              <div><label className="label-f">سعر الرحلة ($) *</label><input type="number" step="0.5" value={newWorkerRateDriver} onChange={e => setNewWorkerRateDriver(e.target.value)} className="input-f" placeholder="50" /></div>
            )}
            {modalError && <p className="text-red-400 text-sm font-semibold">{modalError}</p>}
            <div className="flex gap-3">
              <button disabled={modalSaving} onClick={async () => {
                if (!newWorkerName.trim()) { setModalError('الاسم مطلوب'); return }
                if (newWorkerRole === 'loader' && (!newWorkerRateLoad || !newWorkerRateUnload)) { setModalError('أدخل الأسعار'); return }
                if (newWorkerRole === 'driver' && !newWorkerRateDriver) { setModalError('أدخل سعر الرحلة'); return }
                setModalSaving(true); setModalError('')
                const { data, error: err } = await supabase.from('fridge_workers').insert({
                  name: newWorkerName.trim(), role: newWorkerRole,
                  rate: newWorkerRole === 'driver' ? parseFloat(newWorkerRateDriver) : parseFloat(newWorkerRateLoad),
                  rate_loading: newWorkerRole === 'loader' ? parseFloat(newWorkerRateLoad) : 0,
                  rate_unloading: newWorkerRole === 'loader' ? parseFloat(newWorkerRateUnload) : 0,
                }).select().single()
                setModalSaving(false)
                if (err) { setModalError(err.message); return }
                const { data: refreshed } = await supabase.from('fridge_workers').select('*').eq('is_active', true).order('name')
                if (refreshed) setWorkers(refreshed)
                if (newWorkerRole === 'loader') setSelectedLoaders(prev => [...prev, data.id])
                else setSelectedDriver(data.id)
                setNoLoaders(false); setNoDriver(false)
                setShowNewWorker(false)
              }} className="btn-blue flex-1">{modalSaving ? 'جاري...' : 'إضافة'}</button>
              <button onClick={() => setShowNewWorker(false)} className="px-4 py-2 text-frost-dim font-bold">إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function R({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between items-center py-1"><span className="text-frost-dim text-sm">{label}</span><span className="text-frost-steel font-bold">{value}</span></div>
}
