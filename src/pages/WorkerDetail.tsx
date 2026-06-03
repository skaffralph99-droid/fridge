import { useLang } from '../lib/i18n'
import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { format } from 'date-fns'
import { supabase } from '../lib/supabase'
import { ArrowLeft, Phone, HardHat, Truck } from 'lucide-react'

export default function WorkerDetail() {
  const { tr, dir } = useLang()
  const { id } = useParams()
  const [worker, setWorker] = useState<any>(null)
  const [jobs, setJobs] = useState<any[]>([])

  useEffect(() => {
    if (!id) return
    supabase.from('fridge_workers').select('*').eq('id', id).single().then(({ data }) => setWorker(data))
    supabase.from('fridge_transaction_workers').select(`
      *, fridge_transactions(date, type, product_type, tonnes, fridge_clients(name), fridge_rooms(name))
    `).eq('worker_id', id).order('created_at', { ascending: false }).then(({ data }) => setJobs(data ?? []))
  }, [id])

  if (!worker) return <div className="flex items-center justify-center h-64"><div className="w-10 h-10 border-4 border-frost-blue border-t-transparent rounded-full animate-spin" /></div>

  const totalEarned = jobs.reduce((s, j) => s + parseFloat(j.amount), 0)
  const jobCount = jobs.length

  return (
    <div dir={dir} className="p-4 max-w-lg mx-auto">
      <Link to="/workers" className="text-frost-blue text-sm font-bold flex items-center gap-1 mb-4"><ArrowLeft size={16} /> Workers</Link>

      <div className="card mb-4">
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${worker.role === 'driver' ? 'bg-orange-500/15' : 'bg-blue-500/15'}`}>
            {worker.role === 'driver' ? <Truck size={22} className="text-orange-400" /> : <HardHat size={22} className="text-blue-400" />}
          </div>
          <div>
            <h1 className="text-xl font-black text-frost-steel">{worker.name}</h1>
            <p className="text-frost-dim text-sm">{worker.role === 'driver' ? '🚛 سائق' : '🏗️ عامل تحميل'} · {worker.role === 'driver' ? `$${parseFloat(worker.rate)}/رحلة` : `تحميل $${parseFloat(worker.rate_loading ?? worker.rate)}/طن · تنزيل $${parseFloat(worker.rate_unloading ?? worker.rate)}/طن`}</p>
          </div>
        </div>
        <div className="flex gap-6">
          <div><p className="text-frost-dim text-[10px] uppercase">إجمالي الأرباح</p><p className="text-green-400 font-black text-xl">${totalEarned.toFixed(0)}</p></div>
          <div><p className="text-frost-dim text-[10px] uppercase">الوظائف</p><p className="text-frost-blue font-black text-xl">{jobCount}</p></div>
          <div><p className="text-frost-dim text-[10px] uppercase">{worker.role === 'driver' ? 'سعر الرحلة' : 'سعر التحميل / التنزيل'}</p><p className="text-frost-steel font-bold text-xl">{worker.role === 'driver' ? `$${parseFloat(worker.rate)}` : `$${parseFloat(worker.rate_loading ?? worker.rate)} / $${parseFloat(worker.rate_unloading ?? worker.rate)}`}</p></div>
        </div>
        {worker.phone && (
          <a href={`tel:${worker.phone}`} className="mt-4 block border border-frost-blue text-frost-blue text-center py-2 rounded-lg font-bold text-sm"><Phone size={14} className="inline mr-2" />اتصال</a>
        )}
      </div>

      <h2 className="text-frost-steel text-xs font-black uppercase tracking-widest mb-3">سجل العمل</h2>
      {jobs.length === 0 ? (
        <p className="text-frost-dim text-center py-4">لا توجد وظائف بعد</p>
      ) : jobs.map(j => {
        const tx = j.fridge_transactions
        return (
          <div key={j.id} className="card mb-2">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-frost-steel text-sm font-semibold">{tx?.fridge_clients?.name}</p>
                <p className="text-frost-dim text-xs">
                  {tx?.type === 'in' ? '▼ IN' : '▲ OUT'} · {tx?.product_type} · {parseFloat(tx?.tonnes)}t · {tx?.fridge_rooms?.name}
                </p>
                <p className="text-frost-dim text-[11px] mt-1">📅 {tx?.date ? format(new Date(tx.date), 'MMM dd, yyyy') : '—'}</p>
              </div>
              <p className="text-green-400 font-black">${parseFloat(j.amount).toFixed(0)}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
