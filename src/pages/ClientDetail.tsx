import { useLang } from '../lib/i18n'
import { useEffect, useState } from 'react'
  const { tr, dir } = useLang()
import { useParams, Link } from 'react-router-dom'
import { format } from 'date-fns'
import { supabase } from '../lib/supabase'
import { ArrowLeft, Phone, MessageCircle } from 'lucide-react'

export default function ClientDetail() {
  const { id } = useParams()
  const [client, setClient] = useState<any>(null)
  const [inventory, setInventory] = useState<any[]>([])
  const [txns, setTxns] = useState<any[]>([])

  useEffect(() => {
    if (!id) return
    supabase.from('fridge_clients').select('*').eq('id', id).single().then(({ data }) => setClient(data))
    supabase.from('fridge_inventory').select('*, fridge_rooms(name)').eq('client_id', id).gt('tonnes', 0).then(({ data }) => setInventory(data ?? []))
    supabase.from('fridge_transactions').select('*, fridge_rooms(name)').eq('client_id', id).order('created_at', { ascending: false }).limit(10).then(({ data }) => setTxns(data ?? []))
  }, [id])

  if (!client) return <div className="flex items-center justify-center h-64"><div className="w-10 h-10 border-4 border-frost-blue border-t-transparent rounded-full animate-spin" /></div>

  const totalStored = inventory.reduce((s, i) => s + parseFloat(i.tonnes), 0)

  return (
    <div dir={dir} className="p-4 max-w-lg mx-auto">
      <Link to="/clients" className="text-frost-blue text-sm font-bold flex items-center gap-1 mb-4"><ArrowLeft size={16} /> Clients</Link>
      <div className="card mb-4">
        <h1 className="text-xl font-black text-frost-steel">{client.name}</h1>
        {client.company && <p className="text-frost-dim text-sm">{client.company}</p>}
        <div className="flex gap-6 mt-4">
          <div><p className="text-frost-dim text-[10px] uppercase">Stored</p><p className="text-frost-blue font-black text-xl">{totalStored}t</p></div>
          <div><p className="text-frost-dim text-[10px] uppercase">Rate</p><p className="text-green-400 font-bold text-xl">${client.rate_per_tonne}/t</p></div>
          <div><p className="text-frost-dim text-[10px] uppercase">Terms</p><p className="text-frost-steel font-bold">{client.payment_terms}</p></div>
        </div>
        <div className="flex gap-3 mt-4">
          {(client.whatsapp || client.phone) && <a href={`https://wa.me/${(client.whatsapp || client.phone)?.replace(/[^0-9]/g, '')}`} className="flex-1 bg-green-600 text-white text-center py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-2"><MessageCircle size={16} /> WhatsApp</a>}
          {client.phone && <a href={`tel:${client.phone}`} className="flex-1 border border-frost-blue text-frost-blue text-center py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-2"><Phone size={16} /> Call</a>}
        </div>
      </div>

      <h2 className="text-frost-steel text-xs font-black uppercase tracking-widest mb-3">Stored</h2>
      {inventory.length === 0 ? <p className="text-frost-dim text-sm">Nothing stored</p> : inventory.map(inv => (
        <div key={inv.id} className="card mb-2 flex justify-between"><div><p className="text-frost-steel text-sm font-semibold">{inv.product_type}</p><p className="text-frost-dim text-xs">{inv.fridge_rooms?.name} · since {format(new Date(inv.date_in), 'MMM dd')}</p></div><p className="text-frost-blue font-black">{inv.tonnes}t</p></div>
      ))}

      <h2 className="text-frost-steel text-xs font-black uppercase tracking-widest mb-3 mt-6">History</h2>
      {txns.map(tx => (
        <div key={tx.id} className="card mb-2 flex items-center gap-2">
          <span className={`text-[10px] font-black px-2 py-1 rounded ${tx.type === 'in' ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'}`}>{tx.type.toUpperCase()}</span>
          <div className="flex-1"><p className="text-frost-steel text-sm">{tx.product_type} · {tx.fridge_rooms?.name}</p><p className="text-frost-dim text-xs">{format(new Date(tx.date), 'MMM dd, yyyy')}</p></div>
          <p className={`font-bold ${tx.type === 'in' ? 'text-green-400' : 'text-red-400'}`}>{tx.type === 'in' ? '+' : '−'}{tx.tonnes}t</p>
        </div>
      ))}
    </div>
  )
}
