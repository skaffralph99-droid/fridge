import { useLang } from '../lib/i18n'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ArrowLeft } from 'lucide-react'

const TYPES = ['farmer', 'factory', 'distributor', 'other']
const TERMS = ['monthly', 'seasonal', 'lump_sum']

export default function NewClient() {
  const { tr, dir } = useLang()
  const nav = useNavigate()
  const [name, setName] = useState(''); const [phone, setPhone] = useState('')
  const [company, setCompany] = useState(''); const [whatsapp, setWhatsapp] = useState('')
  const [type, setType] = useState('farmer'); const [rate, setRate] = useState('45')
  const [terms, setTerms] = useState('monthly'); const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false); const [error, setError] = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) { setError('الاسم مطلوب'); return }
    setSaving(true)
    const { error: err } = await supabase.from('fridge_clients').insert({
      name: name.trim(), phone: phone || null, company: company || null,
      whatsapp: whatsapp || phone || null, client_type: type,
      rate_per_tonne: parseFloat(rate) || 45, payment_terms: terms, notes: notes || null,
    })
    setSaving(false)
    if (err) { setError(err.message); return }
    nav('/clients')
  }

  const chip = (sel: boolean) => `px-4 py-2 rounded-full text-sm font-bold border cursor-pointer transition-all ${sel ? 'bg-frost-blue border-frost-blue text-white' : 'bg-frost-elevated border-frost-border text-frost-dim'}`

  return (
    <div dir={dir} className="p-4 max-w-lg mx-auto">
      <button onClick={() => nav(-1)} className="text-frost-blue text-sm font-bold flex items-center gap-1 mb-4"><ArrowLeft size={16} /> {tr('back')}</button>
      <h1 className="text-xl font-black text-frost-steel mb-6">{tr('newClient')}</h1>
      <form onSubmit={submit} className="card space-y-4">
        <div><label className="label-f">الاسم *</label><input value={name} onChange={e => setName(e.target.value)} className="input-f" placeholder="أحمد خليل" /></div>
        <div><label className="label-f">الشركة</label><input value={company} onChange={e => setCompany(e.target.value)} className="input-f" placeholder="مزارع البقاع" /></div>
        <div><label className="label-f">{tr('phone')}</label><input value={phone} onChange={e => setPhone(e.target.value)} className="input-f" placeholder="+961 XX XXX XXX" /></div>
        <div><label className="label-f">واتساب</label><input value={whatsapp} onChange={e => setWhatsapp(e.target.value)} className="input-f" placeholder="نفس رقم الهاتف إذا فارغ" /></div>
        <div><label className="label-f">النوع</label><div className="flex flex-wrap gap-2">{TYPES.map(t => <button type="button" key={t} onClick={() => setType(t)} className={chip(type === t)}>{t === 'farmer' ? '🌾' : t === 'factory' ? '🏭' : t === 'distributor' ? '🚚' : '📦'} {t}</button>)}</div></div>
        <div><label className="label-f">السعر ($/طن)</label><input value={rate} onChange={e => setRate(e.target.value)} className="input-f" type="number" step="0.5" /></div>
        <div><label className="label-f">شروط الدفع</label><div className="flex flex-wrap gap-2">{TERMS.map(t => <button type="button" key={t} onClick={() => setTerms(t)} className={chip(terms === t)}>{t.replace('_', ' ')}</button>)}</div></div>
        <div><label className="label-f">ملاحظات</label><input value={notes} onChange={e => setNotes(e.target.value)} className="input-f" placeholder="ترتيبات خاصة..." /></div>
        {error && <p className="text-red-400 text-sm font-semibold">{error}</p>}
        <button type="submit" disabled={saving} className="btn-blue">{saving ? tr('saving') : 'إضافة زبون'}</button>
      </form>
    </div>
  )
}
