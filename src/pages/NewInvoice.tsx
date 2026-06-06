import { useLang } from '../lib/i18n'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { format, differenceInDays } from 'date-fns'
import { supabase } from '../lib/supabase'
import { ArrowLeft, Calculator } from 'lucide-react'

export default function NewInvoice() {
  const { tr } = useLang()
  const nav = useNavigate()
  const [clients, setClients] = useState<any[]>([])
  const [clientId, setClientId] = useState('')
  const [periodStart, setPeriodStart] = useState(format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd'))
  const [periodEnd, setPeriodEnd] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [customRate, setCustomRate] = useState('15')
  const [customTonnes, setCustomTonnes] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [storedTonnes, setStoredTonnes] = useState(0)

  useEffect(() => {
    supabase.from('fridge_clients').select('*').eq('is_active', true).order('name').then(({ data }) => setClients(data ?? []))
  }, [])

  useEffect(() => {
    if (!clientId) return
    const client = clients.find(c => c.id === clientId)
    if (client) setCustomRate(String(client.rate_per_tonne ?? 15))
    supabase.from('fridge_inventory').select('tonnes').eq('client_id', clientId).gt('tonnes', 0)
      .then(({ data }) => {
        const total = data?.reduce((s, i) => s + parseFloat(i.tonnes), 0) ?? 0
        setStoredTonnes(total)
        setCustomTonnes(String(total))
      })
  }, [clientId, clients])

  const tonnes = parseFloat(customTonnes) || 0
  const rate = parseFloat(customRate) || 0
  const days = differenceInDays(new Date(periodEnd), new Date(periodStart)) + 1
  const months = Math.max(days / 30, 0)
  const monthsDisplay = months % 1 === 0 ? months.toFixed(0) : months.toFixed(1)
  const amount = tonnes * rate * months

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!clientId) { setError('اختر زبون'); return }
    if (tonnes <= 0) { setError('أدخل الكمية'); return }
    if (rate <= 0) { setError('أدخل السعر'); return }
    if (days <= 0) { setError('تاريخ النهاية يجب أن يكون بعد البداية'); return }

    setSaving(true)
    const { error: err } = await supabase.from('fridge_invoices').insert({
      client_id: clientId, period_start: periodStart, period_end: periodEnd,
      total_tonnes: tonnes, rate, amount: Math.round(amount * 100) / 100,
      status: 'pending', notes: notes || null,
    })
    setSaving(false)
    if (err) { setError(err.message); return }
    nav('/invoices')
  }

  const chip = (sel: boolean) => `px-4 py-2 rounded-full text-sm font-bold border cursor-pointer transition-all ${sel ? 'bg-frost-blue border-frost-blue text-white' : 'bg-frost-elevated border-frost-border text-frost-dim hover:border-frost-blue'}`

  return (
    <div className="p-4 max-w-lg mx-auto">
      <button onClick={() => nav(-1)} className="text-frost-blue text-sm font-bold flex items-center gap-1 mb-4"><ArrowLeft size={16} /> رجوع</button>
      <h1 className="text-xl font-black text-frost-steel mb-6">فاتورة جديدة</h1>

      <form onSubmit={submit} className="card space-y-5">
        {/* Client */}
        <div>
          <label className="label-f">الزبون</label>
          <div className="flex flex-wrap gap-2">
            {clients.map(c => (
              <button type="button" key={c.id} onClick={() => setClientId(c.id)} className={chip(clientId === c.id)}>{c.name}</button>
            ))}
          </div>
        </div>

        {/* Period */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label-f">من تاريخ</label>
            <input type="date" value={periodStart} onChange={e => setPeriodStart(e.target.value)} className="input-f" />
          </div>
          <div>
            <label className="label-f">إلى تاريخ</label>
            <input type="date" value={periodEnd} onChange={e => setPeriodEnd(e.target.value)} className="input-f" />
          </div>
        </div>
        {days > 0 && (
          <div className="bg-frost-elevated rounded-xl px-4 py-2 flex justify-between text-sm">
            <span className="text-frost-dim">{days} يوم</span>
            <span className="text-frost-steel font-bold">{monthsDisplay} شهر</span>
          </div>
        )}

        {/* Tonnes + Rate */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label-f">الكمية (طن)</label>
            <input type="number" step="0.1" value={customTonnes} onChange={e => setCustomTonnes(e.target.value)} className="input-f" placeholder="0" />
            {clientId && storedTonnes > 0 && (
              <p className="text-frost-dim text-xs mt-1">المخزون الحالي: {storedTonnes}t</p>
            )}
          </div>
          <div>
            <label className="label-f">السعر ($/طن/شهر)</label>
            <input type="number" step="0.5" value={customRate} onChange={e => setCustomRate(e.target.value)} className="input-f" placeholder="15" />
          </div>
        </div>

        {/* Total preview */}
        {amount > 0 && (
          <div className="bg-frost-blue/10 border border-frost-blue/30 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Calculator size={16} className="text-frost-blue" />
              <p className="text-frost-steel text-sm font-bold uppercase tracking-wide">ملخص الفاتورة</p>
            </div>
            <div className="space-y-1 text-sm text-frost-dim">
              <div className="flex justify-between"><span>الكمية</span><span className="text-frost-steel font-bold">{tonnes} طن</span></div>
              <div className="flex justify-between"><span>السعر</span><span className="text-frost-steel font-bold">${rate}/طن/شهر</span></div>
              <div className="flex justify-between"><span>المدة</span><span className="text-frost-steel font-bold">{monthsDisplay} شهر</span></div>
            </div>
            <div className="border-t border-frost-border/50 mt-3 pt-3 flex justify-between items-end">
              <span className="text-frost-dim text-sm">{tonnes}t × ${rate} × {monthsDisplay} شهر</span>
              <span className="text-frost-steel text-3xl font-black">${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          </div>
        )}

        <div>
          <label className="label-f">ملاحظات (اختياري)</label>
          <input value={notes} onChange={e => setNotes(e.target.value)} className="input-f" placeholder="شروط الدفع، تفاصيل..." />
        </div>

        {error && <p className="text-red-400 text-sm font-semibold">{error}</p>}
        <button type="submit" disabled={saving || !clientId || amount <= 0} className="btn-blue">
          {saving ? 'جاري الإنشاء...' : `إنشاء فاتورة — $${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
        </button>
      </form>
    </div>
  )
}
