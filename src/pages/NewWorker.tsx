import { useLang } from '../lib/i18n'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ArrowRight } from 'lucide-react'

export default function NewWorker() {
  const { tr, dir } = useLang()
  const nav = useNavigate()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [role, setRole] = useState<'loader' | 'driver'>('loader')
  const [rateLoading, setRateLoading] = useState('')
  const [rateUnloading, setRateUnloading] = useState('')
  const [rateDriver, setRateDriver] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) { setError('الاسم مطلوب'); return }
    if (role === 'loader' && (!rateLoading || !rateUnloading)) { setError('يرجى إدخال سعر التحميل والتنزيل'); return }
    if (role === 'driver' && !rateDriver) { setError('يرجى إدخال سعر الرحلة'); return }
    setSaving(true)
    const { error: err } = await supabase.from('fridge_workers').insert({
      name: name.trim(), phone: phone || null, role,
      rate: role === 'driver' ? parseFloat(rateDriver) : parseFloat(rateLoading),
      rate_loading: role === 'loader' ? parseFloat(rateLoading) : 0,
      rate_unloading: role === 'loader' ? parseFloat(rateUnloading) : 0,
    })
    setSaving(false)
    if (err) { setError(err.message); return }
    nav('/workers')
  }

  const chip = (sel: boolean) => `px-4 py-2 rounded-full text-sm font-bold border cursor-pointer transition-all ${sel ? 'bg-frost-blue border-frost-blue text-white' : 'bg-frost-elevated border-frost-border text-frost-dim'}`

  return (
    <div dir={dir} className="p-4 max-w-lg mx-auto">
      <button onClick={() => nav(-1)} className="text-frost-blue text-sm font-bold flex items-center gap-1 mb-4"><ArrowRight size={16} /> رجوع</button>
      <h1 className="text-xl font-black text-frost-steel mb-6">عامل جديد</h1>
      <form onSubmit={submit} className="card space-y-4">
        <div><label className="label-f">الاسم *</label><input value={name} onChange={e => setName(e.target.value)} className="input-f" placeholder="مثال: حسن" /></div>
        <div><label className="label-f">الهاتف</label><input value={phone} onChange={e => setPhone(e.target.value)} className="input-f" placeholder="+961 XX XXX XXX" /></div>
        <div>
          <label className="label-f">الدور *</label>
          <div className="flex gap-3">
            <button type="button" onClick={() => setRole('loader')} className={chip(role === 'loader')}>🏗️ عامل تحميل</button>
            <button type="button" onClick={() => setRole('driver')} className={chip(role === 'driver')}>🚛 سائق</button>
          </div>
        </div>

        {role === 'loader' ? (
          <>
            <div>
              <label className="label-f">سعر التحميل ($/طن) *</label>
              <input type="number" step="0.5" value={rateLoading} onChange={e => setRateLoading(e.target.value)} className="input-f" placeholder="مثال: 2" />
            </div>
            <div>
              <label className="label-f">سعر التنزيل ($/طن) *</label>
              <input type="number" step="0.5" value={rateUnloading} onChange={e => setRateUnloading(e.target.value)} className="input-f" placeholder="مثال: 3" />
            </div>
          </>
        ) : (
          <div>
            <label className="label-f">سعر الرحلة ($) *</label>
            <input type="number" step="0.5" value={rateDriver} onChange={e => setRateDriver(e.target.value)} className="input-f" placeholder="مثال: 50" />
          </div>
        )}

        {error && <p className="text-red-400 text-sm font-semibold">{error}</p>}
        <button type="submit" disabled={saving} className="btn-blue">{saving ? 'جاري الحفظ...' : 'إضافة عامل'}</button>
      </form>
    </div>
  )
}
