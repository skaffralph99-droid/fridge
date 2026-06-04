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
      *, fridge_transactions(id, date, type, product_type, tonnes, ticket_no, plate_number, fridge_clients(name), fridge_rooms(name))
    `).eq('worker_id', id).order('created_at', { ascending: false }).then(({ data }) => setJobs(data ?? []))
  }, [id])

  if (!worker) return <div className="flex items-center justify-center h-64"><div className="w-10 h-10 border-4 border-frost-blue border-t-transparent rounded-full animate-spin" /></div>

  const totalEarned = jobs.reduce((s, j) => s + parseFloat(j.earnings), 0)

  return (
    <div className="p-5 max-w-lg mx-auto pb-24">
      <Link to="/workers" className="text-frost-blue text-sm font-bold flex items-center gap-1 mb-4"><ArrowLeft size={16} /> العمال</Link>

      {/* Worker info */}
      <div className="card mb-5">
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${worker.role === 'driver' ? 'bg-orange-500/15' : 'bg-frost-blue/15'}`}>
            {worker.role === 'driver' ? <Truck size={22} className="text-orange-400" /> : <HardHat size={22} className="text-frost-blue" />}
          </div>
          <div>
            <h1 className="text-xl font-black text-frost-steel">{worker.name}</h1>
            <p className="text-frost-dim text-sm">{worker.role === 'driver' ? '🚛 سائق' : '🏗️ عامل تحميل'}</p>
          </div>
        </div>

        {/* Stats - stacked, not cramped */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-frost-dim text-sm">إجمالي الأرباح</span>
            <span className="text-green-400 font-black text-lg">${totalEarned.toFixed(0)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-frost-dim text-sm">عدد الوظائف</span>
            <span className="text-frost-steel font-black text-lg">{jobs.length}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-frost-dim text-sm">{worker.role === 'driver' ? 'سعر الرحلة' : 'سعر التحميل'}</span>
            <span className="text-frost-steel font-bold">${parseFloat(worker.role === 'driver' ? worker.rate : (worker.rate_loading ?? worker.rate))}/{ worker.role === 'driver' ? 'رحلة' : 'طن'}</span>
          </div>
          {worker.role === 'loader' && (
            <div className="flex justify-between items-center">
              <span className="text-frost-dim text-sm">سعر التنزيل</span>
              <span className="text-frost-steel font-bold">${parseFloat(worker.rate_unloading ?? worker.rate)}/طن</span>
            </div>
          )}
        </div>

        {worker.phone && (
          <a href={`tel:${worker.phone}`} className="mt-4 block border border-frost-blue text-frost-blue text-center py-2.5 rounded-xl font-bold text-sm">📞 اتصال</a>
        )}
      </div>

      {/* Job history */}
      <p className="section-title">سجل العمل</p>
      {jobs.length === 0 ? (
        <p className="text-frost-dim text-center py-6">لا توجد وظائف بعد</p>
      ) : (
        <div className="space-y-2">
          {jobs.map(j => {
            const tx = j.fridge_transactions
            return (
              <Link to={`/transactions/${j.transaction_id}`} key={j.id} className="card flex items-center gap-3 hover:border-frost-blue transition-colors">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm shrink-0 ${tx?.type === 'in' ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'}`}>
                  {tx?.type === 'in' ? '▼' : '▲'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-frost-steel text-sm font-bold truncate">{tx?.fridge_clients?.name}</p>
                  <p className="text-frost-dim text-xs truncate">{tx?.product_type} · {tx?.fridge_rooms?.name} · {parseFloat(tx?.tonnes)}t</p>
                  <p className="text-frost-dim text-[10px]">#{tx?.ticket_no} · {tx?.date ? format(new Date(tx.date), 'dd/MM/yyyy') : '—'}</p>
                </div>
                <p className="text-green-400 font-black text-lg shrink-0">${parseFloat(j.earnings).toFixed(0)}</p>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
