import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from './supabase'

const AuthCtx = createContext(null)
export const useAuth = () => useContext(AuthCtx)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  async function loadProfile(userId) {
    const { data } = await supabase
      .from('profiles')
      .select('id, nome, email, papel')
      .eq('id', userId)
      .single()
    setProfile(data || null)
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session)
      if (data.session) await loadProfile(data.session.user.id)
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange(async (_e, sess) => {
      setSession(sess)
      if (sess) await loadProfile(sess.user.id)
      else setProfile(null)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  const value = {
    session,
    profile,
    loading,
    papel: profile?.papel,
    isStaff: profile?.papel === 'admin' || profile?.papel === 'gestor', // acesso financeiro/calc
    isAdmin: profile?.papel === 'admin',
    isExec: profile?.papel === 'execucao', // conta de campo (só etapas/fotos)
    signOut: () => supabase.auth.signOut(),
  }
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>
}
