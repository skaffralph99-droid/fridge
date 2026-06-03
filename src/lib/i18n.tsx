import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

type Lang = 'ar' | 'en'

const t = {
  // Nav
  home: { ar: 'الرئيسية', en: 'Home' },
  rooms: { ar: 'الغرف', en: 'Rooms' },
  inOut: { ar: 'إدخال/إخراج', en: 'In/Out' },
  clients: { ar: 'الزبائن', en: 'Clients' },
  invoices: { ar: 'الفواتير', en: 'Bills' },
  workers: { ar: 'الطاقم', en: 'Crew' },
  
  // Dashboard
  dashboard: { ar: 'لوحة التحكم', en: 'Dashboard' },
  totalStored: { ar: 'إجمالي المخزون', en: 'Total Stored' },
  totalClients: { ar: 'عدد الزبائن', en: 'Total Clients' },
  occupancy: { ar: 'نسبة الإشغال', en: 'Occupancy' },
  revenue: { ar: 'الإيرادات', en: 'Revenue' },
  recentActivity: { ar: 'آخر الحركات', en: 'Recent Activity' },
  quickActions: { ar: 'إجراءات سريعة', en: 'Quick Actions' },
  newTransaction: { ar: 'حركة جديدة', en: 'New Transaction' },
  newClient: { ar: 'زبون جديد', en: 'New Client' },
  newInvoice: { ar: 'فاتورة جديدة', en: 'New Invoice' },
  newWorker: { ar: 'عامل جديد', en: 'New Worker' },
  analytics: { ar: 'التحليلات', en: 'Analytics' },
  tonnes: { ar: 'طن', en: 't' },
  
  // Rooms
  roomCapacity: { ar: 'السعة', en: 'Capacity' },
  temperature: { ar: 'الحرارة', en: 'Temperature' },
  stored: { ar: 'مخزّن', en: 'Stored' },
  available: { ar: 'متاح', en: 'Available' },
  full: { ar: 'ممتلئ', en: 'Full' },
  
  // Transactions
  transactions: { ar: 'الحركات', en: 'Transactions' },
  productIn: { ar: 'إدخال', en: 'IN' },
  productOut: { ar: 'إخراج', en: 'OUT' },
  date: { ar: 'التاريخ', en: 'Date' },
  product: { ar: 'المنتج', en: 'Product' },
  client: { ar: 'الزبون', en: 'Client' },
  room: { ar: 'الغرفة', en: 'Room' },
  
  // Clients
  phone: { ar: 'الهاتف', en: 'Phone' },
  whatsapp: { ar: 'واتساب', en: 'WhatsApp' },
  type: { ar: 'النوع', en: 'Type' },
  rate: { ar: 'السعر', en: 'Rate' },
  name: { ar: 'الاسم', en: 'Name' },
  save: { ar: 'حفظ', en: 'Save' },
  saving: { ar: 'جاري الحفظ...', en: 'Saving...' },
  back: { ar: 'رجوع', en: 'Back' },
  delete: { ar: 'حذف', en: 'Delete' },
  edit: { ar: 'تعديل', en: 'Edit' },
  cancel: { ar: 'إلغاء', en: 'Cancel' },
  
  // Invoices
  invoice: { ar: 'فاتورة', en: 'Invoice' },
  paid: { ar: 'مدفوعة', en: 'Paid' },
  unpaid: { ar: 'غير مدفوعة', en: 'Unpaid' },
  markPaid: { ar: 'تحديد كمدفوعة', en: 'Mark as Paid' },
  total: { ar: 'المجموع', en: 'Total' },
  period: { ar: 'الفترة', en: 'Period' },
  
  // Workers
  loader: { ar: 'عامل تحميل', en: 'Loader' },
  driver: { ar: 'سائق', en: 'Driver' },
  earnings: { ar: 'الأرباح', en: 'Earnings' },
  jobs: { ar: 'الوظائف', en: 'Jobs' },
  perTonne: { ar: 'لكل طن', en: 'per tonne' },
  perTrip: { ar: 'لكل رحلة', en: 'per trip' },
  
  // Analytics
  revenueVsPotential: { ar: 'الإيرادات مقابل المحتمل', en: 'Revenue vs Potential' },
  roomOccupancy: { ar: 'إشغال الغرف', en: 'Room Occupancy' },
  storageByClient: { ar: 'التخزين حسب الزبون', en: 'Storage by Client' },
  financialSummary: { ar: 'الملخص المالي', en: 'Financial Summary' },
  collected: { ar: 'تم تحصيله', en: 'Collected' },
  pending: { ar: 'معلّق', en: 'Pending' },
  laborCosts: { ar: 'تكاليف العمالة', en: 'Labor Costs' },
  netProfit: { ar: 'صافي الربح', en: 'Net Profit' },
  
  // Login
  login: { ar: 'تسجيل الدخول', en: 'Login' },
  email: { ar: 'البريد الإلكتروني', en: 'Email' },
  password: { ar: 'كلمة المرور', en: 'Password' },
  signIn: { ar: 'دخول', en: 'Sign In' },
  signUp: { ar: 'حساب جديد', en: 'Sign Up' },
  
  // General
  noData: { ar: 'لا توجد بيانات', en: 'No data' },
  loading: { ar: 'جاري التحميل...', en: 'Loading...' },
  error: { ar: 'خطأ', en: 'Error' },
  search: { ar: 'بحث...', en: 'Search...' },
  language: { ar: 'English', en: 'عربي' },
}

type Translations = typeof t
type TKey = keyof Translations

interface LangCtx {
  lang: Lang
  setLang: (l: Lang) => void
  tr: (key: TKey) => string
  dir: 'rtl' | 'ltr'
}

const LangContext = createContext<LangCtx>({
  lang: 'ar', setLang: () => {}, tr: (k) => t[k].ar, dir: 'rtl'
})

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    try { return (localStorage.getItem('fridge_lang') as Lang) || 'ar' } catch { return 'ar' }
  })

  const setLang = (l: Lang) => {
    setLangState(l)
    try { localStorage.setItem('fridge_lang', l) } catch {}
  }

  const tr = (key: TKey) => t[key]?.[lang] ?? t[key]?.en ?? key
  const dir = lang === 'ar' ? 'rtl' as const : 'ltr' as const

  useEffect(() => {
    document.documentElement.dir = dir
    document.documentElement.lang = lang
  }, [lang, dir])

  return <LangContext.Provider value={{ lang, setLang, tr, dir }}>{children}</LangContext.Provider>
}

export const useLang = () => useContext(LangContext)
