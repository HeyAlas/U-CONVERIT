import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminPage.css';

/* ── Data ── */
const TOOLS = [
  { id: 'para', name: 'Paraphraser',  color: '#8B0E0E', total: 5241 },
  { id: 'hum',  name: 'Humanizer',    color: '#3b82f6', total: 3187 },
  { id: 'ocr',  name: 'OCR',          color: '#22c55e', total: 1954 },
  { id: 'quiz', name: 'Quiz Maker',   color: '#f59e0b', total: 1102 },
  { id: 'pdf',  name: 'PDF Convert',  color: '#a855f7', total:  876 },
];

const USERS = [
  { name: 'Maria Santos',    email: 'm.santos@cit.edu',   status: 'active',   tool: 'Paraphraser', uses: 142, joined: 'Jan 12' },
  { name: 'Juan dela Cruz',  email: 'j.delacruz@cit.edu', status: 'active',   tool: 'OCR',         uses:  38, joined: 'Feb 5'  },
  { name: 'Ana Reyes',       email: 'a.reyes@cit.edu',    status: 'active',   tool: 'Humanizer',   uses:  97, joined: 'Nov 20' },
  { name: 'Carlo Mendez',    email: 'c.mendez@cit.edu',   status: 'inactive', tool: 'Quiz Maker',  uses:  14, joined: 'Mar 1'  },
  { name: 'Liza Villanueva', email: 'l.vill@cit.edu',     status: 'active',   tool: 'PDF Convert', uses: 205, joined: 'Oct 8'  },
  { name: 'Miguel Torres',   email: 'm.torres@cit.edu',   status: 'active',   tool: 'Paraphraser', uses:  51, joined: 'Apr 14' },
  { name: 'Grace Ocampo',    email: 'g.ocampo@cit.edu',   status: 'active',   tool: 'Humanizer',   uses: 173, joined: 'Dec 3'  },
];

const PERIODS = {
  daily:   ['12a','2a','4a','6a','8a','10a','12p','2p','4p','6p','8p','10p'],
  weekly:  ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
  monthly: Array.from({ length: 30 }, (_, i) => String(i + 1)),
  yearly:  ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
};

function rnd(a, b) { return Math.floor(Math.random() * (b - a) + a); }
function genData(p) {
  return PERIODS[p].map(l => ({
    l,
    v: rnd(50, p === 'yearly' ? 9000 : p === 'monthly' ? 1200 : p === 'weekly' ? 800 : 160),
  }));
}

/* ── Nav items ── */
const NAV = [
  { label: 'Dashboard',     section: 'Overview' },
  { label: 'Analytics',     section: 'Overview' },
  { label: 'Users',         section: 'Management' },
  { label: 'Tools',         section: 'Management' },
  { label: 'Activity Logs', section: 'Management' },
];

/* ── Icon helpers ── */
const IconGrid = () => (
  <svg className="sb-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/>
    <rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>
  </svg>
);
const IconChart = () => (
  <svg className="sb-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <polyline points="3 17 9 11 13 15 21 7"/><polyline points="14 7 21 7 21 14"/>
  </svg>
);
const IconUsers = () => (
  <svg className="sb-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <circle cx="9" cy="7" r="3"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/>
    <circle cx="18" cy="8" r="2"/><path d="M18 14c2.2 0 4 1.6 4 3.6"/>
  </svg>
);
const IconTools = () => (
  <svg className="sb-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
  </svg>
);
const IconLogs = () => (
  <svg className="sb-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
  </svg>
);
const IconLogout = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="16" height="16">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);
const IconBell = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="16" height="16">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>
);

const NAV_ICONS = {
  Dashboard: <IconGrid/>,
  Analytics: <IconChart/>,
  Users: <IconUsers/>,
  Tools: <IconTools/>,
  'Activity Logs': <IconLogs/>
};

/* ══════════════════════════════════════════
   SUB-COMPONENTS
══════════════════════════════════════════ */

function StatCards() {
  const cards = [
    { l: 'Total Users', v: '2,847', c: '+12%', up: true, p: 'vs last month', bg: '#fff1f1', ic: '#8B0E0E',
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="16" height="16"><circle cx="9" cy="7" r="3"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><circle cx="18" cy="8" r="2"/></svg> },
    { l: 'Conversions Today', v: '1,203', c: '+23%', up: true, p: 'vs yesterday', bg: '#f0faf0', ic: '#16a34a',
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="16" height="16"><polyline points="3 17 9 11 13 15 21 7"/></svg> },
    { l: 'Avg. Session', v: '4m 32s', c: '-0.4%', up: false, p: 'vs last week', bg: '#eff6ff', ic: '#3b82f6',
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="16" height="16"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
  ];
  return (
    <div className="stats-row">
      {cards.map((x, i) => (
        <div key={i} className="stat">
          <div className="stat-label">{x.l}</div>
          <div className="stat-val">{x.v}</div>
          <div className="stat-sub">
            <span className={`stat-chg ${x.up ? 'up' : 'dn'}`}>{x.up ? '▲' : '▼'} {x.c}</span>
            <span className="stat-per">{x.p}</span>
          </div>
          <div className="stat-icon-wrap" style={{ background: x.bg }}>
            <span style={{ color: x.ic }}>{x.icon}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function RealtimePanel({ liveN, rtC }) {
  const max = Math.max(...Object.values(rtC), 1);
  return (
    <div className="panel">
      <div className="ph">
        <div className="ptitle"><span className="green-dot" /> Real-Time Usage</div>
        <span className="chip chip-g">{liveN} online</span>
      </div>
      <div className="rt-grid">
        {TOOLS.map(t => (
          <div key={t.id} className="rt-tool">
            <div className="rt-tname">{t.name}</div>
            <div className="rt-tval">{rtC[t.id]}</div>
            <div className="rt-tbar">
              <div className="rt-tfill" style={{ width: `${(rtC[t.id] / max) * 100}%`, background: t.color }} />
            </div>
          </div>
        ))}
      </div>
      <div className="rt-bottom">
        <div>
          <div className="rt-big">{liveN}</div>
          <div className="rt-big-lbl">active users now</div>
        </div>
        <div className="rt-bars">
          {TOOLS.map(t => (
            <div key={t.id}>
              <div className="rt-brow-meta">
                <span>{t.name}</span>
                <span>{rtC[t.id]} users</span>
              </div>
              <div className="rt-brow-track">
                <div className="rt-brow-fill" style={{ width: `${(rtC[t.id] / Math.max(liveN, 1)) * 100}%`, background: t.color }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ChartPanel() {
  const [period, setPeriod] = useState('weekly');
  const data = genData(period);
  const max = Math.max(...data.map(d => d.v), 1);
  const showEvery = data.length > 14 ? Math.ceil(data.length / 10) : 1;
  return (
    <div className="panel">
      <div className="ph">
        <div className="ptitle">Usage Analytics</div>
        <div className="tabs">
          {['daily','weekly','monthly','yearly'].map(p => (
            <button key={p} className={`tab${period === p ? ' on' : ''}`} onClick={() => setPeriod(p)}>
              {p[0].toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>
      <div className="bar-chart">
        {data.map((d, i) => (
          <div key={i} className="bc-col">
            <div
              className="bc-bar"
              title={`${d.v.toLocaleString()} uses`}
              style={{
                height: `${Math.max(4, (d.v / max) * 120)}px`,
                background: i === data.length - 1 ? '#8B0E0E' : '#e0e0ee',
                borderTop: `2px solid ${i === data.length - 1 ? '#c51d1d' : '#c8c8dc'}`,
              }}
            />
            <div className="bc-lbl">{i % showEvery === 0 ? d.l : ''}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DonutPanel() {
  const total = TOOLS.reduce((s, t) => s + t.total, 0);
  const r = 50, cx = 60, cy = 60, circ = 2 * Math.PI * r;
  let off = 0;
  const slices = TOOLS.map(t => { const d = (t.total / total) * circ; const s = { ...t, d, off }; off += d; return s; });
  return (
    <div className="panel">
      <div className="ph"><div className="ptitle">Tool Breakdown</div></div>
      <div className="donut-area">
        <svg width="120" height="120" viewBox="0 0 120 120" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e8e8f0" strokeWidth="14" />
          {slices.map(s => (
            <circle key={s.id} cx={cx} cy={cy} r={r} fill="none" stroke={s.color} strokeWidth="14"
              strokeDasharray={`${s.d} ${circ - s.d}`} strokeDashoffset={-s.off} />
          ))}
        </svg>
        <div className="donut-legend">
          {TOOLS.map(t => (
            <div key={t.id} className="leg-row">
              <div className="leg-l">
                <div className="leg-sq" style={{ background: t.color }} />
                <span className="leg-n">{t.name}</span>
              </div>
              <span className="leg-v">{t.total.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function UsersPanel() {
  const [search, setSearch] = useState('');
  const [filterTool, setFilterTool] = useState('');

  const filtered = USERS.filter(u => {
    const ms = !search || u.name.toLowerCase().includes(search) || u.email.toLowerCase().includes(search);
    const mf = !filterTool || u.tool === filterTool;
    return ms && mf;
  });

  return (
    <div className="panel">
      <div className="ph">
        <div className="ptitle">Registered Users</div>
        <span className="chip chip-r">{USERS.length} total</span>
      </div>
      <div className="tbl-ctrl">
        <input className="tbl-search" placeholder="Search name or email…"
          value={search} onChange={e => setSearch(e.target.value.toLowerCase())} />
        <select className="tbl-sel" value={filterTool} onChange={e => setFilterTool(e.target.value)}>
          <option value="">All Tools</option>
          {['Paraphraser','Humanizer','OCR','Quiz Maker','PDF Convert'].map(t => <option key={t}>{t}</option>)}
        </select>
      </div>
      <table>
        <thead>
          <tr>{['User','Status','Most Used Tool','Conversions','Joined',''].map(h => <th key={h}>{h}</th>)}</tr>
        </thead>
        <tbody>
          {filtered.map((u, i) => (
            <tr key={i}>
              <td>
                <div className="u-cell">
                  <div className="u-av">{u.name[0]}</div>
                  <div><div className="u-name">{u.name}</div><div className="u-email">{u.email}</div></div>
                </div>
              </td>
              <td><span className={`bdg ${u.status === 'active' ? 'bdg-on' : 'bdg-off'}`}>{u.status}</span></td>
              <td><span className="tool-tag">{u.tool}</span></td>
              <td><span className="mono">{u.uses.toLocaleString()}</span></td>
              <td style={{ fontSize: '12px', color: '#bbb' }}>{u.joined}</td>
              <td><button className="view-btn">View</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ══════════════════════════════════════════
   MAIN ADMIN PAGE
══════════════════════════════════════════ */
const SIDEBAR_MIN = 60;   // icon-only collapsed width
const SIDEBAR_MAX = 420;  // max drag width
const SIDEBAR_DEFAULT = 288;

export default function AdminPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState('Dashboard');
  const [clock, setClock] = useState('');
  const [liveN, setLiveN] = useState(47);
  const [rtC, setRtC] = useState({ para: 18, hum: 11, ocr: 7, quiz: 5, pdf: 6 });

  // Resizable sidebar
  const [sidebarW, setSidebarW] = useState(SIDEBAR_DEFAULT);
  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const dragStartW = useRef(0);

  const collapsed = sidebarW <= SIDEBAR_MIN + 10; // treat very narrow as "collapsed"

  const onDragStart = (e) => {
    isDragging.current = true;
    dragStartX.current = e.clientX;
    dragStartW.current = sidebarW;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  useEffect(() => {
    const onMove = (e) => {
      if (!isDragging.current) return;
      const delta = e.clientX - dragStartX.current;
      const next = Math.min(SIDEBAR_MAX, Math.max(SIDEBAR_MIN, dragStartW.current + delta));
      setSidebarW(next);
    };
    const onUp = () => {
      if (!isDragging.current) return;
      isDragging.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      // Snap: if dragged below threshold, fully collapse; if above, keep value
      setSidebarW(w => w < SIDEBAR_MIN + 30 ? SIDEBAR_MIN : w);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, []);

  // Double-click handle to toggle between collapsed and default
  const onHandleDblClick = () => {
    setSidebarW(w => (w <= SIDEBAR_MIN + 10 ? SIDEBAR_DEFAULT : SIDEBAR_MIN));
  };

  const adminRaw = sessionStorage.getItem('adminUser');
  const admin = adminRaw ? JSON.parse(adminRaw) : { name: 'Admin', role: 'Super Administrator' };
  const initials = admin.name ? admin.name[0].toUpperCase() : 'A';

  useEffect(() => {
    if (!adminRaw) navigate('/login');
  }, []);

  useEffect(() => {
    const tick = () => setClock(new Date().toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const id = setInterval(() => setLiveN(n => Math.max(10, Math.min(200, n + (rnd(0, 5) - 2)))), 2500);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      const keys = Object.keys(rtC);
      const k = keys[rnd(0, keys.length)];
      setRtC(prev => ({ ...prev, [k]: Math.max(0, prev[k] + (Math.random() > 0.4 ? 1 : -1)) }));
    }, 1800);
    return () => clearInterval(id);
  }, []);

  const handleLogout = () => {
    sessionStorage.removeItem('adminUser');
    navigate('/login');
  };

  const renderContent = () => {
    switch (page) {
      case 'Dashboard':
        return (<>
          <StatCards />
          <RealtimePanel liveN={liveN} rtC={rtC} />
          <div className="two-col">
            <ChartPanel />
            <DonutPanel />
          </div>
          <UsersPanel />
        </>);
      case 'Analytics':
        return (<>
          <StatCards />
          <ChartPanel />
          <DonutPanel />
        </>);
      case 'Users':
        return <UsersPanel />;
      default:
        return <div style={{ padding: '48px', color: '#ccc', fontSize: '14px' }}>Section coming soon.</div>;
    }
  };

  const sections = [...new Set(NAV.map(n => n.section))];

  return (
    <div className="adm-shell">
      {/* ── Sidebar ── */}
      <aside
        className={`sidebar${collapsed ? ' sb-collapsed' : ''}`}
        style={{ width: sidebarW, minWidth: sidebarW, maxWidth: sidebarW }}
      >
        {/* Logo / Brand */}
        <div className="sb-logo">
          <div className="sb-brand">
            <div className="logo-circle">
              <img src="/logo.png" alt="U" className="logo-img" />
            </div>
            {!collapsed && (
              <div className="brand-wrap">
                <span className="brand">U-ConvertIT</span>
                <span className="unlimited-pill">ADMIN</span>
              </div>
            )}
          </div>
          {!collapsed && <div className="sb-sub">Control Panel</div>}
        </div>

        {/* Navigation */}
        <nav className="sb-nav">
          {sections.map(sec => (
            <div key={sec} className="sb-section-group">
              {!collapsed && <div className="sb-sec">{sec}</div>}
              {NAV.filter(n => n.section === sec).map(n => (
                <button
                  key={n.label}
                  className={`sb-item${page === n.label ? ' on' : ''}`}
                  onClick={() => setPage(n.label)}
                  title={collapsed ? n.label : undefined}
                >
                  <span className="sb-dot" />
                  {NAV_ICONS[n.label]}
                  {!collapsed && <span className="sb-item-label">{n.label}</span>}
                  {page === n.label && !collapsed && <span className="sb-active-bar" />}
                </button>
              ))}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="sb-foot">
          <div className="sb-av" title={collapsed ? admin.name : undefined}>{initials}</div>
          {!collapsed && (
            <div className="sb-user-info">
              <div className="sb-aname">{admin.name}</div>
              <div className="sb-arole">{admin.role}</div>
            </div>
          )}
          {!collapsed && (
            <button className="sb-logout" onClick={handleLogout} title="Logout">
              <IconLogout />
            </button>
          )}
        </div>

        {/* ── Drag Handle ── */}
        <div
          className="sb-resize-handle"
          onMouseDown={onDragStart}
          onDoubleClick={onHandleDblClick}
          title="Drag to resize · Double-click to toggle"
        >
          <div className="sb-resize-grip" />
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="adm-main">
        {/* Topbar */}
        <div className="topbar">
          {/* Left: empty spacer to help center the title */}
          <div className="tb-left" />

          {/* Center: Page title */}
          <div className="topbar-title">{page}</div>

          {/* Right: live indicator, clock, bell — all pushed to the far right */}
          <div className="tb-right">
            <div className="tb-live">
              <div className="live-dot" />
              <span className="tb-live-txt">{liveN} online</span>
            </div>
            <div className="tb-clock">{clock}</div>
            <div className="tb-bell">
              <IconBell />
              <div className="tb-badge">3</div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="adm-content">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}