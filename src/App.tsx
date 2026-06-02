import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Rooms from './pages/Rooms'
import RoomDetail from './pages/RoomDetail'
import Transactions from './pages/Transactions'
import NewTransaction from './pages/NewTransaction'
import Clients from './pages/Clients'
import NewClient from './pages/NewClient'
import ClientDetail from './pages/ClientDetail'
import Invoices from './pages/Invoices'
import Analytics from './pages/Analytics'
import Workers from './pages/Workers'
import NewWorker from './pages/NewWorker'
import WorkerDetail from './pages/WorkerDetail'
import NewInvoice from './pages/NewInvoice'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="min-h-screen bg-frost-bg flex items-center justify-center"><div className="w-10 h-10 border-4 border-frost-blue border-t-transparent rounded-full animate-spin" /></div>
  return user ? <>{children}</> : <Navigate to="/login" />
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/rooms" element={<Rooms />} />
            <Route path="/rooms/:id" element={<RoomDetail />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/transactions/new" element={<NewTransaction />} />
            <Route path="/clients" element={<Clients />} />
            <Route path="/clients/new" element={<NewClient />} />
            <Route path="/clients/:id" element={<ClientDetail />} />
            <Route path="/invoices" element={<Invoices />} />
            <Route path="/invoices/new" element={<NewInvoice />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/workers" element={<Workers />} />
            <Route path="/workers/new" element={<NewWorker />} />
            <Route path="/workers/:id" element={<WorkerDetail />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
