import React, { useEffect, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import { agents } from './data/characters.js';
import RuangOffice from './scene/RuangOffice.jsx';

const rooms = [
  { id: 'all', label: 'Whole office', icon: '⌂' },
  { id: 'studio', label: 'Workspace', icon: '▤' },
  { id: 'meeting', label: 'Meeting room', icon: '◫' },
  { id: 'lounge', label: 'Lounge', icon: '▱' },
  { id: 'games', label: 'Game room', icon: '✦' },
  { id: 'pantry', label: 'Pantry', icon: '☕' },
  { id: 'street', label: 'Street food', icon: '♨' },
  { id: 'bedroom', label: 'Bedroom', icon: '☾' },
  { id: 'bathroom', label: 'Bathroom', icon: '⌁' },
  { id: 'musholla', label: 'Musholla', icon: '☪' },
  { id: 'dining', label: 'Dining room', icon: '♨' },
  { id: 'balcony', label: 'Balcony', icon: '⌂' },
];

const statusLabels = {
  working: 'Working',
  review: 'In review',
  idle: 'On a break',
  blocked: 'Blocked',
  queued: 'Queued',
};

const statusHints = {
  working: 'At their workstation, moving the task forward.',
  review: 'Checking details before handing work back.',
  idle: 'Taking a breather around the shared spaces.',
  blocked: 'Paused while waiting for an input or dependency.',
  queued: 'Ready for the next task to be assigned.',
};

function Avatar({ agent, small = false }) {
  return (
    <span
      className={'v-avatar' + (small ? ' v-avatar-small' : '') + (agent.id === 'boss' ? ' v-avatar-boss' : '')}
      style={{ '--avatar-shirt': agent.shirt, '--avatar-skin': agent.color, '--avatar-hair': agent.hair }}
      aria-hidden="true"
    >
      <span className="v-avatar-hair" />
      <span className="v-avatar-face"><i /><i /></span>
      <span className="v-avatar-body" />
    </span>
  );
}

function Status({ status }) {
  return <span className={'v-status v-status-' + status}><i />{statusLabels[status] || status}</span>;
}

function App() {
  const appRef = useRef(null);
  const [nightOverride, setNightOverride] = useState(null);
  const [simulationNow, setSimulationNow] = useState(() => Date.now());
  const [timeScale, setTimeScale] = useState(60);
  const [activeRoom, setActiveRoom] = useState('all');
  const [selectedAgentId, setSelectedAgentId] = useState('boss');
  const [showConnect, setShowConnect] = useState(false);
  const [accessToken, setAccessToken] = useState('');
  const [taskPrompt, setTaskPrompt] = useState('');
  const [dispatchState, setDispatchState] = useState('idle');
  const [dispatchError, setDispatchError] = useState('');
  const [dispatchResult, setDispatchResult] = useState(null);


  const crew = useMemo(() => agents.filter((agent) => agent.id !== 'boss'), []);
  const selectedAgent = agents.find((agent) => agent.id === selectedAgentId) || agents[0];
  const stats = useMemo(() => ({
    working: crew.filter((agent) => agent.status === 'working').length,
    resting: crew.filter((agent) => agent.status === 'idle').length,
    review: crew.filter((agent) => agent.status === 'review').length,
  }), [crew]);

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!reduce && appRef.current) {
      gsap.fromTo(
        appRef.current.querySelectorAll('.v-reveal'),
        { y: 10, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.55, stagger: 0.055, ease: 'power3.out', clearProps: 'all' },
      );
    }
  }, []);

  // Advance from actual elapsed time rather than adding a fixed amount per callback.
  // If the 3D renderer briefly blocks the main thread, the clock catches up instead of drifting.
  // At 60×, a complete in-game day takes 24 real minutes.
  useEffect(() => {
    let lastTick = performance.now();
    const timer = window.setInterval(() => {
      const tick = performance.now();
      const elapsed = Math.max(0, tick - lastTick);
      lastTick = tick;
      setSimulationNow((current) => current + elapsed * timeScale);
    }, 250);
    return () => window.clearInterval(timer);
  }, [timeScale]);

  useEffect(() => {
    if (!showConnect) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setShowConnect(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [showConnect]);

  const chooseRoom = (room) => {
    setActiveRoom(room);
  };

  const chooseAgent = (agent) => {
    setSelectedAgentId(agent.id);
    if (agent.id === 'boss') chooseRoom('studio');
    else if (agent.room) chooseRoom(agent.room);
  };

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

  const simulationDate = new Date(simulationNow);
  const time = new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).format(simulationDate);
  const date = new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta', weekday: 'short', day: 'numeric', month: 'short',
  }).format(simulationDate);
  const clockParts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(simulationDate);
  const simulationMinute = Number(clockParts.find((part) => part.type === 'hour')?.value || 0) * 60
    + Number(clockParts.find((part) => part.type === 'minute')?.value || 0);
  const automaticNight = simulationMinute < 360 || simulationMinute >= 1080;
  const night = nightOverride === null ? automaticNight : nightOverride;
  const selectedRoomLabel = rooms.find((room) => room.id === activeRoom)?.label || 'Whole office';

  return (
    <main className={'virtual-shell' + (night ? ' virtual-night' : '')} ref={appRef}>
      <header className="v-topbar v-reveal">
        <a className="v-brand" href="#office" aria-label="Riiddev virtual office">
          <span className="v-brand-mark"><span>R</span><i>↗</i></span>
          <span className="v-brand-copy"><strong>riiddev <b>/</b> office</strong><small>A tiny world for big ideas</small></span>
        </a>

        <div className="v-topbar-status">
          <span className="v-live-dot" />
          <span>VIRTUAL OFFICE</span>
          <i />
          <span className="v-topbar-sub">INTERACTIVE WORLD</span>
        </div>

        <div className="v-topbar-actions">
          <div className="v-clock"><strong>{time}</strong><small>{date} · WIB · {timeScale}×</small></div>
          <label className="v-time-speed" title="Simulation speed">
            <span>SIM</span>
            <select aria-label="Simulation time multiplier" value={timeScale} onChange={(event) => setTimeScale(Number(event.target.value))}>
              <option value={1}>1×</option>
              <option value={15}>15×</option>
              <option value={30}>30×</option>
              <option value={60}>60×</option>
              <option value={120}>120×</option>
            </select>
          </label>
          <button className="v-icon-button" onClick={() => setNightOverride((value) => value === null ? !night : null)} title={night ? 'Override automatic day/night mode' : 'Override automatic day/night mode'} aria-label={night ? 'Override automatic day/night mode' : 'Override automatic day/night mode'}>
            <span>{night ? '☼' : '☾'}</span>
          </button>
          <button className="v-task-button" onClick={() => { setShowConnect(true); setDispatchState('idle'); setDispatchError(''); setDispatchResult(null); }}>
            <span>＋</span> Assign a task
          </button>
        </div>
      </header>

      <section className="v-intro v-reveal" id="office">
        <div className="v-intro-copy">
          <p className="v-eyebrow"><span>✳</span> YOUR AI HEADQUARTERS <i /> EST. NOW</p>
          <h1>Your world.<em> Your crew.</em></h1>
          <p>Look around, check in on your agents, and see where the next idea is taking shape.</p>
        </div>
        <div className="v-world-metrics">
          <div className="v-metric"><span className="v-metric-number">{String(crew.length).padStart(2, '0')}</span><span>AI CREW</span></div>
          <div className="v-metric"><span className="v-metric-number">{String(stats.working).padStart(2, '0')}</span><span>WORKING</span></div>
          <div className="v-metric"><span className="v-metric-number">{String(stats.resting).padStart(2, '0')}</span><span>ON A BREAK</span></div>
          <span className="v-demo-label"><i /> SIMULATED ACTIVITY</span>
        </div>
      </section>

      <section className="v-world-layout v-reveal" aria-label="Interactive virtual office">
        <div className="v-world-stage">
          <RuangOffice night={night} focusRoom={activeRoom} onSelectAgent={setSelectedAgentId} simulationNow={simulationNow} simulationRate={timeScale} />

          <div className="v-stage-topline">
            <span className="v-stage-live"><i /> WORLD VIEW</span>
            <span className="v-stage-divider">/</span>
            <span>{selectedRoomLabel.toUpperCase()}</span>
            <span className="v-stage-spacer" />
            <span className="v-stage-index">HQ–01</span>
          </div>

          <nav className="v-room-dock" aria-label="Explore office rooms">
            <div className="v-room-dock-heading"><span>EXPLORE</span><small>12 SPACES</small></div>
            {rooms.map((room) => (
              <button
                key={room.id}
                className={'v-room-button' + (activeRoom === room.id ? ' active' : '')}
                onClick={() => chooseRoom(room.id)}
                title={'Explore ' + room.label}
                aria-pressed={activeRoom === room.id}
              >
                <span className="v-room-icon">{room.icon}</span>
                <span className="v-room-label">{room.label}</span>
                {activeRoom === room.id && <span className="v-room-active-mark" />}
              </button>
            ))}
            <button className="v-room-reset" onClick={() => chooseRoom('all')} title="Reset camera">
              <span>↺</span> Reset view
            </button>
          </nav>

          <aside className="v-agent-dock" aria-label="Selected agent">
            <div className="v-agent-dock-top">
              <span className="v-panel-kicker">MEET THE CREW</span>
              <span className="v-panel-count">{selectedAgent.id === 'boss' ? 'BOSS' : 'AGENT ' + String(crew.findIndex((agent) => agent.id === selectedAgent.id) + 1).padStart(2, '0')}</span>
            </div>
            <div className="v-agent-identity">
              <Avatar agent={selectedAgent} />
              <div className="v-agent-identity-copy">
                <h2>{selectedAgent.name}</h2>
                <span>{selectedAgent.role}</span>
                <small>{selectedAgent.provider}</small>
              </div>
            </div>
            <Status status={selectedAgent.status} />
            <p className="v-agent-blurb">{statusHints[selectedAgent.status] || selectedAgent.description}</p>
            <div className="v-agent-current">
              <span className="v-current-label">CURRENT FOCUS <i>{selectedAgent.taskId || 'NO TASK ID'}</i></span>
              <strong>{selectedAgent.task}</strong>
              {selectedAgent.progress > 0 && (
                <div className="v-progress-line"><span><i style={{ width: selectedAgent.progress + '%' }} /></span><small>{selectedAgent.progress}%</small></div>
              )}
            </div>
            <div className="v-agent-actions">
              <button className="v-follow-button" onClick={() => chooseAgent(selectedAgent)}>⌖ <span>Follow in 3D</span><b>↗</b></button>
              <button className="v-assign-mini" onClick={() => { setShowConnect(true); setDispatchState('idle'); setDispatchError(''); setDispatchResult(null); }}>＋ Assign task</button>
            </div>
            <div className="v-agent-dock-foot"><span className="v-agent-foot-dot" /> Character state is illustrative</div>
          </aside>

          <div className="v-orbit-hint">
            <span className="v-hint-mouse"><i /><b /></span>
            <span><strong>Make yourself at home</strong><small>Drag to orbit <i /> scroll to zoom <i /> click a character</small></span>
          </div>

          <button className="v-stage-reset-floating" onClick={() => chooseRoom('all')} aria-label="Reset camera view" title="Reset camera">⤢</button>
        </div>

        <div className="v-stage-foot">
          <div className="v-room-caption"><span className="v-caption-icon">⌂</span><span><strong>{selectedRoomLabel}</strong><small>{activeRoom === 'all' ? 'A cutaway view of your whole headquarters.' : 'Take a closer look around this room.'}</small></span></div>
          <div className="v-stage-legend">
            <span><i className="legend-working" /> Working</span>
            <span><i className="legend-review" /> Review</span>
            <span><i className="legend-idle" /> Resting / waiting</span>
          </div>
          <span className="v-footnote">Drag · zoom · explore</span>
        </div>
      </section>

      <section className="v-crew-section v-reveal" aria-label="All office characters">
        <div className="v-crew-heading">
          <div><p className="v-eyebrow">YOUR PEOPLE <i /> 01—{String(agents.length).padStart(2, '0')}</p><h2>Everyone has a place.</h2></div>
          <span>SELECT A CHARACTER TO INSPECT</span>
        </div>
        <div className="v-crew-rail">
          {agents.map((agent) => (
            <button key={agent.id} className={'v-crew-card' + (selectedAgent.id === agent.id ? ' selected' : '')} onClick={() => chooseAgent(agent)} aria-pressed={selectedAgent.id === agent.id}>
              <span className="v-crew-avatar-wrap"><Avatar agent={agent} small /><i className={'v-crew-dot v-dot-' + agent.status} /></span>
              <span className="v-crew-copy"><strong>{agent.id === 'boss' ? 'You · ' + agent.name : agent.name}</strong><small>{agent.role}</small><em>{agent.station}</em></span>
              <span className={'v-crew-status-dot v-dot-' + agent.status} title={statusLabels[agent.status]} />
            </button>
          ))}
        </div>
      </section>

      <footer className="v-footer">
        <span><b>RIIDDEV</b> <i>×</i> VIRTUAL OFFICE</span>
        <span>Designed to feel a little more human.</span>
        <button onClick={() => setShowConnect(true)}>How task dispatch works <i>↗</i></button>
      </footer>

      {showConnect && (
        <div className="v-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowConnect(false); }}>
          <section className="v-task-modal" role="dialog" aria-modal="true" aria-labelledby="v-modal-title">
            <button className="v-modal-close" onClick={() => setShowConnect(false)} aria-label="Close dialog">×</button>
            <div className="v-modal-icon">↗</div>
            <p className="v-eyebrow">REMOTE EXECUTION <i /> OPENCODE</p>
            <h2 id="v-modal-title">Give your crew a new task.</h2>
            <p className="v-modal-copy">This creates a task issue in <strong>riiddev/office</strong> and asks OpenCode to work through GitHub Actions. Code changes are returned as a pull request to review; they are not merged automatically.</p>
            <div className="v-connection-row"><span className="v-connection-monogram">OC</span><span><strong>OpenCode</strong><small>GitHub-hosted cloud worker</small></span><span className="v-connection-state">PR-FIRST</span></div>
            <form className="v-dispatch-form" onSubmit={submitTask}>
              <label><span>HQ access token</span><input type="password" value={accessToken} onChange={(event) => setAccessToken(event.target.value)} autoComplete="off" placeholder="Same value as HQ_ACCESS_TOKEN in Vercel" required /></label>
              <label><span>What should the agent do?</span><textarea value={taskPrompt} onChange={(event) => setTaskPrompt(event.target.value)} maxLength={3000} minLength={8} rows={5} placeholder="Example: Improve the office navigation and open a pull request with the changes." required /></label>
              <div className="v-dispatch-hint"><span>Maximum 3,000 characters</span><span>{taskPrompt.length}/3000</span></div>
              <button className="v-submit-button" type="submit" disabled={dispatchState === 'sending' || !accessToken.trim() || taskPrompt.trim().length < 8}>
                {dispatchState === 'sending' ? 'Sending task…' : 'Send task to GitHub Actions'} <span>↗</span>
              </button>
              {dispatchState === 'error' && <div className="v-dispatch-error" role="alert"><strong>Task belum terkirim.</strong><span>{dispatchError}</span>{dispatchResult?.issueUrl && <a href={dispatchResult.issueUrl} target="_blank" rel="noreferrer">Open created issue ↗</a>}</div>}
              {dispatchState === 'success' && dispatchResult && <div className="v-dispatch-success" role="status"><strong>Task sudah dikirim ke GitHub.</strong><span>{dispatchResult.message}</span><div><a href={dispatchResult.issueUrl} target="_blank" rel="noreferrer">Open task issue ↗</a><a href={dispatchResult.workflowUrl} target="_blank" rel="noreferrer">Open Actions ↗</a></div></div>}
            </form>
            <div className="v-security-note"><span>♧</span><p><strong>Keep secrets private</strong><br />The HQ token is sent only to the protected Vercel endpoint. Never include passwords or API keys in the task description.</p></div>
            <p className="v-modal-disclaimer">The crew and activity shown in the 3D world are a visual simulation. Live task execution depends on the GitHub and Vercel setup.</p>
          </section>
        </div>
      )}
    </main>
  );
}

export default App;
