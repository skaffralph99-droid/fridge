import { useLang } from '../lib/i18n'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { supabase } from '../lib/supabase'
import { Plus } from 'lucide-react'

export default function Invoices() {
  const { tr, dir } = useLang()
  const [invoices, setInvoices] = useState<any[]>([])
  useEffect(() => {
    supabase.from('fridge_invoices').select('*, fridge_clients(name)')
      .order('created_at', { ascending: false })
      .then(({ data }) => setInvoices(data ?? []))
  }, [])

  const total = invoices.reduce((s, i) => s + parseFloat(i.amount), 0)
  const paid = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + parseFloat(i.amount), 0)
  const pending = total - paid

  return (
    <div className="p-5 max-w-lg mx-auto">
      <div className="flex justify-between items-center mb-5">
        <h1 className="text-xl font-black text-frost-steel">الفواتير</h1>
        <Link to="/invoices/new" className="bg-frost-blue text-white rounded-2xl px-4 py-2.5 text-sm font-bold flex items-center gap-1 active:scale-95"><Plus size={15} /> جديد</Link>
      </div>

      {/* Summary */}
      {invoices.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="bg-frost-elevated rounded-2xl p-3 text-center">
            <p className="text-frost-dim text-[9px] uppercase font-bold">المجموع</p>
            <p className="text-frost-steel font-black text-lg">${total.toLocaleString()}</p>
          </div>
          <div className="bg-green-500/10 rounded-2xl p-3 text-center">
            <p className="text-green-400 text-[9px] uppercase font-bold">مدفوع</p>
            <p className="text-green-400 font-black text-lg">${paid.toLocaleString()}</p>
          </div>
          <div className="bg-yellow-500/10 rounded-2xl p-3 text-center">
            <p className="text-yellow-400 text-[9px] uppercase font-bold">معلّق</p>
            <p className="text-yellow-400 font-black text-lg">${pending.toLocaleString()}</p>
          </div>
        </div>
      )}

      {invoices.length === 0 ? (
        <p className="text-frost-dim text-center py-12">لا توجد فواتير بعد</p>
      ) : (
        <div className="space-y-3">
          {invoices.map(inv => (
            <Link to={`/invoices/${inv.id}`} key={inv.id} className="card flex items-center gap-4 hover:border-frost-blue transition-colors active:scale-[0.99]">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-lg shrink-0 ${inv.status === 'paid' ? 'bg-green-500/15 text-green-400' : 'bg-yellow-500/15 text-yellow-400'}`}>
                {inv.status === 'paid' ? '✓' : '$'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-frost-steel font-bold truncate">{inv.fridge_clients?.name}</p>
                <p className="text-frost-dim text-xs">{format(new Date(inv.period_start), 'dd/MM')} — {format(new Date(inv.period_end), 'dd/MM/yyyy')}</p>
                <p className="text-frost-dim text-[10px]">{parseFloat(inv.total_tonnes)}t × ${parseFloat(inv.rate)}/t</p>
              </div>
              <div className="text-left shrink-0">
                <p className="text-frost-steel font-black text-lg">${parseFloat(inv.amount).toLocaleString()}</p>
                <p className={`text-[10px] font-bold ${inv.status === 'paid' ? 'text-green-400' : 'text-yellow-400'}`}>
                  {inv.status === 'paid' ? 'مدفوعة' : 'معلّقة'}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
