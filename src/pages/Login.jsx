import { useState } from "react"
import { supabase } from "../lib/supabase.js"

export default function Login() {
  const [mode, setMode] = useState("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [username, setUsername] = useState("")
  const [displayName, setDisplayName] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    setError(""); setSuccess(""); setLoading(true)
    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError("Usuario o contraseña incorrectos")
    } else {
      if (!username.trim()) { setError("El nombre de usuario es requerido"); setLoading(false); return }
      if (password.length < 6) { setError("La contraseña debe tener al menos 6 caracteres"); setLoading(false); return }
      const { error } = await supabase.auth.signUp({
        email, password,
        options: { data: { username: username.toLowerCase().trim(), display_name: displayName || username } }
      })
      if (error) setError(error.message)
      else setSuccess("Cuenta creada! Ya podés ingresar.")
    }
    setLoading(false)
  }

  const s = {
    screen: { padding:"32px 16px 48px", display:"flex", flexDirection:"column", alignItems:"center", minHeight:"100dvh" },
    card: { background:"#fff", border:"1px solid #e5e5e5", borderRadius:16, padding:"20px 16px", width:"100%", maxWidth:360 },
    tabs: { display:"flex", background:"#f5f5f5", borderRadius:10, padding:3, marginBottom:16, gap:3 },
    tabBtn: (active) => ({ flex:1, padding:8, fontSize:13, fontWeight:500, border:"none", background:active?"#fff":"transparent", color:active?"#111":"#666", borderRadius:8, cursor:"pointer", boxShadow:active?"0 1px 3px rgba(0,0,0,0.1)":undefined }),
    label: { fontSize:12, fontWeight:500, color:"#555", marginBottom:5, display:"block" },
    input: { width:"100%", padding:"11px 12px", fontSize:15, border:"1px solid #ddd", borderRadius:10, background:"#fafafa", color:"#111", marginBottom:12, minHeight:44, outline:"none", boxSizing:"border-box" },
    btn: { width:"100%", padding:12, fontSize:15, fontWeight:700, background:"#111", color:"#fff", border:"none", borderRadius:10, cursor:"pointer", minHeight:48, marginTop:4, opacity:loading?0.6:1 },
    error: { fontSize:13, color:"#b91c1c", background:"#fef2f2", borderRadius:8, padding:"10px 12px", marginBottom:12, textAlign:"center" },
    success: { fontSize:13, color:"#166534", background:"#f0fdf4", borderRadius:8, padding:"10px 12px", marginBottom:12, textAlign:"center" },
  }

  return (
    <div style={s.screen}>
      <div style={{ fontSize:52, marginBottom:8 }}>⚽</div>
      <div style={{ fontSize:20, fontWeight:700, marginBottom:4 }}>Quiniela Mundial 2026</div>
      <div style={{ fontSize:13, color:"#666", marginBottom:28 }}>El torneo más grande de la historia</div>
      <div style={s.card}>
        <div style={s.tabs}>
          <button style={s.tabBtn(mode==="login")} onClick={() => { setMode("login"); setError(""); setSuccess("") }}>Ingresar</button>
          <button style={s.tabBtn(mode==="register")} onClick={() => { setMode("register"); setError(""); setSuccess("") }}>Crear cuenta</button>
        </div>
        {error && <div style={s.error}>{error}</div>}
        {success && <div style={s.success}>{success}</div>}
        {mode === "register" && <>
          <label style={s.label}>Nombre para mostrar</label>
          <input style={s.input} placeholder="Ej: Ricardo V." value={displayName} onChange={e => setDisplayName(e.target.value)} />
          <label style={s.label}>Nombre de usuario</label>
          <input style={s.input} placeholder="Ej: ricardov" value={username} onChange={e => setUsername(e.target.value)} autoCapitalize="none" />
        </>}
        <label style={s.label}>Correo electrónico</label>
        <input style={s.input} type="email" placeholder="tu@email.com" value={email} onChange={e => setEmail(e.target.value)} />
        <label style={s.label}>Contraseña</label>
        <input style={s.input} type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key==="Enter" && handleSubmit()} />
        <button style={s.btn} onClick={handleSubmit} disabled={loading}>
          {loading ? "Cargando..." : mode==="login" ? "Ingresar →" : "Crear cuenta →"}
        </button>
      </div>
    </div>
  )
}
