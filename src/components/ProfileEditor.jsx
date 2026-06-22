import { useState, useRef } from "react"
import { supabase } from "../lib/supabase.js"
import Avatar from "./Avatar.jsx"

export default function ProfileEditor({ profile, onUpdate, onClose }) {
  const [displayName, setDisplayName] = useState(profile.display_name||"")
  const [username, setUsername] = useState(profile.username||"")
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState("")
  const [error, setError] = useState("")
  const fileRef = useRef()

  async function uploadAvatar(file) {
    setUploading(true); setError("")
    const ext = file.name.split(".").pop()
    const path = `${profile.id}/avatar.${ext}`
    const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { upsert:true })
    if (upErr) { setError("Error subiendo foto"); setUploading(false); return }
    const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path)
    const url = publicUrl + "?t=" + Date.now()
    const { data, error: profErr } = await supabase.from("profiles").update({ avatar_url:url }).eq("id", profile.id).select().single()
    if (profErr) setError("Error guardando foto")
    else { onUpdate(data); setMsg("Foto actualizada ✓") }
    setUploading(false)
  }

  async function saveProfile() {
    setSaving(true); setError(""); setMsg("")
    if (!username.trim()) { setError("El usuario no puede estar vacío"); setSaving(false); return }
    const { data, error } = await supabase.from("profiles")
      .update({ display_name:displayName.trim(), username:username.toLowerCase().trim() })
      .eq("id", profile.id).select().single()
    if (error) setError(error.message.includes("unique") ? "Ese usuario ya está en uso" : "Error al guardar")
    else { onUpdate(data); setMsg("Perfil actualizado ✓") }
    setSaving(false)
  }

  return (
    <div style={{ padding:"0 14px 16px" }}>
      <div style={{ background:"#fff", border:"1px solid #e5e5e5", borderRadius:16, overflow:"hidden" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 16px", background:"#fafafa", borderBottom:"1px solid #e5e5e5" }}>
          <span style={{ fontSize:14, fontWeight:700 }}>Editar perfil</span>
          <button onClick={onClose} style={{ border:"none", background:"none", fontSize:22, cursor:"pointer", color:"#666" }}>×</button>
        </div>
        <div style={{ padding:"16px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:18 }}>
            <Avatar profile={profile} size={60} />
            <div>
              <div style={{ fontSize:13, fontWeight:600, marginBottom:6 }}>Foto de perfil</div>
              <button onClick={() => fileRef.current.click()} disabled={uploading}
                style={{ fontSize:13, padding:"7px 14px", border:"1px solid #ddd", borderRadius:8, cursor:"pointer", background:"#fff", minHeight:36 }}>
                {uploading ? "Subiendo..." : "Cambiar foto"}
              </button>
              <input ref={fileRef} type="file" accept="image/*" style={{ display:"none" }} onChange={e => e.target.files[0] && uploadAvatar(e.target.files[0])} />
            </div>
          </div>
          <label style={{ fontSize:12, fontWeight:600, color:"#555", marginBottom:5, display:"block" }}>Nombre para mostrar</label>
          <input value={displayName} onChange={e=>setDisplayName(e.target.value)} placeholder="Tu nombre"
            style={{ width:"100%", padding:"10px 12px", fontSize:15, border:"1px solid #ddd", borderRadius:10, background:"#fafafa", color:"#111", marginBottom:12, minHeight:44, outline:"none", boxSizing:"border-box" }} />
          <label style={{ fontSize:12, fontWeight:600, color:"#555", marginBottom:5, display:"block" }}>Nombre de usuario</label>
          <input value={username} onChange={e=>setUsername(e.target.value)} placeholder="usuario" autoCapitalize="none"
            style={{ width:"100%", padding:"10px 12px", fontSize:15, border:"1px solid #ddd", borderRadius:10, background:"#fafafa", color:"#111", marginBottom:14, minHeight:44, outline:"none", boxSizing:"border-box" }} />
          {error && <div style={{ fontSize:12, color:"#b91c1c", background:"#fef2f2", borderRadius:8, padding:"8px 12px", marginBottom:10 }}>{error}</div>}
          {msg && <div style={{ fontSize:12, color:"#166534", background:"#f0fdf4", borderRadius:8, padding:"8px 12px", marginBottom:10 }}>{msg}</div>}
          <button onClick={saveProfile} disabled={saving}
            style={{ width:"100%", padding:12, fontSize:14, fontWeight:700, background:"#111", color:"#fff", border:"none", borderRadius:10, cursor:"pointer", minHeight:46 }}>
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </div>
    </div>
  )
}
