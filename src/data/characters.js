export const agents = [
  { id:'forge', name:'Forge', role:'Coding agent', provider:'OpenCode', status:'working', task:'Refactoring the landing page', taskId:'DEV-014', progress:68, station:'Studio', room:'studio', color:'#d9a77c', shirt:'#5f8b7b', hair:'#3e302d', mood:'Focused on a code change', description:'Handles implementation work and code edits.' },
  { id:'scout', name:'Scout', role:'Research agent', provider:'OpenClaw', status:'review', task:'Summarizing reference material', taskId:'RES-008', progress:92, station:'Meeting room', room:'studio', color:'#edc6a2', shirt:'#d6ae60', hair:'#9a6246', mood:'Waiting for a review', description:'Collects context and prepares concise research notes.' },
  { id:'pixel', name:'Pixel', role:'Design agent', provider:'Demo agent', status:'idle', task:'Waiting for the next task', taskId:null, progress:0, station:'Lounge', room:'lounge', color:'#f0c39f', shirt:'#bd87b4', hair:'#5d3b34', mood:'Taking a little break', description:'Helps explore visual directions and interface details.' },
  { id:'orbit', name:'Orbit', role:'Automation agent', provider:'Demo agent', status:'idle', task:'No scheduled run in this preview', taskId:null, progress:0, station:'Pantry', room:'pantry', color:'#e9a16f', shirt:'#e57959', hair:'#513d37', mood:'Recharging before the next run', description:'Represents repeatable workflows and scheduled routines.' },
  { id:'guard', name:'Guard', role:'Quality agent', provider:'Demo agent', status:'blocked', task:'Waiting for a dependency', taskId:'QA-003', progress:35, station:'Game room', room:'games', color:'#b87d5f', shirt:'#7392c1', hair:'#342a28', mood:'Paused until a dependency is ready', description:'Represents checks, review gates and quality follow-ups.' },
];

// Compatibility alias used by the existing procedural 3D scene.
export const characters = agents;
