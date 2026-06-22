import { useState, useEffect, useCallback } from "react"
import { supabase, groupByDate } from "../lib/supabase.js"
import Avatar from "../components/Avatar.jsx"
import Standings from "../components/Standings.jsx"
import Calendar from "../components/Calendar.jsx"
import History from "../components/History.jsx"
import Admin from "../components/Admin.jsx"
import Groups from "../components/Groups.jsx"
import ProfileEditor from "../components/ProfileEditor.jsx"

export default function Main({ session, profile, onProfileUpdate }) {
  const [tab, setTab] = useState("standings")
  const [matches, setMatches] = useState([])
  const [profiles, setProfiles] = useState([])
  const [picks, setPicks] = useState({})
  const [loading, setLoading] = useState(true)
  const [showProfile, setShowProfile] = useState(false)

  const loadData = useCallback(async () => {
    const [{ data: mData }, { data: pData }, { data: pkData }] = await Promise.all([
      supabase.from("matches").select("*").order("sort_order"),
      supabase.from("profiles").select("*"),
      supabase.from("picks").select("*"),
    ])
    setMatches(mData || [])
    setProfiles(pData || [])
    const pickMap = {}
    ;(pkData || []).forEach(pk => {
      if (!pickMap[pk.user_id]) pickMap[pk.user_id] = {}
      pickMap[pk.user_id][pk.match_id] = pk
    })
    setPicks(pickMap)
    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  useEffect(() => {
    const ch = supabase.channel("quiniela-live")
      .on("postgres_changes", { event:"*", schema:"public", table:"matches" }, loadData)
      .on("postgres_changes", { event:"*", schema:"public", table:"picks" }, loadData)
      .on("postgres_changes", { event:"*", schema:"public", table:"profiles" }, loadData)
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [loadData])

  function handlePicksSaved(upserts) {
    setPicks(prev => {
      const next = { ...prev }
      if (!next[session.user.id]) next[session.user.id] = {}
      upserts.forEach(u => { next[session.user.id][u.match_id] = u })
      return next
    })
  }

  function handleMatchUpdated(matchId, scoreA, scoreB, state) {
    setMatches(prev => prev.map(m => m.id===matchId ? { ...m, score_a:scoreA, score_b:scoreB, state:state??"finished" } : m))
  }

  const finished = matches.filter(m => m.state === "finished")
  const upcoming = matches.filter(m => m.state !== "finished")
  const histDays = groupByDate(finished)
  const calDays = groupByDate(upcoming)
  const myPicks = picks[session.user.id] || {}
  const featured = upcoming[0] || finished[finished.length-1]

  const NAV = [
    { id:"standings", icon:"🏆", label:"Tabla" },
    { id:"calendar", icon:"📅", label:"Pronósticos" },
    { id:"history", icon:"📋", label:"Historial" },
    { id:"groups", icon:"🌍", label:"Grupos" },
  ]
  if (profile.is_admin) NAV.push({ id:"admin", icon:"🔒", label:"Admin" })

  if (loading) return <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100dvh", fontSize:40 }}>⚽</div>

  return (
    <div style={{ paddingBottom:80 }}>
      <div style={{ padding:"12px 14px 0", display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
        <button onClick={() => setShowProfile(!showProfile)} style={{ display:"flex", alignItems:"center", gap:9, border:"none", background:"none", cursor:"pointer", padding:0 }}>
          <Avatar profile={profile} size={38} />
          <div style={{ textAlign:"left" }}>
            <div style={{ fontSize:13, fontWeight:700, color:"#111" }}>{profile.display_name||profile.username}</div>
            <div style={{ fontSize:11, color:"#999" }}>@{profile.username} · Editar perfil</div>
          </div>
        </button>
        <button onClick={() => supabase.auth.signOut()}
          style={{ fontSize:12, padding:"6px 11px", border:"1px solid #e5e5e5", borderRadius:8, cursor:"pointer", background:"#fff", color:"#666" }}>
          Salir
        </button>
      </div>

      {showProfile && (
        <ProfileEditor profile={profile} onUpdate={p => { onProfileUpdate(p); setShowProfile(false) }} onClose={() => setShowProfile(false)} />
      )}

      {featured && (
        <div style={{ margin:"0 14px 10px", background:"#fafafa", border:"1px solid #e5e5e5", borderRadius:16, padding:"12px 14px" }}>
          <div style={{ fontSize:10, color:"#bbb", textTransform:"uppercase", letterSpacing:"0.07em", textAlign:"center", marginBottom:8 }}>{featured.stage} · {featured.date_label}</div>
