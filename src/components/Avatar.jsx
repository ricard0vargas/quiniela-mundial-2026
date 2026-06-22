const COLORS = [
  ["#9FE1CB","#085041"],["#F5C4B3","#712B13"],["#B5D4F4","#0C447C"],
  ["#F4C0D1","#72243E"],["#C0DD97","#27500A"],["#CECBF6","#3C3489"],
  ["#FAC775","#633806"],["#F09595","#501313"],["#5DCAA5","#04342C"],
]
function colorForId(id) {
  let n = 0
  for (let i = 0; i < (id||"").length; i++) n += id.charCodeAt(i)
  return COLORS[n % COLORS.length]
}
export default function Avatar({ profile, size=36, style={} }) {
  const [bg, fg] = colorForId(profile?.id)
  const initials = (profile?.display_name || profile?.username || "?")
    .split(" ").slice(0,2).map(w=>w[0]).join("").toUpperCase()
  const base = { width:size, height:size, borderRadius:"50%", flexShrink:0, overflow:"hidden", display:"flex", alignItems:"center", justifyContent:"center", fontSize:Math.round(size*0.35), fontWeight:700, background:bg, color:fg, ...style }
  if (profile?.avatar_url) return (
    <div style={base}>
      <img src={profile.avatar_url} alt={initials} style={{ width:"100%", height:"100%", objectFit:"cover" }} onError={e=>e.target.style.display="none"} />
    </div>
  )
  return <div style={base}>{initials}</div>
}
