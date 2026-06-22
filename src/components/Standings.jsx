import { useState } from "react"
import Avatar from "./Avatar.jsx"
import { calcPts } from "../lib/supabase.js"

export default function Standings({ profiles, matches, picks, currentProfile }) {
  const [expanded, setExpanded] = useState(null)

  const totals = profiles.map(p => {
    let total = p.bonus_points || 0
    let played = p.bonus_played || 0
    matches.forEach(m => {
      const pk = picks[p.id]?.[m.id]
      if (pk && m.score_a !== null) { total += calcPts(pk.pick_a, pk.pick_b, m.score_a, m.score_b); played++ }
      
    })
    return { ...p, total, played }
  }).sort((a, b) => b.total - a.total || (a.display_name||"").localeCompare(b.display_name||""))

  const finished = matches.filter(m => m.state === "finished")

  return (
    <div style={{ background:"#fff", border:"1px solid #e5e5e5", borderRadius:16, overflow:"hidden" }}>
      <div style={{ display:"grid", gridTemplateColumns:"28px 44px 1fr 36px 36px 22px", gap:5, padding:"8px 12px", fontSize:10, color:"#999", textTransform:"uppercase", letterSpacing:"0.06em", background:"#fafafa", borderBottom:"1px solid #e5e5e5" }}>
        <div>#</div><div></div><div>Jugador</div><div style={{textAlign:"center"}}>PJ</div><div style={{textAlign:"center"}}>Pts</div><div></div>
      </div>
      {totals.map((p, i) => {
        const isMe = currentProfile?.id === p.id
        const isExp = expanded === p.id
        const lbl = i===0?"??":i===1?"??":i===2?"??":`${i+1}`
        return (
          <div key={p.id}>
            <div onClick={() => setExpanded(isExp ? null : p.id)}
              style={{ display:"grid", gridTemplateColumns:"28px 44px 1fr 36px 36px 22px", gap:5, padding:"10px 12px", alignItems:"center", borderBottom:"1px solid #f0f0f0", cursor:"pointer", background:isMe||isExp?"#fafafa":"#fff" }}>
              <div style={{ textAlign:"center", fontSize:13 }}>{lbl}</div>
              <Avatar profile={p} size={34} />
              <div style={{ minWidth:0 }}>
                <div style={{ fontSize:13, fontWeight:700, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                  {p.display_name||p.username}{isMe&&<span style={{ fontSize:10, color:"#999", marginLeft:4 }}>(tú)</span>}
                </div>
                <div style={{ fontSize:10, color:"#aaa" }}>@{p.username}{p.bonus_points>0?` · +${p.bonus_points} migración`:""}</div>
              </div>
              <div style={{ textAlign:"center", fontSize:12, color:"#666" }}>{p.played}</div>
              <div style={{ textAlign:"center", fontSize:15, fontWeight:700 }}>{p.total}</div>
              <div style={{ textAlign:"center", fontSize:11, color:"#aaa" }}>{isExp?"?":"?"}</div>
            </div>
            {isExp && (
              <div style={{ padding:"8px 12px 12px", background:"#fafafa", borderBottom:"1px solid #f0f0f0" }}>
                <div style={{ fontSize:11, color:"#999", marginBottom:8 }}>Pronósticos</div>
                {p.bonus_points > 0 && (
                  <div style={{ background:"#fff", border:"1px solid #e5e5e5", borderRadius:8, padding:"7px 9px", marginBottom:6 }}>
                    <div style={{ fontSize:10, color:"#aaa", marginBottom:2 }}>? Puntos de migración</div>
                    <div style={{ fontSize:14, fontWeight:700 }}>{p.bonus_points} pts · {p.bonus_played} PJ</div>
                    <div style={{ fontSize:10, color:"#166534", marginTop:2 }}>Quiniela anterior</div>
                  </div>
                )}
                <div style={{ display:"grid", gridTemplateColumns:"repeat(2,minmax(0,1fr))", gap:5 }}>
                  {finished.map(m => {
                    const pk = picks[p.id]?.[m.id]
                    if (!pk) return null
                    const pp = calcPts(pk.pick_a, pk.pick_b, m.score_a, m.score_b)
                    const col = pp===6?"#166534":pp===4?"#1e40af":"#999"
                    return (
                      <div key={m.id} style={{ background:"#fff", border:"1px solid #e5e5e5", borderRadius:8, padding:"7px 9px" }}>
                        <div style={{ fontSize:10, color:"#aaa", marginBottom:2 }}>{m.flag_a} vs {m.flag_b}</div>
                        <div style={{ fontSize:14, fontWeight:700 }}>{pk.pick_a}–{pk.pick_b}</div>
                        <div style={{ fontSize:10, color:col, marginTop:2 }}>{pp!==null?`${pp} pts`:"-"}{pp===6?" ?":pp===4?" ?":""}</div>
                      </div>
                    )
                  })}
                  {matches.filter(m=>m.state!=="finished"&&picks[p.id]?.[m.id]).map(m => {
                    const pk = picks[p.id][m.id]
                    return (
                      <div key={m.id} style={{ background:"#fff", border:"1px solid #e5e5e5", borderRadius:8, padding:"7px 9px" }}>
                        <div style={{ fontSize:10, color:"#aaa", marginBottom:2 }}>{m.flag_a} vs {m.flag_b}</div>
                        <div style={{ fontSize:14, fontWeight:700 }}>{pk.pick_a}–{pk.pick_b}</div>
                        <div style={{ fontSize:10, color:"#aaa", marginTop:2 }}>Pendiente</div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
