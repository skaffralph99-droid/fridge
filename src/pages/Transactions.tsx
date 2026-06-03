import { useLang } from '../lib/i18n'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { supabase } from '../lib/supabase'
import { Plus } from 'lucide-react'

export default function Transactions() {
  const { tr, dir } = useLang()
  const [txns, setTxns] = useState<any[]>([])
  useEffect(() => {
    supabase.from('fridge_transactions')
      .select('*, fridge_clients(name), fridge_rooms(name), fridge_transaction_workers(amount, fridge_workers(name))')
      .order('created_at', { ascending: false }).limit(50)
      .then(({ data }) => setTxns(data ?? []))
  }, [])

  return (
    <div className="p-5 max-w-lg mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-black text-frost-steel">{tr('transactions')}</h1>
        <Link to="/transactions/new" className="bg-frost-blue text-white rounded-xl px-4 py-2.5 text-sm font-semibold flex items-center gap-1"><Plus size={15} /> New</Link>
      </div>

      {txns.length === 0 ? (
        <p className="text-frost-dim text-center py-12">No transactions yet</p>
      ) : (
        <div className="space-y-2">
          {txns.map(tx => (
            <div key={tx.id} className="card flex items-center gap-3 py-3">
              <span className={`text-[10px] font-bold px-2.5 py-1.5 rounded-lg shrink-0 ${tx.type === 'in' ? 'bg-green-500/12 text-green-400' : 'bg-red-500/12 text-red-400'}`}>
                {tx.type === 'in' ? '▼ IN' : '▲ OUT'}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-frost-steel text-sm font-medium truncate">{tx.fridge_clients?.name}</p>
                <p className="text-frost-dim text-xs truncate">{tx.product_type} · {tx.fridge_rooms?.name}</p>
                <p className="text-frost-dim text-[11px] mt-1">{format(new Date(tx.date), 'MMM dd, yyyy')}</p>
                {tx.fridge_transaction_workers?.length > 0 && (
                  <p className="text-frost-dim text-[11px]">
                    👷 {tx.fridge_transaction_workers.map((tw: any) => tw.fridge_workers?.name).join(', ')}
                  </p>
                )}
              </div>
              <p className={`font-bold shrink-0 ${tx.type === 'in' ? 'text-green-400' : 'text-red-400'}`}>
                {tx.type === 'in' ? '+' : '−'}{parseFloat(tx.tonnes)}t
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
