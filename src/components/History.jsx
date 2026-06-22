import { useState } from "react"
import Avatar from "./Avatar.jsx"
import { calcPts } from "../lib/supabase.js"

export default function History({ days, profiles, picks, currentProfile }) {
  const [open, setOpen] = useState({ 0: true })

  if (days.length === 0) return (
    <div style={{ textAlign:"center", padding:"2rem", color:"#bbb", fontSize:13 }}>Aún no hay partidos finalizados</div>
  )

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
      {days.map((day, di) => {
        const isOpen = open[di] ?? false
        const totalGoals = day.matches.reduce((s,m) => s+(m.score_a??0)+(m.score_b??0), 0)
        const perfects = day.matches.reduce((s,m) => s+profiles.filter(p => {
          const pk = picks[p.id]?.[m.id]
          return pk && calcPts(pk.pick_a, pk.pick_b, m.score_a, m.score_b) === 6
        }).length, 0)

        return (
          <div key={di} style={{ background:"#fff", border:"1px solid #e5e5e5", borderRadius:16, overflow:"hidden" }}>
            <div onClick={() => setOpen(o => ({ ...o, [di]: !isOpen }))}
              style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 14px", background:"#fafafa", borderBottom:isOpen?"1px solid #e5e5e5":"none", cursor:"pointer", minHeight:52 }}>
              <div>
                <div style={{ fontSize:13, fontWeight:700 }}>{day.date}</div>
                <div style={{ fontSize:11, color:"#999" }}>{day.matches.length} partido{day.matches.length!==1?"s":""} · {totalGoals} goles</div>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                {perfects>0 && <span style={{ fontSize:10, background:"#dcfce7", color:"#166534", padding:"2px 8px", borderRadius:20 }}>{perfects} exactos ⭐</span>}
                <span style={{ fontSize:13, color:"#bbb", display:"inline-block", transform:isOpen?"rotate(180deg)":"none", transition:"transform .2s" }}>▼</span>
              </div>
            </div>
            {isOpen && (
              <>
                {day.matches.map(m => {
                  const allPts = profiles.map(p => { const pk=picks[p.id]?.[m.id]; return pk?calcPts(pk.pick_a,pk.pick_b,m.score_a,m.score_b):0 })
                  const maxP = Math.max(...allPts)
                  const sorted = profiles.map((p,i) => ({ p, pts:allPts[i] })).sort((a,b) => b.pts-a.pts)
                  return (
                    <div key={m.id} style={{ borderBottom:"1px solid #f5f5f5", padding:"10px 14px" }}>
                      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
                        <div style={{ fontSize:13, fontWeight:700 }}>{m.flag_a} {m.team_a} <strong>{m.score_a}–{m.score_b}</strong> {m.team_b} {m.flag_b}</div>
                        <span style={{ fontSize:10, background:"#dcfce7", color:"#166534", padding:"2px 7px", borderRadius:20 }}>Finalizado</span>
                      </div>
                      <div style={{ fontSize:10, color:"#bbb", marginBottom:8 }}>{m.group_name}</div>
                      <div style={{ display:"grid", gridTemplateColumns:"repeat(2,minmax(0,1fr))", gap:5 }}>
                        {sorted.map(({ p, pts }) => {
                          const pk = picks[p.id]?.[m.id]
                          if (!pk) return null
                          const isMe = currentProfile?.id === p.id
                          const crown = pts===maxP && pts>0
                          const ptBg = pts===6?"#f0fdf4":pts===4?"#eff6ff":"#f5f5f5"
                          const ptCol = pts===6?"#166534":pts===4?"#1e40af":"#999"
                          return (
                            <div key={p.id} style={{ display:"flex", alignItems:"center", gap:7, background:"#fafafa", borderRadius:10, padding:"6px 8px", border:isMe?"1px solid #ddd":"1px solid transparent" }}>
                              <Avatar profile={p} size={26} />
                              <div style={{ flex:1, minWidth:0 }}>
                                <div style={{ fontSize:11, fontWeight:700, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{p.display_name||p.username}</div>
                                <div style={{ fontSize:10, color:"#999" }}>{pk.pick_a}–{pk.pick_b}</div>
                              </div>
                              <span style={{ fontSize:11, fontWeight:700, padding:"2px 6px", borderRadius:12, background:ptBg, color:ptCol, flexShrink:0 }}>{pts}p{crown?" 👑":""}</span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
                {(() => {
                  const tops = profiles.map(p => { let t=0; day.matches.forEach(m => { const pk=picks[p.id]?.[m.id]; if(pk) t+=calcPts(pk.pick_a,pk.pick_b,m.score_a,m.score_b) }); return { name:p.display_name||p.username, t } }).sort((a,b)=>b.t-a.t)
                  return (
                    <div style={{ display:"flex", gap:5, flexWrap:"wrap", padding:"8px 14px", borderTop:"1px solid #f0f0f0", background:"#fafafa" }}>
                      <span style={{ fontSize:10, fontWeight:700, color:"#666", background:"#fff", border:"1px solid #e5e5e5", borderRadius:20, padding:"2px 8px" }}>Mejor del día:</span>
                      {tops.slice(0,3).map((d,i) => <span key={i} style={{ fontSize:10, color:"#666", background:"#fff", border:"1px solid #e5e5e5", borderRadius:20, padding:"2px 8px" }}>{i===0?"🥇":i===1?"🥈":"🥉"} {d.name} · {d.t}p</span>)}
                    </div>
                  )
                })()}
              </>
            )}
          </div>
        )
      })}
    </div>
  )
}
