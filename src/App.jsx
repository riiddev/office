import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { createOffice } from './scene/createOffice.js';
import { characters } from './data/characters.js';

const rooms = [
  { id: 'all', label: 'All rooms', icon: '⌂' },
  { id: 'studio', label: 'Studio', icon: '✳' },
  { id: 'lounge', label: 'Lounge', icon: '▱' },
  { id: 'games', label: 'Game room', icon: '✦' },
  { id: 'pantry', label: 'Pantry', icon: '☕' },
];

function Icon({ children }) {
  return <span className="icon" aria-hidden="true">{children}</span>;
}

export default function App() {
  const sceneHost = useRef(null);
  const office = useRef(null);
  const mainRef = useRef(null);
  const [night, setNight] = useState(false);
  const [activeRoom, setActiveRoom] = useState('all');
  const [selected, setSelected] = useState(characters[0]);
  const [showRoster, setShowRoster] = useState(true);
  const [clock, setClock] = useState(() => new Date());

  useEffect(() => {
    if (!sceneHost.current) return undefined;
    office.current = createOffice(sceneHost.current);
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!reduce && mainRef.current) {
      gsap.fromTo(mainRef.current.querySelectorAll('.animate-in'), { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, stagger: 0.08, ease: 'power3.out', clearProps: 'all' });
    }
    return () => {
      office.current?.destroy();
      office.current = null;
    };
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setClock(new Date()), 30000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    office.current?.setNight(night);
  }, [night]);

  const chooseRoom = (room) => {
    setActiveRoom(room);
    office.current?.focusRoom(room);
  };

  const time = clock.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  const date = clock.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' });

  return (
    <main className={'app-shell ' + (night ? 'night-mode' : '')} ref={mainRef}>
      <header className="topbar animate-in">
        <a className="brand" href="#home" aria-label="Little Office home">
          <span className="brand-mark">lo<span>.</span></span>
          <span className="brand-copy"><strong>little office</strong><small>a tiny cozy world</small></span>
        </a>
        <div className="topbar-center"><span className="live-dot" /> YOUR LITTLE CORNER OF THE INTERNET</div>
        <div className="topbar-actions">
          <div className="clock"><strong>{time}</strong><span>{date}</span></div>
          <button className="theme-toggle" onClick={() => setNight((value) => !value)} aria-label={night ? 'Switch to daytime' : 'Switch to nighttime'} title="Toggle day / night">
            <span>{night ? '☼' : '☾'}</span><small>{night ? 'Day' : 'Night'}</small>
          </button>
        </div>
      </header>

      <section className="intro animate-in">
        <div>
          <p className="eyebrow"><span>✦</span> A SMALL PLACE TO UNWIND</p>
          <h1>Somewhere to <em>just exist.</em></h1>
          <p className="intro-copy">A tiny office full of tiny people doing tiny things.<br className="desktop-break" /> Nothing urgent. Just vibes.</p>
        </div>
        <div className="weather-pill"><span className="sun-icon">{night ? '☾' : '☀'}</span><span><strong>{night ? 'Quiet evening' : 'Soft daylight'}</strong><small>{night ? 'The lamps are on' : 'A little sun through the window'}</small></span></div>
      </section>

      <section className="world-card animate-in" aria-label="Interactive 3D office">
        <div className="world-toolbar">
          <div className="world-label"><span className="world-pulse" /><span><strong>THE OFFICE</strong><small>MINIATURE WORLD / 01</small></span></div>
          <div className="room-switcher" aria-label="Choose room">
            {rooms.map((room) => <button key={room.id} className={activeRoom === room.id ? 'room-button active' : 'room-button'} onClick={() => chooseRoom(room.id)}><span>{room.icon}</span>{room.label}</button>)}
          </div>
          <button className="reset-button" onClick={() => { setActiveRoom('all'); office.current?.resetView(); }} title="Reset camera"><Icon>↺</Icon><span>Reset view</span></button>
        </div>
        <div className="world-stage">
          <div className="scene-host" ref={sceneHost} />
          <div className="scene-caption"><span className="caption-pin">⌖</span><span><strong>{rooms.find((room) => room.id === activeRoom)?.label || 'All rooms'}</strong><small>Drag to orbit · Scroll to zoom · Right-drag to pan</small></span></div>
          <div className="scene-stamp"><span>MADE OF</span><strong>little things</strong><span>♡ & sunlight</span></div>
          <div className="scene-compass"><span>N</span><div className="compass-needle" /><span>S</span></div>
        </div>
        <div className="world-footer"><span><i className="legend-dot mint" /> 5 little residents</span><span><i className="legend-dot peach" /> Animated with love</span><span className="world-footer-note">No tasks. No deadlines. Just tiny lives.</span></div>
      </section>

      <section className="below-grid animate-in">
        <article className="residents-card">
          <div className="section-heading"><div><p className="eyebrow">THE LITTLE CREW</p><h2>Who's around?</h2></div><button className="text-button" onClick={() => setShowRoster((value) => !value)}>{showRoster ? 'Hide list' : 'Show all'} <span>{showRoster ? '↑' : '↓'}</span></button></div>
          {showRoster && <div className="resident-list">{characters.map((person, index) => <button className={'resident-row ' + (selected.id === person.id ? 'selected' : '')} key={person.id} onClick={() => setSelected(person)}><span className="avatar" style={{ '--avatar': person.shirt, '--skin': person.color, '--hair': person.hair }}><span className="avatar-hair" /><span className="avatar-face"><i /><i /></span><span className="avatar-body" /></span><span className="resident-info"><strong>{person.name}</strong><small>{person.role} · {person.station}</small></span><span className="resident-status"><i /> roaming</span><span className="row-arrow">↗</span></button>)}</div>}
          <div className="resident-note"><span>✿</span><p><strong>{selected.name} says</strong><br />“{selected.mood}. Let's take it slow today.”</p><span className="note-sparkle">✦</span></div>
        </article>
        <aside className="side-stack">
          <article className="note-card">
            <div className="note-card-top"><span className="small-sun">☼</span><span className="eyebrow">A GENTLE REMINDER</span></div>
            <h2>You don't have to<br /><em>be productive</em><br />all the time.</h2>
            <p>Sometimes it's enough to make something just because it makes you happy.</p>
            <div className="little-flower">✿</div>
          </article>
          <article className="controls-card"><p className="eyebrow">TAKE A LOOK AROUND</p><div className="control-line"><span className="keycap">↔</span><span>Drag to rotate</span></div><div className="control-line"><span className="keycap">⌕</span><span>Scroll to zoom</span></div><div className="control-line"><span className="keycap">⇧</span><span>Right-drag to pan</span></div><button className="wide-button" onClick={() => { setActiveRoom('all'); office.current?.resetView(); }}>Back to the whole office <span>↗</span></button></article>
        </aside>
      </section>
      <footer className="footer"><span>little office <b>♡</b></span><span>Built for no reason other than joy.</span><span>Take it easy today.</span></footer>
    </main>
  );
}