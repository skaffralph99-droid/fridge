import { useLang } from '../lib/i18n'
import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ArrowRight, Truck, Scale, User, Warehouse, Package, Calendar } from 'lucide-react'
import { format } from 'date-fns'

export default function TransactionDetail() {
  const { tr, dir } = useLang()
  const { id } = useParams()
  const nav = useNavigate()
  const [tx, setTx] = useState<any>(null)
  const [workers, setWorkers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    Promise.all([
      supabase.from('fridge_transactions')
        .select('*, fridge_clients(name, phone), fridge_rooms(name)')
        .eq('id', id).single(),
      supabase.from('fridge_transaction_workers')
        .select('*, fridge_workers(name, role, rate_loading, rate_unloading, rate)')
        .eq('transaction_id', id),
    ]).then(([{ data: t }, { data: w }]) => {
      setTx(t)
      setWorkers(w ?? [])
      setLoading(false)
    })
  }, [id])

  if (loading) return <div className="flex items-center justify-center h-screen"><div className="w-10 h-10 border-4 border-frost-blue border-t-transparent rounded-full animate-spin" /></div>
  if (!tx) return <div dir={dir} className="p-4"><p className="text-frost-dim text-center mt-20">غير موجود</p></div>

  const isIn = tx.type === 'in'

  return (
    <div dir={dir} className="p-4 max-w-lg mx-auto">
      <button onClick={() => nav(-1)} className="text-frost-blue text-sm font-bold flex items-center gap-1 mb-4"><ArrowRight size={16} /> رجوع</button>

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl ${isIn ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
          {isIn ? '▼' : '▲'}
        </div>
        <div>
          <h1 className="text-xl font-black text-frost-steel">{isIn ? 'إدخال بضاعة' : 'إخراج بضاعة'}</h1>
          <p className="text-frost-dim text-sm">بطاقة رقم #{tx.ticket_no}</p>
        </div>
      </div>

      {/* Main Info */}
      <div className="card space-y-4 mb-4">
        <div className="flex items-center gap-3">
          <User size={16} className="text-frost-dim" />
          <div>
            <p className="text-frost-dim text-[10px] uppercase">الزبون</p>
            <p className="text-frost-steel font-bold">{tx.fridge_clients?.name}</p>
          </div>
        </div>
        {tx.company && (
          <div className="flex items-center gap-3">
            <Package size={16} className="text-frost-dim" />
            <div>
              <p className="text-frost-dim text-[10px] uppercase">الشركة — اشترى من</p>
              <p className="text-frost-steel font-bold">{tx.company}</p>
            </div>
          </div>
        )}
        <div className="flex items-center gap-3">
          <Warehouse size={16} className="text-frost-dim" />
          <div>
            <p className="text-frost-dim text-[10px] uppercase">الغرفة</p>
            <p className="text-frost-steel font-bold">{tx.fridge_rooms?.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Package size={16} className="text-frost-dim" />
          <div>
            <p className="text-frost-dim text-[10px] uppercase">المنتج</p>
            <p className="text-frost-steel font-bold">{tx.product_type}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Scale size={16} className="text-frost-dim" />
          <div>
            <p className="text-frost-dim text-[10px] uppercase">الكمية</p>
            <p className="text-frost-steel font-bold text-xl">{parseFloat(tx.tonnes)} طن</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Calendar size={16} className="text-frost-dim" />
          <div>
            <p className="text-frost-dim text-[10px] uppercase">{isIn ? 'تاريخ التحميل' : 'تاريخ التنزيل'}</p>
            <p className="text-frost-steel font-bold">{tx.date ? format(new Date(tx.date), 'dd/MM/yyyy') : '—'}</p>
          </div>
        </div>
        {tx.notes && (
          <div>
            <p className="text-frost-dim text-[10px] uppercase">ملاحظات</p>
            <p className="text-frost-steel text-sm">{tx.notes}</p>
          </div>
        )}
      </div>

      {/* Weighbridge Ticket */}
      <div className="card space-y-3 mb-4">
        <h2 className="text-frost-steel text-sm font-black uppercase tracking-widest">⚖️ بطاقة القبان</h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-frost-elevated rounded-xl p-3">
            <p className="text-frost-dim text-[10px] uppercase">المرجع</p>
            <p className="text-frost-steel font-bold">{tx.ticket_ref || tx.ticket_no}</p>
          </div>
          <div className="bg-frost-elevated rounded-xl p-3">
            <p className="text-frost-dim text-[10px] uppercase">رقم الشاحنة</p>
            <p className="text-frost-steel font-bold">{tx.plate_number || '—'}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-frost-elevated rounded-xl p-3">
            <p className="text-frost-dim text-[10px] uppercase">الوزنة الأولى</p>
            <p className="text-frost-steel font-bold">{tx.weight_first ? `${parseFloat(tx.weight_first).toLocaleString()} كغ` : '—'}</p>
          </div>
          <div className="bg-frost-elevated rounded-xl p-3">
            <p className="text-frost-dim text-[10px] uppercase">الوزنة الثانية</p>
            <p className="text-frost-steel font-bold">{tx.weight_second ? `${parseFloat(tx.weight_second).toLocaleString()} كغ` : '—'}</p>
          </div>
        </div>
        {tx.weight_net > 0 && (
          <div className="bg-frost-blue/10 border border-frost-blue/30 rounded-xl p-3 flex justify-between items-center">
            <span className="text-frost-dim text-sm">الوزن الصافي</span>
            <span className="text-frost-blue font-black text-lg">{parseFloat(tx.weight_net).toLocaleString()} كغ</span>
          </div>
        )}
      </div>

      {/* Workers */}
      {workers.length > 0 && (
        <div className="card space-y-3 mb-4">
          <h2 className="text-frost-steel text-sm font-black uppercase tracking-widest">👷 العمال</h2>
          {workers.map((w, i) => (
            <div key={i} className="flex justify-between items-center bg-frost-elevated rounded-xl p-3">
              <div>
                <p className="text-frost-steel font-bold">{w.fridge_workers?.name}</p>
                <p className="text-frost-dim text-xs">{w.role === 'driver' ? '🚛 سائق' : '🏗️ عامل تحميل'}</p>
              </div>
              <p className="text-green-400 font-black">${parseFloat(w.earnings).toFixed(0)}</p>
            </div>
          ))}
          <div className="flex justify-between items-center pt-2 border-t border-frost-border">
            <span className="text-frost-dim text-sm">إجمالي العمالة</span>
            <span className="text-frost-steel font-black">${workers.reduce((s, w) => s + parseFloat(w.earnings), 0).toFixed(0)}</span>
          </div>
        </div>
      )}

      {/* Timestamp */}
      <p className="text-frost-dim text-xs text-center mt-4">
        تم التسجيل: {tx.created_at ? format(new Date(tx.created_at), 'dd/MM/yyyy HH:mm') : '—'}
      </p>
    </div>
  )
}
