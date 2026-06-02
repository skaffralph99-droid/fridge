import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

interface AuthCtx { user: User | null; loading: boolean; signIn: (e: string, p: string) => Promise<string | null>; signOut: () => Promise<void> }
const Ctx = createContext<AuthCtx | null>(null)
export const useAuth = () => { const c = useContext(Ctx); if (!c) throw new Error('no auth'); return c }

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setUser(data.session?.user ?? null); setLoading(false) })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => { setUser(s?.user ?? null); setLoading(false) })
    return () => subscription.unsubscribe()
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return error?.message ?? null
  }, [])
  const signOut = useCallback(async () => { await supabase.auth.signOut() }, [])

  return <Ctx.Provider value={{ user, loading, signIn, signOut }}>{children}</Ctx.Provider>
}
