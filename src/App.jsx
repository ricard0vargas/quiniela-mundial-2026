import { useState, useEffect } from "react"
import { supabase } from "./lib/supabase.js"
import Login from "./pages/Login.jsx"
import Main from "./pages/Main.jsx"

export default function App() {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) loadProfile(session.user.id)
      else setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s)
      if (s) loadProfile(s.user.id)
      else { setProfile(null); setLoading(false) }
    })
    return () => subscription.unsubscribe()
  }, [])

  async function loadProfile(uid) {
    const { data } = await supabase.from("profiles").select("*").eq("id", uid).single()
    setProfile(data)
    setLoading(false)
  }

  if (loading) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100dvh", fontSize:40 }}>⚽</div>
  )

  if (!session || !profile) return <Login />

  return <Main session={session} profile={profile} onProfileUpdate={setProfile} />
}
