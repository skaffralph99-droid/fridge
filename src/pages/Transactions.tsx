import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { supabase } from '../lib/supabase'
import { Plus } from 'lucide-react'

export default function Transactions() {
  const [txns, setTxns] = useState<any[]>([])
  useEffect(() => { supabase.from('fridge_transactions').select('*, fridge_clients(name), fridge_rooms(name)').order('created_at', { ascending: false }).limit(50).then(({ data }) => setTxns(data ?? [])) }, [])

  return (
    <div className="p-4 max-w-lg mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-black text-frost-steel tracking-wide">Transactions</h1>
        <Link to="/transactions/new" className="bg-frost-blue text-white rounded-lg px-4 py-2 text-sm font-bold flex items-center gap-1"><Plus size={16} /> New</Link>
      </div>
      {txns.length === 0 ? <p className="text-frost-dim text-center py-8">No transactions yet</p> : txns.map(tx => (
        <div key={tx.id} className="card mb-2 flex items-center gap-3">
          <div className={`w-12 h-10 rounded-lg flex items-center justify-center ${tx.type === 'in' ? 'bg-green-500/15' : 'bg-red-500/15'}`}>
            <span className={`text-xs font-black ${tx.type === 'in' ? 'text-green-400' : 'text-red-400'}`}>{tx.type === 'in' ? '▼ IN' : '▲ OUT'}</span>
          </div>
          <div className="flex-1">
            <p className="text-frost-steel font-semibold text-sm">{tx.fridge_clients?.name}</p>
            <p className="text-frost-dim text-xs">{tx.product_type} · {tx.fridge_rooms?.name}</p>
            <p className="text-frost-dim text-[11px] mt-1">📅 {format(new Date(tx.date), 'EEEE, MMM dd yyyy')}</p>
          </div>
          <p className={`font-black text-base ${tx.type === 'in' ? 'text-green-400' : 'text-red-400'}`}>{tx.type === 'in' ? '+' : '−'}{tx.tonnes}t</p>
        </div>
      ))}
    </div>
  )
}
