import { useLang } from '../lib/i18n'
import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ArrowRight, Download, Check } from 'lucide-react'
import { format } from 'date-fns'

export default function InvoiceDetail() {
  const { tr, dir } = useLang()
  const { id } = useParams()
  const nav = useNavigate()
  const [inv, setInv] = useState<any>(null)
  const [txns, setTxns] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    supabase.from('fridge_invoices').select('*, fridge_clients(name, phone, company)').eq('id', id).single()
      .then(({ data }) => { setInv(data); setLoading(false) })
  }, [id])

  useEffect(() => {
    if (!inv) return
    supabase.from('fridge_transactions').select('*, fridge_rooms(name)')
      .eq('client_id', inv.client_id)
      .gte('date', inv.period_start).lte('date', inv.period_end)
      .order('date', { ascending: true })
      .then(({ data }) => setTxns(data ?? []))
  }, [inv])

  const markPaid = async () => {
    await supabase.from('fridge_invoices').update({ status: 'paid', paid_date: new Date().toISOString().split('T')[0] }).eq('id', id)
    setInv((p: any) => ({ ...p, status: 'paid', paid_date: new Date().toISOString().split('T')[0] }))
  }

  const printInvoice = () => {
    if (!inv) return
    const rows = txns.map(tx =>
      `<tr><td>${format(new Date(tx.date), 'dd/MM/yyyy')}</td><td style="color:${tx.type === 'in' ? '#28a745' : '#dc3545'};font-weight:700">${tx.type === 'in' ? 'إدخال' : 'إخراج'}</td><td>${tx.product_type}</td><td>${tx.fridge_rooms?.name ?? ''}</td><td style="font-weight:700">${parseFloat(tx.tonnes)} طن</td></tr>`
    ).join('')

    const html = `<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="UTF-8"><title>فاتورة</title>
    <style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',Tahoma,sans-serif;padding:40px;color:#1a1a2e;direction:rtl}
    .hdr{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:30px;padding-bottom:15px;border-bottom:3px solid #1a1a2e}
    .hdr h1{font-size:28px;font-weight:900}.hdr small{color:#888;font-size:13px}
    .badge{display:inline-block;padding:4px 14px;border-radius:20px;font-size:11px;font-weight:700}
    .paid{background:#d4edda;color:#155724}.pending{background:#fff3cd;color:#856404}
    .grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:25px}
    .grid h4{font-size:10px;text-transform:uppercase;color:#999;letter-spacing:1px;margin-bottom:4px}.grid p{font-size:15px;font-weight:600}
    table{width:100%;border-collapse:collapse;margin:15px 0}
    th{background:#1a1a2e;color:#fff;padding:10px 14px;text-align:right;font-size:11px;text-transform:uppercase;letter-spacing:1px}
    td{padding:8px 14px;border-bottom:1px solid #eee;font-size:13px}tr:nth-child(even) td{background:#f8f9fa}
    .tot{background:#1a1a2e;color:#fff;padding:16px;display:flex;justify-content:space-between;align-items:center;border-radius:8px;margin-top:20px}
    .tot span:last-child{font-size:26px;font-weight:900}
    .ft{margin-top:40px;padding-top:15px;border-top:2px solid #eee;color:#aaa;font-size:11px;text-align:center}
    @media print{body{padding:20px}}</style></head><body>
    <div class="hdr"><div><h1>❄️ فاتورة</h1><small>#${inv.id.slice(0,8)}</small></div>
    <span class="badge ${inv.status === 'paid' ? 'paid' : 'pending'}">${inv.status === 'paid' ? '✓ مدفوعة' : 'معلّقة'}</span></div>
    <div class="grid"><div><h4>الزبون</h4><p>${inv.fridge_clients?.name ?? ''}</p></div>
    <div><h4>الفترة</h4><p>${format(new Date(inv.period_start), 'dd/MM/yyyy')} — ${format(new Date(inv.period_end), 'dd/MM/yyyy')}</p></div></div>
    <table><thead><tr><th>التاريخ</th><th>النوع</th><th>المنتج</th><th>الغرفة</th><th>الكمية</th></tr></thead>
    <tbody>${rows || '<tr><td colspan="5" style="text-align:center;color:#999;padding:20px">لا توجد حركات</td></tr>'}</tbody></table>
    <div class="tot"><span>${parseFloat(inv.total_tonnes)} طن × $${parseFloat(inv.rate)}/طن</span><span>$${parseFloat(inv.amount).toLocaleString()}</span></div>
    ${inv.notes ? `<p style="margin-top:20px;color:#666;font-size:13px">ملاحظات: ${inv.notes}</p>` : ''}
    <div class="ft">❄️ إدارة التبريد — ${format(new Date(), 'dd/MM/yyyy')}</div>
    <script>window.onload=()=>window.print()</script></body></html>`

    const win = window.open('', '_blank')
    if (win) { win.document.write(html); win.document.close() }
  }

  if (loading) return <div className="flex items-center justify-center h-screen"><div className="w-10 h-10 border-4 border-frost-blue border-t-transparent rounded-full animate-spin" /></div>
  if (!inv) return <div className="p-4 text-center text-frost-dim mt-20">غير موجود</div>

  const isPaid = inv.status === 'paid'

  return (
    <div className="p-4 max-w-lg mx-auto pb-32">
      <button onClick={() => nav(-1)} className="text-frost-blue text-sm font-bold flex items-center gap-1 mb-4"><ArrowRight size={16} /> رجوع</button>

      {/* Invoice card */}
      <div className="rounded-3xl border-2 border-frost-border overflow-hidden mb-4">
        {/* Header */}
        <div className={`px-5 py-4 flex justify-between items-start ${isPaid ? 'bg-green-500/10' : 'bg-yellow-500/10'}`}>
          <div>
            <h1 className="text-2xl font-black text-frost-steel">فاتورة</h1>
            <p className="text-frost-dim text-xs mt-1">#{inv.id.slice(0,8)}</p>
          </div>
          <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${isPaid ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
            {isPaid ? '✓ مدفوعة' : 'معلّقة'}
          </span>
        </div>

        <div className="p-5">
          {/* Client + Period */}
          <div className="grid grid-cols-2 gap-4 mb-5">
            <div>
              <p className="text-frost-dim text-[10px] uppercase tracking-wider font-bold">الزبون</p>
              <p className="text-frost-steel font-bold text-lg">{inv.fridge_clients?.name}</p>
            </div>
            <div>
              <p className="text-frost-dim text-[10px] uppercase tracking-wider font-bold">الفترة</p>
              <p className="text-frost-steel font-bold">{format(new Date(inv.period_start), 'dd/MM')} — {format(new Date(inv.period_end), 'dd/MM/yyyy')}</p>
            </div>
          </div>

          {/* Transactions table */}
          <div className="overflow-x-auto -mx-5">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-frost-elevated">
                  <th className="text-frost-dim text-[10px] uppercase text-right py-2.5 px-4 font-bold">التاريخ</th>
                  <th className="text-frost-dim text-[10px] uppercase text-right py-2.5 px-4 font-bold">النوع</th>
                  <th className="text-frost-dim text-[10px] uppercase text-right py-2.5 px-4 font-bold">المنتج</th>
                  <th className="text-frost-dim text-[10px] uppercase text-right py-2.5 px-4 font-bold">الغرفة</th>
                  <th className="text-frost-dim text-[10px] uppercase text-right py-2.5 px-4 font-bold">الكمية</th>
                </tr>
              </thead>
              <tbody>
                {txns.map(tx => (
                  <tr key={tx.id} className="border-b border-frost-border/30">
                    <td className="py-2.5 px-4 text-frost-steel text-xs">{format(new Date(tx.date), 'dd/MM')}</td>
                    <td className={`py-2.5 px-4 font-bold text-xs ${tx.type === 'in' ? 'text-green-400' : 'text-red-400'}`}>{tx.type === 'in' ? '▼' : '▲'}</td>
                    <td className="py-2.5 px-4 text-frost-steel text-xs">{tx.product_type}</td>
                    <td className="py-2.5 px-4 text-frost-dim text-xs">{tx.fridge_rooms?.name}</td>
                    <td className="py-2.5 px-4 text-frost-steel font-bold text-xs">{parseFloat(tx.tonnes)}t</td>
                  </tr>
                ))}
                {txns.length === 0 && (
                  <tr><td colSpan={5} className="py-6 text-center text-frost-dim text-xs">لا توجد حركات في هذه الفترة</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Total */}
          <div className="bg-frost-elevated rounded-2xl p-4 mt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-frost-dim">الكمية</span>
              <span className="text-frost-steel font-bold">{parseFloat(inv.total_tonnes)} طن</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-frost-dim">السعر</span>
              <span className="text-frost-steel font-bold">${parseFloat(inv.rate)}/طن</span>
            </div>
            <div className="flex justify-between border-t border-frost-border pt-3 mt-2">
              <span className="text-frost-steel font-bold text-lg">المجموع</span>
              <span className="text-frost-blue font-black text-3xl">${parseFloat(inv.amount).toLocaleString()}</span>
            </div>
          </div>

          {inv.notes && (
            <p className="text-frost-dim text-sm mt-3">📝 {inv.notes}</p>
          )}

          {isPaid && inv.paid_date && (
            <p className="text-green-400 text-sm mt-3 font-bold">✓ تم الدفع بتاريخ {format(new Date(inv.paid_date), 'dd/MM/yyyy')}</p>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="fixed bottom-20 left-0 right-0 px-4 max-w-lg mx-auto">
        <div className="flex gap-3">
          {!isPaid && (
            <button onClick={markPaid} className="flex-1 py-3.5 rounded-2xl font-bold bg-green-500 text-black flex items-center justify-center gap-2 active:scale-[0.98] shadow-lg shadow-green-500/20">
              <Check size={18} strokeWidth={3} /> تحديد كمدفوعة
            </button>
          )}
          <button onClick={printInvoice} className="flex-1 py-3.5 rounded-2xl font-bold bg-frost-blue text-white flex items-center justify-center gap-2 active:scale-[0.98] shadow-lg shadow-frost-blue/20">
            <Download size={18} /> تحميل PDF
          </button>
        </div>
      </div>
    </div>
  )
}
