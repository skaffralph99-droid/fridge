import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { supabase } from '../lib/supabase'
import { ArrowLeft, Calculator } from 'lucide-react'

export default function NewInvoice() {
  const nav = useNavigate()
  const [clients, setClients] = useState<any[]>([])
  const [clientId, setClientId] = useState('')
  const [periodStart, setPeriodStart] = useState(format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd'))
  const [periodEnd, setPeriodEnd] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [customRate, setCustomRate] = useState('')
  const [customTonnes, setCustomTonnes] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Auto-calculated values
  const [storedTonnes, setStoredTonnes] = useState(0)
  const [clientRate, setClientRate] = useState(45)

  useEffect(() => {
    supabase.from('fridge_clients').select('*').eq('is_active', true).order('name').then(({ data }) => setClients(data ?? []))
  }, [])

  // When client changes, get their stored tonnes and rate
  useEffect(() => {
    if (!clientId) return
    const client = clients.find(c => c.id === clientId)
    if (client) {
      setClientRate(client.rate_per_tonne)
      setCustomRate(String(client.rate_per_tonne))
    }
    supabase.from('fridge_inventory').select('tonnes').eq('client_id', clientId).gt('tonnes', 0)
      .then(({ data }) => {
        const total = data?.reduce((s, i) => s + parseFloat(i.tonnes), 0) ?? 0
        setStoredTonnes(total)
        setCustomTonnes(String(total))
      })
  }, [clientId, clients])

  const tonnes = parseFloat(customTonnes) || 0
  const rate = parseFloat(customRate) || 0
  const amount = tonnes * rate

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!clientId) { setError('Select a client'); return }
    if (tonnes <= 0) { setError('Enter tonnage'); return }
    if (rate <= 0) { setError('Enter rate'); return }

    setSaving(true)
    const { error: err } = await supabase.from('fridge_invoices').insert({
      client_id: clientId,
      period_start: periodStart,
      period_end: periodEnd,
      total_tonnes: tonnes,
      rate,
      amount,
      status: 'pending',
      notes: notes || null,
    })
    setSaving(false)
    if (err) { setError(err.message); return }
    nav('/invoices')
  }

  const chip = (sel: boolean) => `px-4 py-2 rounded-full text-sm font-bold border cursor-pointer transition-all ${sel ? 'bg-frost-blue border-frost-blue text-white' : 'bg-frost-elevated border-frost-border text-frost-dim hover:border-frost-blue'}`

  return (
    <div className="p-4 max-w-lg mx-auto">
      <button onClick={() => nav(-1)} className="text-frost-blue text-sm font-bold flex items-center gap-1 mb-4"><ArrowLeft size={16} /> Back</button>
      <h1 className="text-xl font-black text-frost-steel mb-6">New Invoice</h1>

      <form onSubmit={submit} className="card space-y-5">
        {/* Client picker */}
        <div>
          <label className="label-f">Client</label>
          <div className="flex flex-wrap gap-2">
            {clients.map(c => (
              <button type="button" key={c.id} onClick={() => setClientId(c.id)} className={chip(clientId === c.id)}>
                {c.name}
              </button>
            ))}
          </div>
        </div>

        {/* Period */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label-f">Period Start</label>
            <input type="date" value={periodStart} onChange={e => setPeriodStart(e.target.value)} className="input-f" />
          </div>
          <div>
            <label className="label-f">Period End</label>
            <input type="date" value={periodEnd} onChange={e => setPeriodEnd(e.target.value)} className="input-f" />
          </div>
        </div>

        {/* Tonnes + Rate */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label-f">Tonnes</label>
            <input type="number" step="0.1" value={customTonnes} onChange={e => setCustomTonnes(e.target.value)} className="input-f" placeholder="0" />
            {clientId && storedTonnes > 0 && (
              <p className="text-frost-dim text-xs mt-1">Currently stored: {storedTonnes}t</p>
            )}
          </div>
          <div>
            <label className="label-f">Rate ($/tonne)</label>
            <input type="number" step="0.5" value={customRate} onChange={e => setCustomRate(e.target.value)} className="input-f" placeholder="45" />
          </div>
        </div>

        {/* Total preview */}
        {amount > 0 && (
          <div className="bg-frost-blue/10 border border-frost-blue/30 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calculator size={16} className="text-frost-blue" />
              <p className="text-frost-steel text-sm font-bold uppercase tracking-wide">Invoice Summary</p>
            </div>
            <div className="flex justify-between text-sm text-frost-dim">
              <span>{tonnes}t × ${rate}/t</span>
              <span>{periodStart} → {periodEnd}</span>
            </div>
            <p className="text-frost-steel text-3xl font-black mt-2">${amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
          </div>
        )}

        <div>
          <label className="label-f">Notes (optional)</label>
          <input value={notes} onChange={e => setNotes(e.target.value)} className="input-f" placeholder="Payment terms, batch details..." />
        </div>

        {error && <p className="text-red-400 text-sm font-semibold">{error}</p>}
        <button type="submit" disabled={saving || !clientId || amount <= 0} className="btn-blue">
          {saving ? 'Creating...' : `Create Invoice — $${amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
        </button>
      </form>
    </div>
  )
}
