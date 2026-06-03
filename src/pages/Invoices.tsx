import { useLang } from '../lib/i18n'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { supabase } from '../lib/supabase'
import { Plus } from 'lucide-react'

export default function Invoices() {
  const { tr, dir } = useLang()
  const [invoices, setInvoices] = useState<any[]>([])
  useEffect(() => { supabase.from('fridge_invoices').select('*, fridge_clients(name)').order('created_at', { ascending: false }).then(({ data }) => setInvoices(data ?? [])) }, [])

  const markPaid = async (id: string) => {
    await supabase.from('fridge_invoices').update({ status: 'paid', paid_date: new Date().toISOString().split('T')[0] }).eq('id', id)
    setInvoices(prev => prev.map(i => i.id === id ? { ...i, status: 'paid' } : i))
  }

  const sColor: Record<string, string> = { paid: 'text-green-400 border-green-800', pending: 'text-yellow-300 border-yellow-800', overdue: 'text-red-400 border-red-800' }

  return (
    <div className="p-5 max-w-lg mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-black text-frost-steel">{tr('invoices')}</h1>
        <Link to="/invoices/new" className="bg-frost-blue text-white rounded-xl px-4 py-2.5 text-sm font-semibold flex items-center gap-1"><Plus size={15} /> New</Link>
      </div>

      {invoices.length === 0 ? (
        <p className="text-frost-dim text-center py-12">لا توجد فواتير بعد</p>
      ) : (
        <div className="space-y-3">
          {invoices.map(inv => (
            <div key={inv.id} className="card">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="text-frost-steel font-semibold">{inv.fridge_clients?.name}</p>
                  <p className="text-frost-dim text-xs mt-1">{format(new Date(inv.period_start), 'MMM dd')} – {format(new Date(inv.period_end), 'MMM dd, yyyy')}</p>
                  <p className="text-frost-dim text-xs">{parseFloat(inv.total_tonnes)}t × ${parseFloat(inv.rate)}/t</p>
                </div>
                <div className="text-right">
                  <p className="text-frost-steel font-black text-lg">${parseFloat(inv.amount).toLocaleString()}</p>
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${sColor[inv.status] ?? 'text-frost-dim border-frost-border'}`}>{inv.status}</span>
                </div>
              </div>
              {inv.status !== 'paid' && (
                <button onClick={() => markPaid(inv.id)} className="w-full mt-2 border border-green-700 text-green-400 rounded-xl py-2.5 font-semibold text-sm hover:bg-green-500/10 transition-colors">
                  ✓ {tr('markPaid')}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
