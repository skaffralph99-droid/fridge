import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { supabase } from '../lib/supabase'
import { Plus, Search, HardHat, Truck } from 'lucide-react'

export default function Workers() {
  const [workers, setWorkers] = useState<any[]>([])
  const [earnings, setEarnings] = useState<Record<string, number>>({})
  const [search, setSearch] = useState('')

  useEffect(() => {
    supabase.from('fridge_workers').select('*').order('name').then(({ data }) => setWorkers(data ?? []))
    // Get total earnings per worker
    supabase.from('fridge_transaction_workers').select('worker_id, amount').then(({ data }) => {
      const map: Record<string, number> = {}
      data?.forEach(tw => {
        map[tw.worker_id] = (map[tw.worker_id] ?? 0) + parseFloat(tw.amount)
      })
      setEarnings(map)
    })
  }, [])

  const filtered = workers.filter(w => w.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="p-4 max-w-lg mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-black text-frost-steel tracking-wide">Workers</h1>
        <Link to="/workers/new" className="bg-frost-blue text-white rounded-lg px-4 py-2 text-sm font-bold flex items-center gap-1"><Plus size={16} /> New</Link>
      </div>
      <div className="relative mb-4">
        <Search className="absolute left-3 top-3 text-frost-dim" size={16} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search workers..." className="input-f pl-9" />
      </div>

      {filtered.length === 0 ? (
        <p className="text-frost-dim text-center py-8">No workers yet. Add your loaders and drivers.</p>
      ) : filtered.map(w => (
        <Link key={w.id} to={`/workers/${w.id}`} className="card block mb-2 hover:border-frost-blue transition-colors">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${w.role === 'driver' ? 'bg-orange-500/15' : 'bg-blue-500/15'}`}>
              {w.role === 'driver' ? <Truck size={18} className="text-orange-400" /> : <HardHat size={18} className="text-blue-400" />}
            </div>
            <div className="flex-1">
              <p className="text-frost-steel font-bold text-sm">{w.name}</p>
              <p className="text-frost-dim text-xs capitalize">{w.role} · ${parseFloat(w.rate)}/{w.role === 'driver' ? 'trip' : 'tonne'}</p>
            </div>
            <div className="text-right">
              <p className="text-green-400 font-black text-sm">${(earnings[w.id] ?? 0).toFixed(0)}</p>
              <p className="text-frost-dim text-[10px] uppercase">earned</p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}
