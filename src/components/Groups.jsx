import { useState, useEffect } from "react"

export default function Groups() {
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [openGroup, setOpenGroup] = useState("Group A")

  useEffect(() => {
    fetch("https://api.football-data.org/v4/competitions/WC/standings", {
      headers: { "X-Auth-Token": "36ccc3b57a8e470997a9e1f1c6837370" }
    })
    .then(r => r.json())
    .then(d => { setGroups(d.standings || []); setLoading(false) })
    .catch(() => setLoading(false))
  }, [])

  if (loading) return (
    <div style={{ textAlign:"center", padding:"2rem", color:"#999", fontSize:13 }}>Cargando grupos...</div>
  )

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
      {groups.map(g => {
        const isOpen = openGroup === g.group
        return (
          <div key={g.group} style={{ background:"#fff", border:"1px solid #e5e5e5", borderRadius:16, overflow:"hidden" }}>
            <div onClick={() => setOpenGroup(isOpen ? null : g.group)}
              style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 14px", background:"#fafafa", borderBottom:isOpen?"1px solid #e5e5e5":"none", cursor:"pointer", minHeight:48 }}>
              <div style={{ fontSize:14, fontWeight:700 }}>{g.group}</div>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <div style={{ fontSize:11, color:"#999" }}>{g.table.slice(0,2).map(t => t.team.tla).join(" · ")}</div>
                <span style={{ fontSize:13, color:"#bbb" }}>{isOpen ? "▲" : "▼"}</span>
              </div>
            </div>
            {isOpen && (
              <div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 28px 28px 28px 28px 28px 32px", gap:4, padding:"6px 14px", fontSize:10, color:"#999", textTransform:"uppercase", letterSpacing:"0.05em", borderBottom:"1px solid #f0f0f0", background:"#fafafa" }}>
                  <div>Equipo</div>
                  <div style={{textAlign:"center"}}>PJ</div>
                  <div style={{textAlign:"center"}}>G</div>
                  <div style={{textAlign:"center"}}>E</div>
                  <div style={{textAlign:"center"}}>P</div>
                  <div style={{textAlign:"center"}}>DG</div>
                  <div style={{textAlign:"center"}}>Pts</div>
                </div>
                {g.table.map((row, i) => (
                  <div key={row.team.id} style={{ display:"grid", gridTemplateColumns:"1fr 28px 28px 28px 28px 28px 32px", gap:4, padding:"9px 14px", alignItems:"center", borderBottom:"1px solid #f5f5f5", background:i<2?"#f0fdf4":i===2?"#fffbeb":"#fff" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8, minWidth:0 }}>
                      <div style={{ fontSize:11, fontWeight:700, color:"#999", width:14, flexShrink:0 }}>{row.position}</div>
                      <img src={row.team.crest} alt={row.team.shortName} style={{ width:20, height:20, objectFit:"contain", flexShrink:0 }} onError={e => e.target.style.display="none"} />
                      <div style={{ fontSize:13, fontWeight:i<2?700:400, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{row.team.shortName}</div>
                    </div>
                    <div style={{textAlign:"center", fontSize:12, color:"#666"}}>{row.playedGames}</div>
                    <div style={{textAlign:"center", fontSize:12, color:"#166534"}}>{row.won}</div>
                    <div style={{textAlign:"center", fontSize:12, color:"#666"}}>{row.draw}</div>
                    <div style={{textAlign:"center", fontSize:12, color:"#b91c1c"}}>{row.lost}</div>
                    <div style={{textAlign:"center", fontSize:12, color:row.goalDifference>0?"#166534":row.goalDifference<0?"#b91c1c":"#666"}}>{row.goalDifference>0?"+"+row.goalDifference:row.goalDifference}</div>
                    <div style={{textAlign:"center", fontSize:14, fontWeight:700}}>{row.points}</div>
                  </div>
                ))}
                <div style={{ display:"flex", gap:8, padding:"7px 14px", background:"#fafafa", borderTop:"1px solid #f0f0f0" }}>
                  <span style={{ fontSize:10, background:"#dcfce7", color:"#166534", padding:"2px 7px", borderRadius:20 }}>Clasifica</span>
                  <span style={{ fontSize:10, background:"#fef9c3", color:"#854d0e", padding:"2px 7px", borderRadius:20 }}>Posible 3ro</span>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}