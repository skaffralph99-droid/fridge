import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Plus, Search } from 'lucide-react'

const TYPE_ICON: Record<string, string> = { farmer: '🌾', factory: '🏭', distributor: '🚚', other: '📦' }

export default function Clients() {
  const [clients, setClients] = useState<any[]>([])
  const [search, setSearch] = useState('')
  useEffect(() => { supabase.from('fridge_clients').select('*').order('name').then(({ data }) => setClients(data ?? [])) }, [])

  const filtered = clients.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.company?.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="p-4 max-w-lg mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-black text-frost-steel tracking-wide">Clients</h1>
        <Link to="/clients/new" className="bg-frost-blue text-white rounded-lg px-4 py-2 text-sm font-bold flex items-center gap-1"><Plus size={16} /> New</Link>
      </div>
      <div className="relative mb-4">
        <Search className="absolute left-3 top-3 text-frost-dim" size={16} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." className="input-f pl-9" />
      </div>
      {filtered.map(c => (
        <Link key={c.id} to={`/clients/${c.id}`} className="card block mb-2 hover:border-frost-blue transition-colors">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{TYPE_ICON[c.client_type] ?? '📦'}</span>
            <div className="flex-1">
              <p className="text-frost-steel font-bold text-sm">{c.name}</p>
              {c.company && <p className="text-frost-dim text-xs">{c.company}</p>}
              <p className="text-frost-dim text-[11px] mt-1">${c.rate_per_tonne}/t · {c.payment_terms}</p>
            </div>
            <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-full border ${c.is_active ? 'text-green-400 border-green-700' : 'text-frost-dim border-frost-border'}`}>{c.is_active ? 'Active' : 'Inactive'}</span>
          </div>
        </Link>
      ))}
    </div>
  )
}
