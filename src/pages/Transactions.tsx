import { useLang } from '../lib/i18n'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { supabase } from '../lib/supabase'
import { Plus, Search, Trash2 } from 'lucide-react'

export default function Transactions() {
  const { tr, dir } = useLang()
  const [txns, setTxns] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'in' | 'out'>('all')

  const load = () => {
    supabase.from('fridge_transactions')
      .select('*, fridge_clients(name), fridge_rooms(name), fridge_transaction_workers(earnings, fridge_workers(name, role))')
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data }) => setTxns(data ?? []))
  }

  useEffect(() => { load() }, [])

  const deleteTx = async (tx: any) => {
    if (!confirm('هل تريد حذف هذه الحركة؟ سيتم تعديل المخزون والغرفة.')) return

    // Reverse the room tonnage
    const { data: room } = await supabase.from('fridge_rooms').select('*').eq('id', tx.room_id).single()
    if (room) {
      const cur = parseFloat(room.current_tonnes) || 0
      const t = parseFloat(tx.tonnes) || 0
      const newTonnes = tx.type === 'in' ? Math.max(0, cur - t) : cur + t
      await supabase.from('fridge_rooms').update({ current_tonnes: newTonnes }).eq('id', tx.room_id)
    }

    // Reverse inventory
    const { data: inv } = await supabase.from('fridge_inventory').select('*')
      .eq('client_id', tx.client_id).eq('room_id', tx.room_id).eq('product_type', tx.product_type).single()
    if (inv) {
      const t = parseFloat(tx.tonnes) || 0
      const newQty = tx.type === 'in' ? Math.max(0, parseFloat(inv.tonnes) - t) : parseFloat(inv.tonnes) + t
      if (newQty <= 0) await supabase.from('fridge_inventory').delete().eq('id', inv.id)
      else await supabase.from('fridge_inventory').update({ tonnes: newQty }).eq('id', inv.id)
    }

    // Delete workers + transaction
    await supabase.from('fridge_transaction_workers').delete().eq('transaction_id', tx.id)
    await supabase.from('fridge_transactions').delete().eq('id', tx.id)
    load()
  }

  const filtered = txns.filter(tx => {
    if (filter !== 'all' && tx.type !== filter) return false
    if (!search) return true
    const q = search.toLowerCase()
    return tx.fridge_clients?.name?.toLowerCase().includes(q) ||
      tx.product_type?.toLowerCase().includes(q) ||
      tx.fridge_rooms?.name?.toLowerCase().includes(q) ||
      tx.plate_number?.toLowerCase().includes(q)
  })

  return (
    <div dir={dir} className="p-5 max-w-lg mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-black text-frost-steel">{tr('transactions')}</h1>
        <Link to="/transactions/new" className="bg-frost-blue text-white rounded-2xl px-4 py-2.5 text-sm font-bold flex items-center gap-1"><Plus size={15} /> جديد</Link>
      </div>

      {/* Search */}
      <div className="relative mb-3">
        <Search size={16} className="absolute right-3 top-3 text-frost-dim" />
        <input value={search} onChange={e => setSearch(e.target.value)} className="input-f pr-10" placeholder="بحث بالزبون، المنتج، الغرفة..." />
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-4">
        {(['all', 'in', 'out'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all ${filter === f ? 'bg-frost-blue border-frost-blue text-white' : 'border-frost-border text-frost-dim'}`}>
            {f === 'all' ? 'الكل' : f === 'in' ? '▼ إدخال' : '▲ إخراج'}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-frost-dim text-center py-12">لا توجد حركات</p>
      ) : (
        <div className="space-y-2">
          {filtered.map(tx => (
            <div key={tx.id} className="card flex items-center gap-3 py-3">
              <Link to={`/transactions/${tx.id}`} className="flex items-center gap-3 flex-1 min-w-0">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm shrink-0 ${tx.type === 'in' ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'}`}>
                  {tx.type === 'in' ? '▼' : '▲'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-frost-steel text-sm font-bold truncate">{tx.fridge_clients?.name} · #{tx.ticket_no}</p>
                  <p className="text-frost-dim text-xs truncate">{tx.product_type} · {tx.fridge_rooms?.name} · {tx.plate_number || ''}</p>
                  {tx.fridge_transaction_workers?.length > 0 && (
                    <p className="text-frost-dim text-[10px] mt-0.5">
                      👷 {tx.fridge_transaction_workers.map((tw: any) => `${tw.fridge_workers?.name} ($${parseFloat(tw.earnings || 0).toFixed(0)})`).join(' · ')}
                    </p>
                  )}
                </div>
                <div className="text-left shrink-0">
                  <p className="text-frost-steel font-black">{parseFloat(tx.tonnes)}t</p>
                  <p className="text-frost-dim text-[10px]">{tx.date ? format(new Date(tx.date), 'dd/MM') : ''}</p>
                </div>
              </Link>
              <button onClick={() => deleteTx(tx)} className="text-frost-dim hover:text-red-400 p-1.5 shrink-0">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
