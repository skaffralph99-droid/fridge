import { useLang } from '../lib/i18n'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Plus, Search, HardHat, Truck } from 'lucide-react'

export default function Workers() {
  const { tr, dir } = useLang()
  const [workers, setWorkers] = useState<any[]>([])
  const [earnings, setEarnings] = useState<Record<string, number>>({})
  const [search, setSearch] = useState('')

  useEffect(() => {
    supabase.from('fridge_workers').select('*').order('name').then(({ data }) => setWorkers(data ?? []))
    supabase.from('fridge_transaction_workers').select('worker_id, amount').then(({ data }) => {
      const map: Record<string, number> = {}
      data?.forEach(tw => { map[tw.worker_id] = (map[tw.worker_id] ?? 0) + parseFloat(tw.amount) })
      setEarnings(map)
    })
  }, [])

  const filtered = workers.filter(w => w.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="p-5 max-w-lg mx-auto">
      <div className="flex justify-between items-center mb-5">
        <h1 className="text-xl font-black text-frost-steel">{tr('workers')}</h1>
        <Link to="/workers/new" className="bg-frost-blue text-white rounded-xl px-4 py-2.5 text-sm font-semibold flex items-center gap-1"><Plus size={15} /> New</Link>
      </div>

      {workers.length > 3 && (
        <div className="relative mb-5">
          <Search className="absolute left-4 top-3.5 text-frost-dim" size={15} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." className="input-f pl-10" />
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="text-frost-dim text-center py-12">No workers yet. Add loaders and drivers.</p>
      ) : (
        <div className="space-y-2">
          {filtered.map(w => (
            <Link key={w.id} to={`/workers/${w.id}`} className="card flex items-center gap-3 py-3 hover:border-frost-blue transition-colors">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${w.role === 'driver' ? 'bg-orange-500/12' : 'bg-blue-500/12'}`}>
                {w.role === 'driver' ? <Truck size={18} className="text-orange-400" /> : <HardHat size={18} className="text-blue-400" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-frost-steel font-semibold truncate">{w.name}</p>
                <p className="text-frost-dim text-xs capitalize">{w.role} · ${parseFloat(w.rate)}/{w.role === 'driver' ? 'trip' : 'tonne'}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-green-400 font-bold text-sm">${(earnings[w.id] ?? 0).toFixed(0)}</p>
                <p className="text-frost-dim text-[10px]">earned</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
