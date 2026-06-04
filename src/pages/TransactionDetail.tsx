import { useLang } from '../lib/i18n'
import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ArrowRight, Printer } from 'lucide-react'
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
        .select('*, fridge_clients(name), fridge_rooms(name)')
        .eq('id', id).single(),
      supabase.from('fridge_transaction_workers')
        .select('*, fridge_workers(name, role)')
        .eq('transaction_id', id),
    ]).then(([{ data: t }, { data: w }]) => {
      setTx(t)
      setWorkers(w ?? [])
      setLoading(false)
    })
  }, [id])

  const printReceipt = () => {
    if (!tx) return
    const lines = [
      '<div class="row"><span>النوع</span><span>' + (tx.type === 'in' ? 'إدخال ▼' : 'إخراج ▲') + '</span></div>',
      '<div class="row"><span>الزبون</span><span>' + (tx.fridge_clients?.name || '') + '</span></div>',
      tx.company ? '<div class="row"><span>الشركة</span><span>' + tx.company + '</span></div>' : '',
      '<div class="row"><span>الغرفة</span><span>' + (tx.fridge_rooms?.name || '') + '</span></div>',
      '<div class="row"><span>المنتج</span><span>' + tx.product_type + '</span></div>',
      '<div class="row"><span>التاريخ</span><span>' + (tx.date ? format(new Date(tx.date), 'dd/MM/yyyy') : '') + '</span></div>',
      tx.plate_number ? '<div class="row"><span>الشاحنة</span><span>' + tx.plate_number + '</span></div>' : '',
      tx.weight_first ? '<div class="row"><span>الوزنة ١</span><span>' + parseFloat(tx.weight_first).toLocaleString() + ' كغ</span></div>' : '',
      tx.weight_second ? '<div class="row"><span>الوزنة ٢</span><span>' + parseFloat(tx.weight_second).toLocaleString() + ' كغ</span></div>' : '',
      '<div class="big">' + parseFloat(tx.tonnes) + ' طن</div>',
    ].filter(Boolean).join('')

    const workerLines = workers.map(w =>
      '<div class="row"><span>' + (w.role === 'driver' ? '🚛 ' : '🏗️ ') + (w.fridge_workers?.name || '') + '</span><span>$' + parseFloat(w.earnings || 0).toFixed(0) + '</span></div>'
    ).join('')

    const totalLabor = workers.reduce((s, w) => s + parseFloat(w.earnings || 0), 0)

    const html = '<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="UTF-8"><title>إيصال</title>' +
      '<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Segoe UI,sans-serif;padding:30px;color:#1a1a2e;direction:rtl;max-width:400px;margin:0 auto}' +
      '.hdr{text-align:center;border-bottom:2px solid #000;padding-bottom:15px;margin-bottom:15px}.hdr h1{font-size:20px}.hdr p{color:#666;font-size:12px;margin-top:4px}' +
      '.row{display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #eee;font-size:14px}.row span:last-child{font-weight:700}' +
      '.big{font-size:28px;text-align:center;margin:15px 0;font-weight:900;border-top:2px solid #000;border-bottom:2px solid #000;padding:10px 0}' +
      '.section{margin-top:15px;padding-top:10px;border-top:1px solid #ccc}.section h3{font-size:12px;color:#666;margin-bottom:8px}' +
      '.total{text-align:center;font-size:16px;font-weight:700;margin-top:10px;color:#333}' +
      '.ft{text-align:center;margin-top:30px;color:#999;font-size:11px}' +
      '@media print{body{padding:10px}}</style></head><body>' +
      '<div class="hdr"><h1>❄️ إيصال تخزين</h1><p>بطاقة #' + tx.ticket_no + ' · ' + (tx.date ? format(new Date(tx.date), 'dd/MM/yyyy') : '') + '</p></div>' +
      lines +
      (workerLines ? '<div class="section"><h3>العمال</h3>' + workerLines + '<div class="total">إجمالي العمالة: $' + totalLabor.toFixed(0) + '</div></div>' : '') +
      '<div class="ft">❄️ إدارة التبريد</div>' +
      '<script>window.onload=function(){window.print()}<\/script></body></html>'

    const win = window.open('', '_blank')
    if (win) { win.document.write(html); win.document.close() }
  }

  if (loading) return <div className="flex items-center justify-center h-screen"><div className="w-10 h-10 border-4 border-frost-blue border-t-transparent rounded-full animate-spin" /></div>
  if (!tx) return <div className="p-4"><p className="text-frost-dim text-center mt-20">غير موجود</p></div>

  const isIn = tx.type === 'in'
  const totalLabor = workers.reduce((s, w) => s + parseFloat(w.earnings || 0), 0)

  return (
    <div className="p-4 max-w-lg mx-auto pb-24">
      <button onClick={() => nav(-1)} className="text-frost-blue text-sm font-bold flex items-center gap-1 mb-4"><ArrowRight size={16} /> رجوع</button>

      {/* Header with ticket # */}
      <div className="flex items-center gap-3 mb-6">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl ${isIn ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
          {isIn ? '▼' : '▲'}
        </div>
        <div>
          <h1 className="text-xl font-black text-frost-steel">{isIn ? 'إدخال بضاعة' : 'إخراج بضاعة'}</h1>
          <p className="text-frost-dim text-sm">بطاقة رقم #{tx.ticket_no}</p>
        </div>
      </div>

      {/* Main details */}
      <div className="card space-y-3 mb-4">
        <Row label="الزبون" value={tx.fridge_clients?.name} />
        {tx.company && <Row label="الشركة" value={tx.company} />}
        <Row label="الغرفة" value={tx.fridge_rooms?.name} />
        <Row label="المنتج" value={tx.product_type} />
        <Row label={isIn ? 'تاريخ التحميل' : 'تاريخ التنزيل'} value={tx.date ? format(new Date(tx.date), 'dd/MM/yyyy') : '—'} />
        {tx.notes && <Row label="ملاحظات" value={tx.notes} />}
      </div>

      {/* Weighbridge — single card showing weights → result */}
      <div className="card mb-4">
        <h2 className="text-frost-dim text-[10px] uppercase tracking-widest font-bold mb-3">⚖️ القبان</h2>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="bg-frost-elevated rounded-xl p-3 text-center">
            <p className="text-frost-dim text-[10px]">الشاحنة</p>
            <p className="text-frost-steel font-bold">{tx.plate_number || '—'}</p>
          </div>
          <div className="bg-frost-elevated rounded-xl p-3 text-center">
            <p className="text-frost-dim text-[10px]">المرجع</p>
            <p className="text-frost-steel font-bold">#{tx.ticket_ref || tx.ticket_no}</p>
          </div>
        </div>
        <div className="flex items-center justify-center gap-2 text-frost-dim text-sm mb-2">
          <span>{tx.weight_second ? parseFloat(tx.weight_second).toLocaleString() : '—'} كغ</span>
          <span>−</span>
          <span>{tx.weight_first ? parseFloat(tx.weight_first).toLocaleString() : '—'} كغ</span>
        </div>
        <div className="bg-frost-blue/10 border-2 border-frost-blue/30 rounded-2xl p-4 text-center">
          <p className="text-frost-blue font-black text-3xl">{parseFloat(tx.tonnes)} طن</p>
          <p className="text-frost-dim text-xs">{tx.weight_net ? `${parseFloat(tx.weight_net).toLocaleString()} كغ` : ''}</p>
        </div>
      </div>

      {/* Workers */}
      {workers.length > 0 && (
        <div className="card mb-4">
          <h2 className="text-frost-dim text-[10px] uppercase tracking-widest font-bold mb-3">👷 العمال</h2>
          {workers.map((w, i) => (
            <div key={i} className="flex justify-between items-center bg-frost-elevated rounded-xl p-3 mb-2">
              <div>
                <p className="text-frost-steel font-bold">{w.fridge_workers?.name}</p>
                <p className="text-frost-dim text-xs">{w.role === 'driver' ? '🚛 سائق' : '🏗️ عامل'}</p>
              </div>
              <p className="text-green-400 font-black text-lg">${parseFloat(w.earnings).toFixed(0)}</p>
            </div>
          ))}
          <div className="flex justify-between items-center pt-2 border-t border-frost-border mt-1">
            <span className="text-frost-dim">المجموع</span>
            <span className="text-frost-steel font-black text-lg">${totalLabor.toFixed(0)}</span>
          </div>
        </div>
      )}

      <p className="text-frost-dim text-xs text-center mt-4">
        {tx.created_at ? format(new Date(tx.created_at), 'dd/MM/yyyy HH:mm') : ''}
      </p>

      <button onClick={printReceipt} className="w-full mt-4 py-3.5 rounded-2xl font-bold bg-frost-blue text-white flex items-center justify-center gap-2 active:scale-[0.98] transition-transform">
        <Printer size={18} /> طباعة الإيصال
      </button>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-frost-dim text-sm">{label}</span>
      <span className="text-frost-steel font-bold">{value}</span>
    </div>
  )
}
