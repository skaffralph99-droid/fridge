import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function Invoices() {
  const [invoices, setInvoices] = useState<any[]>([])
  useEffect(() => { supabase.from('fridge_invoices').select('*, fridge_clients(name)').order('created_at', { ascending: false }).then(({ data }) => setInvoices(data ?? [])) }, [])

  const markPaid = async (id: string) => {
    await supabase.from('fridge_invoices').update({ status: 'paid', paid_date: new Date().toISOString().split('T')[0] }).eq('id', id)
    setInvoices(prev => prev.map(i => i.id === id ? { ...i, status: 'paid' } : i))
  }

  const statusColor: Record<string, string> = { paid: 'text-green-400 border-green-700', pending: 'text-yellow-300 border-yellow-700', overdue: 'text-red-400 border-red-700' }

  return (
    <div className="p-4 max-w-lg mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-black text-frost-steel tracking-wide">Invoices</h1>
        <Link to="/invoices/new" className="bg-frost-blue text-white rounded-lg px-4 py-2 text-sm font-bold flex items-center gap-1"><Plus size={16} /> New</Link>
      </div>
      {invoices.length === 0 ? <p className="text-frost-dim text-center py-8">No invoices yet</p> : invoices.map(inv => (
        <div key={inv.id} className="card mb-3">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-frost-steel font-bold text-sm">{inv.fridge_clients?.name}</p>
              <p className="text-frost-dim text-xs">📅 {format(new Date(inv.period_start), 'MMM dd, yyyy')} – {format(new Date(inv.period_end), 'MMM dd, yyyy')}</p>
              <p className="text-frost-dim text-xs">{inv.total_tonnes}t × ${inv.rate}/t</p>
            </div>
            <div className="text-right">
              <p className="text-frost-steel font-black text-lg">${inv.amount.toFixed(0)}</p>
              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${statusColor[inv.status] ?? 'text-frost-dim border-frost-border'}`}>{inv.status}</span>
            </div>
          </div>
          {inv.status !== 'paid' && (
            <button onClick={() => markPaid(inv.id)} className="w-full mt-3 border border-green-600 text-green-400 rounded-lg py-2 font-bold text-sm hover:bg-green-500/10 transition-colors">✓ Mark as Paid</button>
          )}
        </div>
      ))}
    </div>
  )
}
