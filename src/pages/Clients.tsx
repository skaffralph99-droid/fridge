import { useLang } from '../lib/i18n'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Plus, Search } from 'lucide-react'

const ICON: Record<string, string> = { farmer: '🌾', factory: '🏭', distributor: '🚚', other: '📦' }

export default function Clients() {
  const { tr, dir } = useLang()
  const [clients, setClients] = useState<any[]>([])
  const [search, setSearch] = useState('')
  useEffect(() => { supabase.from('fridge_clients').select('*').order('name').then(({ data }) => setClients(data ?? [])) }, [])

  const filtered = clients.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.company?.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="p-5 max-w-lg mx-auto">
      <div className="flex justify-between items-center mb-5">
        <h1 className="text-xl font-black text-frost-steel">{tr('clients')}</h1>
        <Link to="/clients/new" className="bg-frost-blue text-white rounded-xl px-4 py-2.5 text-sm font-semibold flex items-center gap-1"><Plus size={15} /> New</Link>
      </div>

      <div className="relative mb-5">
        <Search className="absolute left-4 top-3.5 text-frost-dim" size={15} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder={tr('search')} className="input-f pl-10" />
      </div>

      {filtered.length === 0 ? (
        <p className="text-frost-dim text-center py-12">No clients yet</p>
      ) : (
        <div className="space-y-2">
          {filtered.map(c => (
            <Link key={c.id} to={`/clients/${c.id}`} className="card flex items-center gap-3 py-3 hover:border-frost-blue transition-colors">
              <span className="text-2xl shrink-0">{ICON[c.client_type] ?? '📦'}</span>
              <div className="flex-1 min-w-0">
                <p className="text-frost-steel font-semibold truncate">{c.name}</p>
                {c.company && <p className="text-frost-dim text-xs truncate">{c.company}</p>}
                <p className="text-frost-dim text-xs mt-0.5">${parseFloat(c.rate_per_tonne)}/t · {c.payment_terms}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
