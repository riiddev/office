import React, { useMemo } from 'react';
import Office3D from '../ruang/pages/Office3D.tsx';
import { agents } from '../data/characters.js';

const stateByStatus = {
  working: 'Working',
  review: 'Reviewing',
  idle: 'Idle',
  blocked: 'Unknown',
  queued: 'Unknown',
};

export default function RuangOffice({ night = false, focusRoom = 'all', onSelectAgent, simulationNow = Date.now(), simulationRate = 60 }) {
  const stations = useMemo(() => agents.map((agent, index) => ({
    id: agent.id,
    name: agent.id === 'boss' ? 'Riiddev · Boss' : agent.name,
    role: agent.role,
    room: agent.status === 'idle' ? 'Lounge' : 'Workspace',
    roomPosition: 'desk',
    state: stateByStatus[agent.status] || 'Unknown',
    currentTask: agent.task,
    recentActivity: agent.mood,
    activity: ['working', 'review'].includes(agent.status) ? agent.task : '',
    seat: index + 1,
    provenance: 'Illustrative demo data',
    freshness: 'Simulated',
    displayState: ({ blocked: 'Blocked', queued: 'Queued' })[agent.status] || undefined,
  })), []);
  return (
    <div className="v-ruang-host">
      <Office3D
        stations={stations}
        themeOverride={night ? 'dark' : 'light'}
        focusRoom={focusRoom}
        simulationNow={simulationNow}
        simulationRate={simulationRate}
        onSelect={(station) => onSelectAgent?.(station.id)}
      />
    </div>
  );
}
