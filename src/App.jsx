import React, { useEffect, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import { createOffice } from './scene/createOffice.js';
import { agents } from './data/characters.js';

const rooms = [
  { id: 'all', label: 'Whole HQ', icon: '⌂' },
  { id: 'boss', label: 'Boss office', icon: '♛' },
  { id: 'studio', label: 'Studio', icon: '✳' },
  { id: 'focus', label: 'Focus studio', icon: '▤' },
  { id: 'meeting', label: 'War room', icon: '◫' },
  { id: 'lounge', label: 'Lounge', icon: '▱' },
  { id: 'games', label: 'Game room', icon: '✦' },
  { id: 'dining', label: 'Dining', icon: '♧' },
  { id: 'bathroom', label: 'Bathroom', icon: '⌁' },
  { id: 'pool', label: 'Pool deck', icon: '≈' },
  { id: 'pantry', label: 'Pantry', icon: '☕' },
];
const tasks = [
  { id: 'DEV-014', title: 'Refactor landing page components', agentId: 'forge', status: 'working', category: 'Development', priority: 'high', progress: 68 },
  { id: 'RES-008', title: 'Summarize visual references', agentId: 'scout', status: 'review', category: 'Research', priority: 'normal', progress: 92 },
  { id: 'QA-003', title: 'Check responsive layouts', agentId: 'guard', status: 'blocked', category: 'Quality', priority: 'normal', progress: 35 },
  { id: 'DES-021', title: 'Prepare next visual direction', agentId: 'pixel', status: 'queued', category: 'Design', priority: 'low', progress: 0 },
];
const activity = [
  { time: 'Just now', agentId: 'forge', title: 'Updated components', detail: 'Refactoring the landing page', tone: 'working' },
  { time: '2 min ago', agentId: 'scout', title: 'Draft ready for review', detail: 'Summarizing visual references', tone: 'review' },
  { time: '5 min ago', agentId: 'guard', title: 'Dependency check paused', detail: 'Waiting for another task', tone: 'blocked' },
  { time: '12 min ago', agentId: 'pixel', title: 'Returned to the lounge', detail: 'No task assigned in this preview', tone: 'idle' },
];
const crew = agents.filter((agent) => agent.id !== 'boss');
const boss = agents.find((agent) => agent.id === 'boss');
const statusLabels = { working: 'Working', review: 'Needs review', idle: 'Idle', blocked: 'Blocked', queued: 'Queued' };
const statusGlyphs = { working: '↗', review: '◷', idle: '☕', blocked: 'Ⅱ', queued: '○' };

function StatusBadge({ status }) {
  return <span className={`status-badge status-${status}`}><i />{statusLabels[status] || status}</span>;
}
function AgentAvatar({ agent, compact = false }) {
  return <span className={`agent-avatar ${agent.id === 'boss' ? 'boss-avatar' : ''} ${compact ? 'compact' : ''}`} style={{ '--avatar': agent.shirt, '--skin': agent.color, '--hair': agent.hair }}>
    <span className="avatar-hair" /><span className="avatar-face"><i /><i /></span><span className="avatar-body" />
  </span>;
}

function App() {
  const sceneHost = useRef(null);
  const office = useRef(null);
  const mainRef = useRef(null);
  const [night, setNight] = useState(false);
  const [activeRoom, setActiveRoom] = useState('all');
  const [selectedAgentId, setSelectedAgentId] = useState('boss');
  const [showConnect, setShowConnect] = useState(false);
  const [accessToken, setAccessToken] = useState('');
  const [taskPrompt, setTaskPrompt] = useState('');
  const [dispatchState, setDispatchState] = useState('idle');
  const [dispatchError, setDispatchError] = useState('');
  const [dispatchResult, setDispatchResult] = useState(null);
  const [clock, setClock] = useState(() => new Date());
  const selectedAgent = agents.find((agent) => agent.id === selectedAgentId) || agents[0];
  const counts = useMemo(() => ({
    working: crew.filter((agent) => agent.status === 'working').length,
    review: crew.filter((agent) => agent.status === 'review').length,
    connected: 0,
  }), []);

  useEffect(() => {
    if (!sceneHost.current) return undefined;
    office.current = createOffice(sceneHost.current, { onSelect: (agentId) => setSelectedAgentId(agentId) });
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!reduce && mainRef.current) {
      gsap.fromTo(mainRef.current.querySelectorAll('.animate-in'), { y: 12, opacity: 0 }, { y: 0, opacity: 1, duration: 0.65, stagger: 0.06, ease: 'power3.out', clearProps: 'all' });
    }
    return () => { office.current?.destroy(); office.current = null; };
  }, []);
  useEffect(() => {
    const timer = window.setInterval(() => setClock(new Date()), 30000);
    return () => window.clearInterval(timer);
  }, []);
  useEffect(() => { office.current?.setNight(night); }, [night]);

  const chooseRoom = (room) => { setActiveRoom(room); office.current?.focusRoom(room); };
  const chooseAgent = (agent) => { setSelectedAgentId(agent.id); chooseRoom(agent.room || 'all'); };
  const submitTask = async (event) => {
    event.preventDefault();
    if (dispatchState === 'sending') return;
    setDispatchState('sending');
    setDispatchError('');
    setDispatchResult(null);
    try {
      const response = await fetch('/api/agent-tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + accessToken.trim(),
        },
        body: JSON.stringify({ prompt: taskPrompt.trim() }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        setDispatchResult(result);
        throw new Error(result.error || ('Request failed (HTTP ' + response.status + ').'));
      }
      setDispatchResult(result);
      setDispatchState('success');
      setTaskPrompt('');
    } catch (error) {
      setDispatchError(error instanceof Error ? error.message : 'Something went wrong. Try again.');
      setDispatchState('error');
    }
  };
  const time = clock.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  const date = clock.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' });

  return <main className={`app-shell hq-shell ${night ? 'night-mode' : ''}`} ref={mainRef}>
    <header className="topbar hq-topbar animate-in">
      <a className="brand" href="#home" aria-label="Riiddev Agent HQ home">
        <span className="brand-mark hq-brand-mark">HQ<span>↗</span></span>
        <span className="brand-copy"><strong>riiddev <span className="brand-slash">/</span> agent hq</strong><small>Your tiny AI headquarters</small></span>
      </a>
      <div className="hq-topbar-center"><span className="demo-dot" /> BOSS MODE <span className="topbar-divider">/</span> INTERACTIVE HQ</div>
      <div className="topbar-actions">
        <div className="clock"><strong>{time}</strong><span>{date}</span></div>
        <button className="theme-toggle" onClick={() => setNight((value) => !value)} aria-label={night ? 'Switch to daytime' : 'Switch to nighttime'} title="Toggle day / night"><span>{night ? '☼' : '☾'}</span><small>{night ? 'Day' : 'Night'}</small></button>
        <button className="connect-button" onClick={() => setShowConnect(true)}><span>＋</span> Run cloud task</button>
      </div>
    </header>

    <section className="hq-intro animate-in">
      <div className="hq-intro-copy">
        <p className="eyebrow"><span>✦</span> FOUNDER'S FLOOR · BOSS MODE</p>
        <h1>Welcome to your HQ,<br /><em>Boss.</em></h1>
        <p className="intro-copy">Your own living 3D headquarters. Walk the floor, check in on your crew,<br className="desktop-break" /> and send the next big idea into motion.</p>
      </div>
      <div className="preview-notice"><span className="preview-notice-icon">⌁</span><span><strong>Your office, your rules</strong><small>9 AI coworkers · illustrative activity is marked as demo.</small></span><span className="notice-arrow">↗</span></div>
    </section>

    <section className="hq-stats animate-in" aria-label="Agent overview">
      <article className="hq-stat-card"><div className="stat-top"><span className="stat-icon icon-lilac">⌘</span><span className="stat-micro">DEMO</span></div><strong className="stat-number">{crew.length.toString().padStart(2, '0')}</strong><span className="stat-label">AI coworkers</span><span className="stat-sub">Plus you, the boss</span></article>
      <article className="hq-stat-card"><div className="stat-top"><span className="stat-icon icon-green">↗</span><span className="stat-micro">DEMO</span></div><strong className="stat-number">{counts.working.toString().padStart(2, '0')}</strong><span className="stat-label">Working now</span><span className="stat-sub">Simulated task state</span></article>
      <article className="hq-stat-card"><div className="stat-top"><span className="stat-icon icon-amber">◷</span><span className="stat-micro">DEMO</span></div><strong className="stat-number">{counts.review.toString().padStart(2, '0')}</strong><span className="stat-label">Needs review</span><span className="stat-sub">Example review queue</span></article>
      <article className="hq-stat-card"><div className="stat-top"><span className="stat-icon icon-blue">⟡</span><span className="stat-micro">LIVE</span></div><strong className="stat-number">{counts.connected.toString().padStart(2, '0')}</strong><span className="stat-label">Connected agents</span><span className="stat-sub">Real connections</span></article>
    </section>

    <section className="hq-main-grid animate-in">
      <article className="world-card hq-world-card">
        <div className="hq-world-head"><div className="world-label"><span className="world-pulse" /><span><strong>THE VIRTUAL OFFICE</strong><small>INTERACTIVE WORLD / 01</small></span></div><div className="hq-world-state"><span className="demo-dot" /> COZY HQ · DEMO ACTIVITY</div></div>
        <div className="world-toolbar hq-world-toolbar">
          <div className="room-switcher" aria-label="Choose room">{rooms.map((room) => <button key={room.id} className={activeRoom === room.id ? 'room-button active' : 'room-button'} onClick={() => chooseRoom(room.id)}><span>{room.icon}</span>{room.label}</button>)}</div>
          <button className="reset-button" onClick={() => { setActiveRoom('all'); office.current?.resetView(); }} title="Reset camera"><span className="icon">↺</span><span>Reset view</span></button>
        </div>
        <div className="world-stage hq-world-stage">
          <div className="scene-host" ref={sceneHost} />
          <div className="scene-stamp hq-scene-stamp"><span>RIIDDEV</span><strong>agent habitat</strong><span>♡ & tiny tasks</span></div>
          <div className="scene-compass"><span>N</span><div className="compass-needle" /><span>S</span></div>
          <div className="scene-caption"><span className="caption-pin">⌖</span><span><strong>{rooms.find((room) => room.id === activeRoom)?.label || 'Whole office'}</strong><small>Drag to orbit · scroll to zoom · click a character</small></span></div>
        </div>
        <div className="world-footer hq-world-footer"><span><i className="legend-dot mint" /> <b>Working</b></span><span><i className="legend-dot peach" /> <b>Review</b></span><span><i className="legend-dot lavender" /> <b>Idle / blocked</b></span><span className="world-footer-note">Character states are simulated in this preview.</span></div>
      </article>

      <aside className="hq-crew-panel">
        <div className="hq-section-head"><div><p className="eyebrow">YOUR PEOPLE</p><h2>Meet the crew</h2></div><span className="count-pill">{crew.length} AI crew</span></div>
        {boss && <button className={`hq-boss-callout ${selectedAgent.id === boss.id ? 'selected' : ''}`} onClick={() => chooseAgent(boss)}>
          <AgentAvatar agent={boss} />
          <span className="hq-boss-copy"><small>YOUR ROLE</small><strong>Riiddev · Founder &amp; Boss</strong><span>Executive desk · click to focus</span></span>
          <span className="hq-boss-arrow">↗</span>
        </button>}
        <div className="hq-agent-list">{crew.map((agent) => <button key={agent.id} className={`hq-agent-row ${selectedAgent.id === agent.id ? 'selected' : ''}`} onClick={() => chooseAgent(agent)}>
          <AgentAvatar agent={agent} />
          <span className="hq-agent-main"><strong>{agent.name}</strong><small>{agent.role}</small><span className="hq-agent-task">{agent.task}</span></span>
          <span className="hq-agent-side"><StatusBadge status={agent.status} /><small>{agent.provider}</small></span>
        </button>)}</div>
        <div className="hq-selected-agent">
          <div className="selected-agent-top"><div><p className="eyebrow">SELECTED AGENT</p><h3>{selectedAgent.name} <span className="selected-star">✦</span></h3></div><AgentAvatar agent={selectedAgent} /></div>
          <StatusBadge status={selectedAgent.status} />
          <p className="selected-agent-description">{selectedAgent.description}</p>
          <div className="selected-task-box"><span className="task-box-label">CURRENT TASK <small>{selectedAgent.taskId || 'NO TASK ID'}</small></span><strong>{selectedAgent.task}</strong>{selectedAgent.progress > 0 && <div className="progress-row"><div className="progress-track"><span style={{ width: `${selectedAgent.progress}%` }} /></div><small>{selectedAgent.progress}%</small></div>}</div>
          <button className="wide-button hq-desk-button" onClick={() => chooseRoom(selectedAgent.room)}><span>View {selectedAgent.name}'s desk</span><span>↗</span></button>
        </div>
      </aside>
    </section>

    <section className="hq-bottom-grid animate-in">
      <article className="hq-panel hq-task-panel">
        <div className="hq-section-head"><div><p className="eyebrow">TASK PIPELINE</p><h2>Work in the room</h2></div><span className="demo-label">SAMPLE TASKS</span></div>
        <div className="hq-task-list">{tasks.map((task) => {
          const agent = agents.find((item) => item.id === task.agentId);
          return <button key={task.id} className="hq-task-row" onClick={() => agent && chooseAgent(agent)}>
            <span className={`task-priority priority-${task.priority}`} />
            <span className="hq-task-content"><span className="hq-task-meta"><small>{task.id}</small><span>{task.category}</span></span><strong>{task.title}</strong><span className="hq-task-owner"><AgentAvatar agent={agent} compact /> {agent.name}</span></span>
            <span className="hq-task-end"><StatusBadge status={task.status} /><span className="task-progress-value">{task.progress ? `${task.progress}%` : '—'}</span></span>
          </button>;
        })}</div>
        <div className="hq-panel-foot"><span>Tasks are example records for the UI preview.</span><button onClick={() => setShowConnect(true)}>Connect a task source <span>↗</span></button></div>
      </article>

      <article className="hq-panel hq-activity-panel">
        <div className="hq-section-head"><div><p className="eyebrow">RECENT EVENTS</p><h2>Activity stream</h2></div><span className="activity-indicator"><i /> DEMO</span></div>
        <div className="hq-activity-list">{activity.map((event, index) => {
          const agent = agents.find((item) => item.id === event.agentId);
          return <div className="hq-activity-row" key={`${event.agentId}-${index}`}><span className={`activity-node tone-${event.tone}`}>{statusGlyphs[event.tone]}</span><span className="activity-body"><strong>{event.title}</strong><small>{agent.name} · {event.detail}</small><time>{event.time}</time></span></div>;
        })}</div>
        <div className="hq-activity-note"><span>ⓘ</span> No live events are being collected yet.</div>
      </article>
    </section>

    <footer className="hq-footer"><span>RIIDDEV <b>×</b> AGENT HQ</span><span>Built for human-guided AI work.</span><button onClick={() => setShowConnect(true)}>How do I connect an agent? <span>↗</span></button></footer>

    {showConnect && <div className="hq-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowConnect(false); }}>
      <section className="hq-connect-modal" role="dialog" aria-modal="true" aria-labelledby="connect-title">
        <button className="hq-modal-close" onClick={() => setShowConnect(false)} aria-label="Close dialog">×</button>
        <div className="connect-modal-icon">↗</div><p className="eyebrow">REMOTE EXECUTION · OPENCODE</p><h2 id="connect-title">Send a task to the cloud.</h2>
        <p className="connect-modal-copy">Agent HQ will create a task issue in <strong>riiddev/office</strong> and ask OpenCode to work in GitHub Actions. Code changes should arrive as a pull request for you to review; the workflow does not merge automatically.</p>
        <div className="connect-source-list">
          <div className="connect-source-row"><span className="source-monogram open-code">OC</span><span><strong>OpenCode</strong><small>Runs in a GitHub-hosted runner</small></span><span className="source-state">Cloud worker</span></div>
          <div className="connect-source-row"><span className="source-monogram open-claw">GH</span><span><strong>GitHub Actions</strong><small>Task history and code review</small></span><span className="source-state">PR-first</span></div>
        </div>
        <form className="dispatch-form" onSubmit={submitTask}>
          <label className="dispatch-field"><span>HQ access token</span><input type="password" value={accessToken} onChange={(event) => setAccessToken(event.target.value)} autoComplete="off" placeholder="Same value as HQ_ACCESS_TOKEN in Vercel" required /></label>
          <label className="dispatch-field"><span>What should the agent do?</span><textarea value={taskPrompt} onChange={(event) => setTaskPrompt(event.target.value)} maxLength={3000} minLength={8} rows={5} placeholder="Example: Review the current dashboard for accessibility issues and open a PR with safe fixes." required /></label>
          <div className="dispatch-hint"><span>Maximum 3,000 characters</span><span>{taskPrompt.length}/3000</span></div>
          <button className="connect-primary dispatch-submit" type="submit" disabled={dispatchState === 'sending' || !accessToken.trim() || taskPrompt.trim().length < 8}>
            {dispatchState === 'sending' ? 'Sending task…' : 'Send task to GitHub Actions'} <span>↗</span>
          </button>
          {dispatchState === 'error' && <div className="dispatch-error" role="alert"><strong>Task belum terkirim.</strong><span>{dispatchError}</span>{dispatchResult?.issueUrl && <a href={dispatchResult.issueUrl} target="_blank" rel="noreferrer">Open issue yang sudah dibuat ↗</a>}</div>}
          {dispatchState === 'success' && dispatchResult && <div className="dispatch-result" role="status"><strong>Task sudah dikirim ke GitHub.</strong><span>{dispatchResult.message}</span><div><a href={dispatchResult.issueUrl} target="_blank" rel="noreferrer">Open task issue ↗</a><a href={dispatchResult.workflowUrl} target="_blank" rel="noreferrer">Open Actions ↗</a></div></div>}
        </form>
        <div className="security-note"><span>♧</span><p><strong>Keep secrets out of task text</strong><br />The HQ token is sent to the protected Vercel endpoint. The GitHub token stays server-side; do not include passwords or API keys in a task because the issue text may be visible in GitHub.</p></div>
        <p className="connect-disclaimer">Setup: HQ_ACCESS_TOKEN and GITHUB_ISSUES_TOKEN belong in Vercel; the OpenCode GitHub App and GEMINI_API_KEY belong in GitHub. Gemini free-tier limits apply, and this preview still labels sample crew activity honestly.</p>
      </section>
    </div>}
  </main>;
}
export default App;
