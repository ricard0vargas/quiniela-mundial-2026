import { useState, useEffect } from "react"
import { supabase } from "../lib/supabase.js"

export default function Admin({ matches, onMatchUpdated, isAdmin }) {
  const [pwd, setPwd] = useState("")
  const [authed, setAuthed] = useState(isAdmin)
  const [err, setErr] = useState("")
  const [log, setLog] = useState([])
  const [saving, setSaving] = useState({})
  const [edits, setEdits] = useState({})
  const [profiles, setProfiles] = useState([])
  const [bonusEdits, setBonusEdits] = useState({})
  const [bonusSaving, setBonusSaving] = useState({})

  useEffect(() => { if (authed) loadProfiles() }, [authed])

  async function loadProfiles() {
    const { data } = await supabase.from("profiles").select("*").order("display_name")
    setProfiles(data || [])
  }

  async function saveBonus(p) {
    const pts = parseInt(bonusEdits[p.id]?.pts ?? p.bonus_points ?? 0)
    const played = parseInt(bonusEdits[p.id]?.played ?? p.bonus_played ?? 0)
    if (isNaN(pts) || isNaN(played)) return
    setBonusSaving(s => ({ ...s, [p.id]: true }))
    await supabase.from("profiles").update({ bonus_points: pts, bonus_played: played }).eq("id", p.id)
    addLog(`Migración de ${p.display_name||p.username}: ${pts} pts, ${played} PJ`)
    await loadProfiles()
    setBonusSaving(s => ({ ...s, [p.id]: false }))
  }

  function setEdit(id, side, val) { setEdits(e => ({ ...e, [id]: { ...e[id], [side]: val } })) }
  function getEdit(id, side, fb) { return edits[id]?.[side] ?? fb }

  async function saveScore(m) {
    const a = parseInt(getEdit(m.id,"a",m.score_a??""))
    const b = parseInt(getEdit(m.id,"b",m.score_b??""))
    if (isNaN(a)||isNaN(b)) return
    setSaving(s => ({ ...s, [m.id]: true }))
    const prev = m.score_a!==null?`${m.score_a}-${m.score_b}`:"—"
    const { error } = await supabase.from("matches").update({ score_a:a, score_b:b, state:"finished" }).eq("id", m.id)
    if (!error) {
      onMatchUpdated(m.id, a, b, "finished")
      const t = new Date().toLocaleTimeString("es-CR",{hour:"2-digit",minute:"2-digit"})
      setLog(l => [{ t, msg:`${m.team_a} vs ${m.team_b}: ${prev} → ${a}–${b}` }, ...l])
    }
    setSaving(s => ({ ...s, [m.id]: false }))
  }

  async function setMatchState(m, state) {
    await supabase.from("matches").update({ state }).eq("id", m.id)
    onMatchUpdated(m.id, m.score_a, m.score_b, state)
    const t = new Date().toLocaleTimeString("es-CR",{hour:"2-digit",minute:"2-digit"})
    setLog(l => [{ t, msg:`${m.team_a} vs ${m.team_b} → ${state}` }, ...l])
  }

  const inp = { width:42, textAlign:"center", fontSize:15, fontWeight:700, padding:"6px 2px", border:"1px solid #ddd", borderRadius:8, background:"#fafafa", color:"#111", minHeight:38 }
  const card = { background:"#fff", border:"1px solid #e5e5e5", borderRadius:16, overflow:"hidden", marginBottom:10 }
  const cardHead = { display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 14px", background:"#fafafa", borderBottom:"1px solid #e5e5e5" }

  if (!authed) return (
    <div style={{ background:"#fff", border:"1px solid #e5e5e5", borderRadius:16, padding:"28px 16px", textAlign:"center" }}>
      <div style={{ fontSize:36, marginBottom:10 }}>🔒</div>
      <div style={{ fontSize:15, fontWeight:700, marginBottom:4 }}>Panel de administrador</div>
      <div style={{ fontSize:13, color:"#999", marginBottom:20 }}>Solo el admin puede corregir marcadores</div>
      {err && <div style={{ fontSize:12, color:"#b91c1c", background:"#fef2f2", borderRadius:8, padding:8, marginBottom:10 }}>{err}</div>}
      <input type="password" value={pwd} onChange={e=>setPwd(e.target.value)} onKeyDown={e=>e.key==="Enter"&&(pwd==="quiniela2026"?setAuthed(true):setErr("Contraseña incorrecta"))}
        placeholder="Contraseña admin"
        style={{ width:"100%", padding:"11px 12px", fontSize:15, border:"1px solid #ddd", borderRadius:10, background:"#fafafa", color:"#111", marginBottom:10, minHeight:44, outline:"none", boxSizing:"border-box" }} />
      <button onClick={() => pwd==="quiniela2026"?setAuthed(true):setErr("Contraseña incorrecta")}
        style={{ width:"100%", padding:12, fontSize:14, fontWeight:700, background:"#111", color:"#fff", border:"none", borderRadius:10, cursor:"pointer", minHeight:46 }}>
        Ingresar
      </button>
    </div>
  )

  const upcoming = matches.filter(m => m.state !== "finished")
  const finished = matches.filter(m => m.state === "finished")

  return (
    <div>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
        <span style={{ fontSize:12, color:"#999" }}>🛡 Sesión admin activa</span>
        <button onClick={()=>setAuthed(false)} style={{ fontSize:12, padding:"5px 10px", border:"1px solid #ddd", borderRadius:8, cursor:"pointer", background:"#fff", color:"#b91c1c" }}>Salir</button>
      </div>

      <div style={card}>
        <div style={cardHead}>
          <span style={{ fontSize:13, fontWeight:700 }}>🎯 Puntos de migración</span>
          <span style={{ fontSize:10, color:"#999" }}>Puntos y PJ anteriores</span>
        </div>
        <div style={{ padding:"4px 14px 10px" }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 70px 70px 80px", gap:8, padding:"6px 0", borderBottom:"1px solid #f0f0f0" }}>
            <div style={{ fontSize:10, color:"#999", fontWeight:700 }}>JUGADOR</div>
            <div style={{ fontSize:10, color:"#999", fontWeight:700, textAlign:"center" }}>PTS</div>
            <div style={{ fontSize:10, color:"#999", fontWeight:700, textAlign:"center" }}>PJ</div>
            <div></div>
          </div>
          {profiles.length === 0 && <div style={{ fontSize:12, color:"#bbb", textAlign:"center", padding:"10px 0" }}>Sin jugadores registrados aún</div>}
          {profiles.map(p => (
            <div key={p.id} style={{ display:"grid", gridTemplateColumns:"1fr 70px 70px 80px", gap:8, padding:"8px 0", borderBottom:"1px solid #f5f5f5", alignItems:"center" }}>
              <div>
                <div style={{ fontSize:13, fontWeight:700 }}>{p.display_name||p.username}</div>
                <div style={{ fontSize:10, color:"#bbb" }}>@{p.username}</div>
              </div>
              <input type="number" min="0" max="9999"
                value={bonusEdits[p.id]?.pts ?? p.bonus_points ?? 0}
                onChange={e => setBonusEdits(b => ({ ...b, [p.id]: { ...b[p.id], pts: e.target.value } }))}
                style={{ width:"100%", textAlign:"center", fontSize:14, fontWeight:700, padding:"6px 4px", border:"1px solid #ddd", borderRadius:8, background:"#fafafa", color:"#111", minHeight:36 }} />
              <input type="number" min="0" max="999"
                value={bonusEdits[p.id]?.played ?? p.bonus_played ?? 0}
                onChange={e => setBonusEdits(b => ({ ...b, [p.id]: { ...b[p.id], played: e.target.value } }))}
                style={{ width:"100%", textAlign:"center", fontSize:14, fontWeight:700, padding:"6px 4px", border:"1px solid #ddd", borderRadius:8, background:"#fafafa", color:"#111", minHeight:36 }} />
              <button onClick={() => saveBonus(p)} disabled={bonusSaving[p.id]}
                style={{ padding:"7px 8px", fontSize:12, fontWeight:700, border:"1px solid #ddd", borderRadius:8, cursor:"pointer", background:"#fff", minHeight:36, width:"100%" }}>
                {bonusSaving[p.id] ? "..." : "Guardar"}
              </button>
            </div>
          ))}
        </div>
      </div>

      <div style={card}>
        <div style={cardHead}><span style={{ fontSize:13, fontWeight:700 }}>✏️ Corregir — próximos partidos</span><span style={{ fontSize:10, color:"#999" }}>Solo admin</span></div>
        <div style={{ padding:"4px 14px 10px" }}>
          {upcoming.slice(0,12).map(m => (
            <div key={m.id} style={{ padding:"8px 0", borderBottom:"1px solid #f5f5f5" }}>
              <div style={{ fontSize:12, fontWeight:700, marginBottom:2 }}>{m.flag_a} {m.team_a} vs {m.team_b} {m.flag_b}</div>
              <div style={{ fontSize:10, color:"#bbb", marginBottom:6 }}>{m.date_label} · {m.group_name}</div>
              <div style={{ display:"flex", alignItems:"center", gap:7, flexWrap:"wrap" }}>
                <input type="number" min="0" max="20" value={getEdit(m.id,"a",m.score_a??"")} placeholder="—" onChange={e=>setEdit(m.id,"a",e.target.value)} style={inp} />
                <span style={{ color:"#ccc" }}>–</span>
                <input type="number" min="0" max="20" value={getEdit(m.id,"b",m.score_b??"")} placeholder="—" onChange={e=>setEdit(m.id,"b",e.target.value)} style={inp} />
                <button onClick={()=>saveScore(m)} disabled={saving[m.id]}
                  style={{ flex:1, padding:"7px 8px", fontSize:12, fontWeight:700, border:"1px solid #ddd", borderRadius:8, cursor:"pointer", background:"#fff", minHeight:38, minWidth:80 }}>
                  {saving[m.id]?"...":"Corregir"}
                </button>
                <select value={m.state} onChange={e=>setMatchState(m,e.target.value)}
                  style={{ fontSize:11, padding:"6px", border:"1px solid #ddd", borderRadius:8, background:"#fff", minHeight:38 }}>
                  <option value="upcoming">Por iniciar</option>
                  <option value="live">En vivo</option>
                  <option value="finished">Finalizado</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={card}>
        <div style={cardHead}><span style={{ fontSize:13, fontWeight:700 }}>✏️ Corregir — historial</span></div>
        <div style={{ padding:"4px 14px 10px" }}>
          {finished.slice().reverse().map(m => (
            <div key={m.id} style={{ padding:"8px 0", borderBottom:"1px solid #f5f5f5" }}>
              <div style={{ fontSize:12, fontWeight:700, marginBottom:2 }}>{m.flag_a} {m.team_a} vs {m.team_b} {m.flag_b}</div>
              <div style={{ fontSize:10, color:"#bbb", marginBottom:6 }}>{m.date_label}</div>
              <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                <input type="number" min="0" max="20" value={getEdit(m.id,"a",m.score_a??"")} onChange={e=>setEdit(m.id,"a",e.target.value)} style={inp} />
                <span style={{ color:"#ccc" }}>–</span>
                <input type="number" min="0" max="20" value={getEdit(m.id,"b",m.score_b??"")} onChange={e=>setEdit(m.id,"b",e.target.value)} style={inp} />
                <button onClick={()=>saveScore(m)} disabled={saving[m.id]}
                  style={{ flex:1, padding:"7px 8px", fontSize:12, fontWeight:700, border:"1px solid #ddd", borderRadius:8, cursor:"pointer", background:"#fff", minHeight:38 }}>
                  {saving[m.id]?"...":"Corregir"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={card}>
        <div style={cardHead}><span style={{ fontSize:13, fontWeight:700 }}>📋 Log de cambios</span><span style={{ fontSize:10, color:"#999" }}>{log.length} cambio{log.length!==1?"s":""}</span></div>
        <div style={{ padding:"8px 14px" }}>
          {log.length===0 ? <div style={{ fontSize:12, color:"#bbb", textAlign:"center", padding:"10px 0" }}>Sin cambios en esta sesión</div>
          : log.map((l,i) => (
            <div key={i} style={{ display:"flex", gap:8, fontSize:11, padding:"5px 0", borderBottom:"1px solid #f5f5f5" }}>
              <span style={{ color:"#bbb", flexShrink:0 }}>{l.t}</span>
              <span style={{ color:"#555" }}>{l.msg}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
