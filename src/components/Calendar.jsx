import { useState } from "react"
import { supabase, calcPts } from "../lib/supabase.js"

export default function Calendar({ days, myPicks, onPicksSaved, userId }) {
  const [inputs, setInputs] = useState({})
  const [open, setOpen] = useState({ 0: true })
  const [saving, setSaving] = useState({})
  const [saved, setSaved] = useState({})

  function getInput(matchId, side) { return inputs[matchId]?.[side] ?? "" }
  function setInput(matchId, side, val) { setInputs(prev => ({ ...prev, [matchId]: { ...prev[matchId], [side]: val } })) }

  async function saveDayPicks(dayIdx, day) {
    const openMatches = day.matches.filter(m => m.state === "upcoming" && m.score_a === null)
    if (!openMatches.length) return
    setSaving(s => ({ ...s, [dayIdx]: true }))
    const upserts = []
    for (const m of openMatches) {
      const existing = myPicks[m.id]
      const rawA = inputs[m.id]?.a ?? (existing ? String(existing.pick_a) : "")
      const rawB = inputs[m.id]?.b ?? (existing ? String(existing.pick_b) : "")
      const a = parseInt(rawA), b = parseInt(rawB)
      if (!isNaN(a) && !isNaN(b)) upserts.push({ user_id: userId, match_id: m.id, pick_a: a, pick_b: b })
    }
    if (upserts.length) {
      const { error } = await supabase.from("picks").upsert(upserts, { onConflict: "user_id,match_id" })
      if (!error) {
        onPicksSaved(upserts)
        setSaved(s => ({ ...s, [dayIdx]: true }))
        setTimeout(() => setSaved(s => ({ ...s, [dayIdx]: false })), 3000)
      }
    }
    setSaving(s => ({ ...s, [dayIdx]: false }))
  }

  const ptBg = pp => pp===6?"#f0fdf4":pp===4?"#eff6ff":"#f5f5f5"
  const ptCol = pp => pp===6?"#166534":pp===4?"#1e40af":"#999"

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
      {days.map((day, di) => {
        const isOpen = open[di] ?? false
        const isToday = day.iso === "2026-06-22"
        const openMatches = day.matches.filter(m => m.state === "upcoming" && m.score_a === null)
        const savedCount = openMatches.filter(m => {
          const pk = myPicks[m.id]
          const inA = inputs[m.id]?.a, inB = inputs[m.id]?.b
          return pk || (inA !== "" && inA !== undefined && inB !== "" && inB !== undefined)
        }).length
        const allLocked = openMatches.length === 0

        return (
          <div key={di} style={{ background:"#fff", border:"1px solid #e5e5e5", borderRadius:16, overflow:"hidden" }}>
            <div onClick={() => setOpen(o => ({ ...o, [di]: !isOpen }))}
              style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 14px", background:"#fafafa", borderBottom:isOpen?"1px solid #e5e5e5":"none", cursor:"pointer", minHeight:52 }}>
              <div>
                <div style={{ fontSize:13, fontWeight:700 }}>{day.date}</div>
                <div style={{ fontSize:11, color:"#999" }}>{day.stage} · {day.matches.length} partido{day.matches.length!==1?"s":""}</div>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                {isToday && <span style={{ fontSize:10, background:"#dbeafe", color:"#1e40af", padding:"2px 8px", borderRadius:20, fontWeight:700 }}>HOY</span>}
                {!allLocked && savedCount===openMatches.length && openMatches.length>0 && <span style={{ fontSize:10, background:"#dcfce7", color:"#166534", padding:"2px 8px", borderRadius:20 }}>✓ Guardado</span>}
                {!allLocked && savedCount>0 && savedCount<openMatches.length && <span style={{ fontSize:10, background:"#fef9c3", color:"#854d0e", padding:"2px 8px", borderRadius:20 }}>{savedCount}/{openMatches.length}</span>}
                {allLocked && <span style={{ fontSize:10, background:"#f3f4f6", color:"#999", padding:"2px 8px", borderRadius:20 }}>Cerrado</span>}
                <span style={{ fontSize:13, color:"#bbb", display:"inline-block", transform:isOpen?"rotate(180deg)":"none", transition:"transform .2s" }}>▼</span>
              </div>
            </div>
            {isOpen && (
              <>
                {day.matches.map((m) => {
                  const myPick = myPicks[m.id]
                  const isLocked = m.state !== "upcoming" || m.score_a !== null
                  const pp = myPick && m.score_a !== null ? calcPts(myPick.pick_a, myPick.pick_b, m.score_a, m.score_b) : null
                  const curA = isLocked ? null : (getInput(m.id,"a") !== "" ? getInput(m.id,"a") : myPick ? String(myPick.pick_a) : "")
                  const curB = isLocked ? null : (getInput(m.id,"b") !== "" ? getInput(m.id,"b") : myPick ? String(myPick.pick_b) : "")
                  return (
                    <div key={m.id} style={{ padding:"12px 14px", borderBottom:"1px solid #f5f5f5" }}>

                      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
                        <div style={{ fontSize:13, fontWeight:700 }}>{m.flag_a} {m.team_a}</div>
                        <div style={{ textAlign:"center" }}>
                          <div style={{ fontSize:11, color:"#999" }}>{m.match_time}</div>
                          <div style={{ fontSize:10, color:"#bbb" }}>{m.group_name}</div>
                        </div>
                        <div style={{ fontSize:13, fontWeight:700 }}>{m.team_b} {m.flag_b}</div>
                      </div>

                      {isLocked && !myPick && (
                        <div style={{ fontSize:12, color:"#b91c1c", background:"#fef2f2", borderRadius:8, padding:"7px 10px", textAlign:"center" }}>
                          Sin pronostico — partido cerrado
                        </div>
                      )}

                      {isLocked && myPick && (
                        <div style={{ textAlign:"center" }}>
                          <div style={{ fontSize:24, fontWeight:700, marginBottom:6 }}>
                            {myPick.pick_a} - {myPick.pick_b}
                          </div>
                          <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
                            {pp !== null && (
                              <span style={{ fontSize:12, fontWeight:700, padding:"3px 12px", borderRadius:20, background:ptBg(pp), color:ptCol(pp) }}>
                                {pp} pts{pp===6?" ⭐":pp===4?" ✓":""}
                              </span>
                            )}
                            {pp === null && <span style={{ fontSize:11, color:"#bbb" }}>Pendiente</span>}
                            <span style={{ fontSize:11, color:"#bbb" }}>🔒</span>
                          </div>
                        </div>
                      )}

                      {!isLocked && (
                        <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:12 }}>
                          <input type="number" min="0" max="20" inputMode="numeric" pattern="[0-9]*" value={curA} placeholder="0"
                            onChange={e => setInput(m.id,"a",e.target.value)}
                            style={{ width:60, textAlign:"center", fontSize:24, fontWeight:700, padding:"8px 2px", border:"1px solid #ddd", borderRadius:10, background:"#fafafa", color:"#111", minHeight:50 }} />
                          <span style={{ fontSize:20, color:"#ccc" }}>-</span>
                          <input type="number" min="0" max="20" inputMode="numeric" pattern="[0-9]*" value={curB} placeholder="0"
                            onChange={e => setInput(m.id,"b",e.target.value)}
                            style={{ width:60, textAlign:"center", fontSize:24, fontWeight:700, padding:"8px 2px", border:"1px solid #ddd", borderRadius:10, background:"#fafafa", color:"#111", minHeight:50 }} />
                          {myPick && <span style={{ fontSize:14, color:"#22c55e" }}>✓</span>}
                        </div>
                      )}

                    </div>
                  )
                })}

                {openMatches.length > 0 ? (
                  <div style={{ padding:12, borderTop:"1px solid #f0f0f0", background:"#fafafa" }}>
                    <button onClick={() => saveDayPicks(di, day)} disabled={saving[di]}
                      style={{ width:"100%", padding:"13px 12px", fontSize:14, fontWeight:700, background:saving[di]?"#f3f4f6":"#111", color:saving[di]?"#999":"#fff", border:"none", borderRadius:12, cursor:saving[di]?"not-allowed":"pointer", minHeight:50 }}>
                      {saving[di] ? "Guardando..." : saved[di] ? "✓ Pronosticos guardados" : "Guardar pronosticos — " + day.date}
                    </button>
                    {savedCount > 0 && !saving[di] && (
                      <div style={{ fontSize:11, color:"#999", textAlign:"center", marginTop:6 }}>
                        {savedCount}/{openMatches.length} listos · podes cambiarlos antes del primer partido
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ padding:"10px 14px", borderTop:"1px solid #f0f0f0", textAlign:"center", fontSize:12, color:"#bbb" }}>
                    Todos los partidos de este dia ya iniciaron
                  </div>
                )}
              </>
            )}
          </div>
        )
      })}
    </div>
  )
}
