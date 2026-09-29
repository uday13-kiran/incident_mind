import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom'
import * as api from './api'
import type { Incident, Investigation, Memory, Severity, Status } from './types'

const navItems = [
  ['Dashboard', '/'],
  ['Incidents', '/incidents'],
  ['AI Investigator', '/ai'],
  ['Memory', '/memory'],
  ['Reports', '/reports'],
  ['Settings', '/settings'],
]

function App() {
  return <Routes>
    <Route path="/login" element={<AuthPage />} />
    <Route path="/register" element={<AuthPage register />} />
    <Route element={<ProtectedLayout />}>
      <Route path="/" element={<Dashboard />} />
      <Route path="/incidents" element={<Incidents />} />
      <Route path="/incidents/:id" element={<IncidentDetail />} />
      <Route path="/ai" element={<AIPage />} />
      <Route path="/memory" element={<MemoryPage />} />
      <Route path="/reports" element={<Reports />} />
      <Route path="/settings" element={<Settings />} />
    </Route>
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
}

function ProtectedLayout() {
  if (!api.isAuthenticated()) return <Navigate to="/login" replace />
  return <Shell />
}

function Shell() {
  const location = useLocation()
  const navigate = useNavigate()
  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">⚡</div>
        <div><strong>IncidentMind</strong><span>Smarter incidents. Faster resolutions.</span></div>
      </div>
      <nav>
        {navItems.map(([label, path]) => <Link key={path} className={location.pathname === path || (path === '/incidents' && location.pathname.startsWith('/incidents/')) ? 'nav-item active' : 'nav-item'} to={path}>
          <span className="nav-icon">{iconFor(label)}</span>{label}
        </Link>)}
      </nav>
      <div className="sidebar-note"><span>✦</span><b>Memory-powered</b><small>Every investigation can make the next one smarter.</small></div>
      <button className="logout" onClick={() => { api.logout(); navigate('/login') }}>↪ Sign out</button>
    </aside>
    <main className="main-area">
      <header className="topbar">
        <div className="search"><span>⌕</span><input placeholder="Search incidents, services, or keywords..." /></div>
        <div className="top-actions"><button className="icon-button">♧</button><div className="org-pill"><span>▦</span><div><b>My Organization</b><small>Organization</small></div></div><div className="avatar">IM</div></div>
      </header>
      <div className="content"><RoutesOutlet /></div>
    </main>
  </div>
}

function RoutesOutlet() { return <Routes>
  <Route path="/" element={<Dashboard />} />
  <Route path="/incidents" element={<Incidents />} />
  <Route path="/incidents/:id" element={<IncidentDetail />} />
  <Route path="/ai" element={<AIPage />} />
  <Route path="/memory" element={<MemoryPage />} />
  <Route path="/reports" element={<Reports />} />
  <Route path="/settings" element={<Settings />} />
</Routes> }

function iconFor(label: string) { return ({Dashboard:'⌂', Incidents:'▣', 'AI Investigator':'✦', Memory:'◈', Reports:'▥', Settings:'⚙'} as Record<string,string>)[label] }

function AuthPage({ register: registerMode = false }: { register?: boolean }) {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setError(''); setBusy(true)
    try {
      if (registerMode) { await api.register(name, email, password); await api.login(email, password) }
      else await api.login(email, password)
      navigate('/')
    } catch (err) { setError(err instanceof Error ? err.message : 'Something went wrong') }
    finally { setBusy(false) }
  }

  return <div className="auth-page"><div className="auth-card">
    <div className="brand centered"><div className="brand-mark">⚡</div><div><strong>IncidentMind</strong><span>AI-powered incident response</span></div></div>
    <h1>{registerMode ? 'Create your workspace' : 'Welcome back'}</h1>
    <p className="muted">{registerMode ? 'Start investigating incidents with persistent memory.' : 'Sign in to continue to your incident workspace.'}</p>
    <form onSubmit={submit}>
      {registerMode && <label>Organization name<input value={name} onChange={e => setName(e.target.value)} required placeholder="Acme Corporation" /></label>}
      <label>Email<input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@company.com" /></label>
      <label>Password<input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={8} placeholder="••••••••" /></label>
      {error && <div className="error-box">{error}</div>}
      <button className="primary wide" disabled={busy}>{busy ? 'Please wait…' : registerMode ? 'Create organization' : 'Sign in'}</button>
    </form>
    <p className="switch-auth">{registerMode ? 'Already have an account?' : 'New organization?'} <Link to={registerMode ? '/login' : '/register'}>{registerMode ? 'Sign in' : 'Create one'}</Link></p>
  </div></div>
}

function useIncidents() {
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const reload = async () => { setLoading(true); setError(''); try { setIncidents(await api.listIncidents()) } catch (e) { setError(e instanceof Error ? e.message : 'Unable to load incidents') } finally { setLoading(false) } }
  useEffect(() => { reload() }, [])
  return { incidents, loading, error, reload, setIncidents }
}

function Dashboard() {
  const { incidents, loading } = useIncidents()
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000)
    return () => window.clearInterval(timer)
  }, [])
  const stats = useMemo(() => ({ open: incidents.filter(i => i.status === 'open').length, investigating: incidents.filter(i => i.status === 'investigating').length, critical: incidents.filter(i => i.severity === 'critical').length, resolved: incidents.filter(i => i.status === 'resolved' || i.status === 'closed').length }), [incidents])
  const hour = now.getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
  return <>
    <PageHeading title={`${greeting} 👋`} subtitle="Here's what's happening with your incidents today." />
    <div className="stats-grid">
      <Stat title="Open Incidents" value={stats.open} icon="!" tone="yellow" />
      <Stat title="Investigating" value={stats.investigating} icon="✦" tone="purple" />
      <Stat title="Critical" value={stats.critical} icon="▲" tone="red" />
      <Stat title="Resolved" value={stats.resolved} icon="✓" tone="green" />
    </div>
    <div className="dashboard-grid">
      <section className="panel chart-panel"><div className="panel-head"><div><h2>Incident Overview</h2><p>Current workload across your organization.</p></div><span className="select-pill">Recent</span></div><div className="fake-chart"><div className="chart-bars">{[35,52,41,68,48,75,57,88,64,78,70,92].map((h,i)=><span key={i} style={{height:`${h}%`}} />)}</div><div className="chart-labels"><span>Open</span><span>Investigating</span><span>Resolved</span></div></div></section>
      <AIWidget incidents={incidents} />
    </div>
    <div className="lower-grid">
      <section className="panel"><div className="panel-head"><div><h2>Recent Incidents</h2><p>Latest issues requiring attention.</p></div><Link to="/incidents" className="text-link">View all →</Link></div>{loading ? <Loading /> : incidents.length ? <IncidentTable incidents={incidents.slice(0,6)} /> : <Empty title="No incidents yet" text="Create your first incident to start the investigation workflow." />}</section>
      <section className="panel activity"><div className="panel-head"><div><h2>Memory activity</h2><p>What the agent is learning.</p></div><Link to="/memory" className="text-link">Explore →</Link></div><ActivityItem icon="◈" title="Memory-ready architecture" text="Historical incidents are searchable through Hindsight." /><ActivityItem icon="✦" title="AI Investigator" text="Groq turns retrieved context into recommendations." /><ActivityItem icon="✓" title="Tenant isolation" text="Each organization receives its own memory bank." /></section>
    </div>
  </>
}

function AIWidget({ incidents }: { incidents: Incident[] }) { const navigate = useNavigate(); const latest = incidents[0]; return <section className="ai-widget"><div className="ai-header"><span className="sparkle">✦</span><div><h2>AI Investigator</h2><small>Powered by Hindsight Memory + Groq</small></div></div><div className="bot">◉</div><p>{latest ? `I can investigate “${latest.title}” using relevant historical incidents from your memory bank.` : 'Create an incident and I can compare it with your historical incident memory.'}</p><button className="primary" onClick={() => navigate(latest ? `/incidents/${latest.id}` : '/incidents')}>{latest ? 'Investigate latest →' : 'Open incidents →'}</button></section> }

function Incidents() {
  const { incidents, loading, error, reload } = useIncidents(); const [filter, setFilter] = useState<'all'|Status>('all'); const [showCreate, setShowCreate] = useState(false)
  const filtered = filter === 'all' ? incidents : incidents.filter(i => i.status === filter)
  return <><PageHeading title="Incidents" subtitle="Track, investigate, and resolve incidents across your services." action={<button className="primary" onClick={() => setShowCreate(true)}>＋ Create incident</button>} />
    <div className="filter-row">{(['all','open','investigating','resolved','closed'] as const).map(f => <button key={f} className={filter===f?'filter active':'filter'} onClick={()=>setFilter(f)}>{f === 'all' ? `All (${incidents.length})` : `${capitalize(f)} (${incidents.filter(i=>i.status===f).length})`}</button>)}</div>
    {error && <div className="error-box">{error}</div>}{loading ? <Loading /> : <section className="panel"><IncidentTable incidents={filtered} /><div className="panel-footer"><button className="secondary" onClick={reload}>Refresh</button></div></section>}
    {showCreate && <CreateIncidentModal onClose={()=>setShowCreate(false)} onCreated={()=>{setShowCreate(false); reload()}} />}
  </>
}

function IncidentTable({ incidents }: { incidents: Incident[] }) { return <div className="table-wrap"><table><thead><tr><th>ID</th><th>Title</th><th>Service</th><th>Severity</th><th>Status</th><th>Created</th><th></th></tr></thead><tbody>{incidents.map(i => <tr key={i.id}><td><Link className="id-link" to={`/incidents/${i.id}`}>INC-{String(i.id).padStart(4,'0')}</Link></td><td><Link to={`/incidents/${i.id}`} className="title-link">{i.title}</Link></td><td>{i.service}</td><td><Badge value={i.severity} /></td><td><Badge value={i.status} /></td><td>{formatDate(i.created_at)}</td><td><Link className="more" to={`/incidents/${i.id}`}>→</Link></td></tr>)}</tbody></table></div> }

function IncidentDetail() {
  const { id } = useParams(); const navigate = useNavigate(); const [incident,setIncident] = useState<Incident|null>(null); const [analysis,setAnalysis]=useState<Investigation|null>(null); const [loading,setLoading]=useState(true); const [busy,setBusy]=useState(false); const [error,setError]=useState('')
  useEffect(()=>{ if(id) api.getIncident(Number(id)).then(setIncident).catch(e=>setError(e.message)).finally(()=>setLoading(false)) },[id])
  if(loading) return <Loading />; if(!incident) return <div className="error-box">{error || 'Incident not found'}</div>
  async function investigate(){setBusy(true);setError('');try{setAnalysis(await api.investigateIncident(incident.id))}catch(e){setError(e instanceof Error?e.message:'Investigation failed')}finally{setBusy(false)}}
  async function resolve(){try{const updated=await api.updateIncident(incident.id,{status:'resolved'});setIncident(updated)}catch(e){setError(e instanceof Error?e.message:'Update failed')}}
  return <><button className="back" onClick={()=>navigate('/incidents')}>← Back to incidents</button><div className="detail-grid"><div><section className="panel detail-main"><div className="detail-title"><div><span className="eyebrow">INC-{String(incident.id).padStart(4,'0')}</span><h1>{incident.title}</h1><p>{incident.service} · Created {formatDate(incident.created_at)}</p></div><div className="detail-actions"><Badge value={incident.severity}/><Badge value={incident.status}/></div></div><div className="detail-tabs"><span className="selected">Overview</span><span>Timeline</span><span>Memory context</span></div><div className="detail-fields"><Info label="Description" value={incident.description}/><Info label="Root cause" value={incident.root_cause || 'Not recorded yet.'}/><Info label="Resolution" value={incident.resolution || 'Not recorded yet.'}/></div><div className="detail-buttons"><button className="secondary" onClick={resolve}>Mark resolved</button><button className="primary" onClick={investigate} disabled={busy}>✦ {busy ? 'Investigating…' : 'Run AI investigation'}</button></div></section>{analysis && <InvestigationCard analysis={analysis}/>}</div><section className="panel timeline"><div className="panel-head"><div><h2>Incident timeline</h2><p>Current lifecycle.</p></div></div><TimelineItem title="Incident created" text={formatDate(incident.created_at)}/><TimelineItem title={`Status: ${incident.status}`} text="Current state"/><TimelineItem title="AI memory ready" text="Hindsight context can be retrieved for this incident." /></section></div></>
}

function InvestigationCard({analysis}:{analysis:Investigation}) { return <section className="panel investigation-card"><div className="panel-head"><div><h2>✦ AI Investigation</h2><p>Groq reasoning grounded in Hindsight memories.</p></div><span className={`confidence ${analysis.confidence}`}>{capitalize(analysis.confidence)} confidence</span></div><h3>Summary</h3><p>{analysis.summary}</p><h3>Likely root cause</h3><p>{analysis.likely_root_cause}</p><h3>Recommended actions</h3><ul>{analysis.recommended_actions.map((a,i)=><li key={i}>{a}</li>)}</ul><h3>Relevant memory</h3>{analysis.memories.length ? <div className="memory-chips">{analysis.memories.slice(0,5).map(m=><div key={m.id} className="memory-chip"><b>{m.type}</b><span>{m.text}</span></div>)}</div> : <p className="muted">No relevant historical memories were returned.</p>}</section> }

function AIPage(){const {incidents}=useIncidents(); const [selected,setSelected]=useState(''); const [analysis,setAnalysis]=useState<Investigation|null>(null); const [busy,setBusy]=useState(false); const [error,setError]=useState(''); async function run(){if(!selected)return;setBusy(true);setError('');try{setAnalysis(await api.investigateIncident(Number(selected)))}catch(e){setError(e instanceof Error?e.message:'Investigation failed')}finally{setBusy(false)}} return <><PageHeading title="AI Investigator" subtitle="Ask the agent to investigate an incident using persistent organizational memory."/><section className="panel ai-page"><label>Select incident<select value={selected} onChange={e=>setSelected(e.target.value)}><option value="">Choose an incident…</option>{incidents.map(i=><option key={i.id} value={i.id}>INC-{String(i.id).padStart(4,'0')} · {i.title}</option>)}</select></label><button className="primary" onClick={run} disabled={!selected||busy}>{busy?'Investigating…':'✦ Investigate with memory'}</button>{error&&<div className="error-box">{error}</div>}{analysis&&<InvestigationCard analysis={analysis}/>}</section></>}

function MemoryPage(){const [query,setQuery]=useState('');const [memories,setMemories]=useState<Memory[]>([]);const [busy,setBusy]=useState(false);const [error,setError]=useState('');async function search(){if(!query.trim())return;setBusy(true);setError('');try{setMemories(await api.searchMemory(query))}catch(e){setError(e instanceof Error?e.message:'Memory search failed')}finally{setBusy(false)}}return <><PageHeading title="Memory" subtitle="Search the persistent Hindsight memory bank for your organization."/><section className="panel memory-page"><div className="memory-search"><input value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>e.key==='Enter'&&search()} placeholder="e.g. previous database connection incidents"/><button className="primary" onClick={search} disabled={busy}>{busy?'Searching…':'Search memory'}</button></div>{error&&<div className="error-box">{error}</div>}{memories.length?<div className="memory-list">{memories.map(m=><div className="memory-row" key={m.id}><span className="memory-type">{m.type}</span><div><b>{m.text}</b><small>{m.context || 'Hindsight memory'}</small></div></div>)}</div>:<Empty title="No memories displayed" text="Search for an incident pattern, service, or resolution to see relevant memory."/>}</section></>}

function Reports(){return <><PageHeading title="Reports" subtitle="A simple operational view for your incident workload."/><div className="stats-grid"><Stat title="Total incidents" value="Live" icon="▣" tone="purple"/><Stat title="Memory layer" value="On" icon="◈" tone="green"/><Stat title="AI layer" value="Groq" icon="✦" tone="yellow"/><Stat title="Tenant model" value="Isolated" icon="⌂" tone="purple"/></div><section className="panel"><h2>Architecture health</h2><p className="muted">This MVP keeps PostgreSQL for structured incident state, Hindsight for persistent memory, and Groq for reasoning.</p></section></>}

function Settings(){return <><PageHeading title="Settings" subtitle="Configure the workspace presentation and connection settings."/><section className="panel settings-list"><div><b>Organization memory</b><p>Each organization maps to its own Hindsight memory bank.</p></div><div><b>AI model</b><p>Configured by the backend using the GROQ_MODEL environment variable.</p></div><div><b>Frontend API</b><p>Configured with VITE_API_BASE_URL.</p></div></section></>}

function CreateIncidentModal({onClose,onCreated}:{onClose:()=>void;onCreated:()=>void}){const [title,setTitle]=useState('');const [service,setService]=useState('');const [severity,setSeverity]=useState<Severity>('medium');const [description,setDescription]=useState('');const [busy,setBusy]=useState(false);const [error,setError]=useState('');async function submit(e:React.FormEvent){e.preventDefault();setBusy(true);setError('');try{await api.createIncident({title,service,severity,description});onCreated()}catch(err){setError(err instanceof Error?err.message:'Could not create incident')}finally{setBusy(false)}}return <div className="modal-backdrop"><form className="modal" onSubmit={submit}><div className="panel-head"><div><h2>Create incident</h2><p>New incidents become available to the AI investigator.</p></div><button type="button" className="icon-button" onClick={onClose}>×</button></div><label>Title<input value={title} onChange={e=>setTitle(e.target.value)} required/></label><label>Service<input value={service} onChange={e=>setService(e.target.value)} required/></label><label>Severity<select value={severity} onChange={e=>setSeverity(e.target.value as Severity)}><option>low</option><option>medium</option><option>high</option><option>critical</option></select></label><label>Description<textarea value={description} onChange={e=>setDescription(e.target.value)} required rows={5}/></label>{error&&<div className="error-box">{error}</div>}<div className="modal-actions"><button type="button" className="secondary" onClick={onClose}>Cancel</button><button className="primary" disabled={busy}>{busy?'Creating…':'Create incident'}</button></div></form></div>}

function PageHeading({title,subtitle,action}:{title:string;subtitle:string;action?:React.ReactNode}){return <div className="page-heading"><div><h1>{title}</h1><p>{subtitle}</p></div>{action}</div>}
function Stat({title,value,icon,tone}:{title:string;value:string|number;icon:string;tone:string}){return <div className={`stat-card ${tone}`}><span className="stat-icon">{icon}</span><div><span>{title}</span><strong>{value}</strong></div></div>}
function Badge({value}:{value:string}){return <span className={`badge ${value}`}>{value.replace('_',' ')}</span>}
function ActivityItem({icon,title,text}:{icon:string;title:string;text:string}){return <div className="activity-item"><span>{icon}</span><div><b>{title}</b><small>{text}</small></div></div>}
function TimelineItem({title,text}:{title:string;text:string}){return <div className="timeline-item"><i></i><div><b>{title}</b><small>{text}</small></div></div>}
function Info({label,value}:{label:string;value:string}){return <div className="info-block"><span>{label}</span><p>{value}</p></div>}
function Empty({title,text}:{title:string;text:string}){return <div className="empty"><div>◌</div><b>{title}</b><p>{text}</p></div>}
function Loading(){return <div className="loading">Loading…</div>}
function capitalize(s:string){return s.charAt(0).toUpperCase()+s.slice(1)}
function formatDate(value:string){return new Date(value).toLocaleString([], {month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})}

export default App
