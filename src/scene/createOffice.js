import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import gsap from 'gsap';
import { agents, characters } from '../data/characters.js';

const material = (color, roughness = 0.85, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness, ...extra });

export function createOffice(host, { onSelect } = {}) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#d8d9cc');
  scene.fog = new THREE.Fog('#d8d9cc', 45, 86);

  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
  camera.position.set(34, 26, 40);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.82;
  renderer.domElement.className = 'office-canvas';
  host.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.minDistance = 12;
  controls.maxDistance = 60;
  controls.maxPolarAngle = Math.PI * 0.47;
  controls.target.set(0, 1.0, 4.7);

  scene.add(new THREE.HemisphereLight('#fff7eb', '#65715d', 1.05));
  const sun = new THREE.DirectionalLight('#fff1da', 1.85);
  sun.position.set(-7, 15, 8);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -24;
  sun.shadow.camera.right = 24;
  sun.shadow.camera.top = 22;
  sun.shadow.camera.bottom = -22;
  sun.shadow.bias = -0.0003;
  scene.add(sun);

  const warmFill = new THREE.PointLight('#ffd5a0', 0.2, 18);
  warmFill.position.set(0, 5, 0);
  scene.add(warmFill);

  const mats = {
    grass: material('#93a57d'),
    floor: material('#cdbda2'),
    wall: material('#dfd4c3'),
    wood: material('#b77e52'),
    woodLight: material('#c89a68'),
    darkWood: material('#80563d'),
    green: material('#88a47d'),
    leaf: material('#5f8966'),
    leafLight: material('#9aba83'),
    fabric: material('#cdb095'),
    sofa: material('#76958a'),
    terracotta: material('#d68c6a'),
    cream: material('#faf4e7'),
    metal: material('#6d7777', 0.38, { metalness: 0.4 }),
    screen: material('#253d42', 0.3, { emissive: '#6a9d9c', emissiveIntensity: 0.28 }),
    glass: new THREE.MeshStandardMaterial({ color: '#a9c7c0', roughness: 0.15, metalness: 0.1, transparent: true, opacity: 0.33 }),
    bathTile: material('#e3e8dd', 0.7),
    poolWater: material('#76bdbb', 0.22, { metalness: 0.16, transparent: true, opacity: 0.92 }),
    lamp: new THREE.MeshStandardMaterial({ color: '#ffdf99', emissive: '#ffc45f', emissiveIntensity: 0.45 }),
    white: material('#fffaf1'),
    navy: material('#384c55'),
  };

  const box = (parent, name, size, pos, mat, opts = {}) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(size[0], size[1], size[2]), mat);
    mesh.name = name || '';
    mesh.position.set(pos[0], pos[1], pos[2]);
    mesh.castShadow = opts.castShadow !== false;
    mesh.receiveShadow = opts.receiveShadow !== false;
    if (opts.rotation) mesh.rotation.set(opts.rotation[0], opts.rotation[1], opts.rotation[2]);
    parent.add(mesh);
    return mesh;
  };
  const sphere = (parent, name, radius, pos, mat, scale = [1, 1, 1]) => {
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 12, 9), mat);
    mesh.name = name || '';
    mesh.position.set(pos[0], pos[1], pos[2]);
    mesh.scale.set(scale[0], scale[1], scale[2]);
    mesh.castShadow = true;
    parent.add(mesh);
    return mesh;
  };
  const cylinder = (parent, name, rt, rb, h, pos, mat, sides = 10) => {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, sides), mat);
    mesh.name = name || '';
    mesh.position.set(pos[0], pos[1], pos[2]);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  };
  const group = (parent, name, pos = [0, 0, 0]) => {
    const g = new THREE.Group();
    g.name = name;
    g.position.set(pos[0], pos[1], pos[2]);
    parent.add(g);
    return g;
  };

  // Floating patch of grass and a slightly raised wooden floor.
  box(scene, 'garden platform', [48, 0.36, 38], [0, -0.28, 4.0], mats.grass);
  box(scene, 'wood floor', [32, 0.22, 19.4], [0, -0.02, 1.25], mats.floor);
  box(scene, 'front step', [8.5, 0.22, 0.82], [0, -0.12, 11.25], mats.woodLight);
  // Wide circulation spine connects the office zones without squeezing agents.
  box(scene, 'central corridor runner', [28.5, 0.035, 2.0], [0, 0.105, 0.75], material('#b8b29b'));
  box(scene, 'garden path to pool', [5.4, 0.06, 4.2], [14.2, 0.025, 12.25], material('#b8b29b'));

  // Expanded dollhouse shell: the front stays open, with a wider wing for the team.
  box(scene, 'back wall', [32, 4.3, 0.22], [0, 2.1, -8.22], mats.wall);
  box(scene, 'left wall', [0.22, 4.3, 19.4], [-16.02, 2.1, 1.25], mats.wall);
  box(scene, 'right low wall', [0.22, 1.3, 19.4], [16.02, 0.65, 1.25], mats.wall);
  box(scene, 'back wood trim', [32.2, 0.2, 0.32], [0, 4.22, -8.18], mats.woodLight);
  box(scene, 'left wood trim', [0.32, 0.2, 19.5], [-16.02, 4.22, 1.25], mats.woodLight);
  box(scene, 'right wood trim', [0.32, 0.2, 19.5], [16.02, 4.22, 1.25], mats.woodLight);

  // A wider window wall makes the office feel bright instead of boxed in.
  box(scene, 'window glass', [10.8, 2.45, 0.09], [-3.1, 2.55, -8.04], mats.glass, { castShadow: false });
  for (let i = 0; i < 6; i++) box(scene, 'window mullion', [0.09, 2.55, 0.12], [-8.05 + i * 2.0, 2.55, -7.94], mats.woodLight);
  box(scene, 'window sill', [10.95, 0.12, 0.22], [-3.1, 1.25, -7.87], mats.wood);
  const landscape = group(scene, 'outside landscape', [0, 0, -10.1]);
  sphere(landscape, 'hill', 3.5, [-5, 0.7, 0], material('#d4cf9c'), [1.4, 0.35, 0.14]);
  sphere(landscape, 'hill', 4, [1.5, 0.5, -0.1], material('#a7bd96'), [1.1, 0.35, 0.14]);
  sphere(landscape, 'hill', 3, [6, 0.8, 0], material('#e4c49b'), [1.4, 0.35, 0.14]);

  // Structural accent beams and a few indoor plants.
  box(scene, 'beam one', [0.12, 3.9, 0.14], [-11.8, 2, -7.24], mats.wood);
  box(scene, 'beam two', [0.12, 3.9, 0.14], [2.7, 2, -7.24], mats.wood);
  const plantLeaves = [];
  const addPlant = (x, z, size = 1) => {
    const p = group(scene, 'potted plant', [x, 0.12, z]);
    cylinder(p, 'pot', 0.25 * size, 0.3 * size, 0.42 * size, [0, 0.21 * size, 0], mats.terracotta);
    cylinder(p, 'soil', 0.22 * size, 0.22 * size, 0.04 * size, [0, 0.43 * size, 0], mats.darkWood);
    for (let i = 0; i < 5; i++) {
      const angle = i * Math.PI * 0.4;
      const leaf = sphere(p, 'leaf', 0.22 * size, [Math.cos(angle) * 0.18 * size, (0.68 + (i % 2) * 0.2) * size, Math.sin(angle) * 0.18 * size], i % 2 ? mats.leaf : mats.leafLight, [0.72, 1.45, 0.72]);
      plantLeaves.push({ leaf, phase: plantLeaves.length * 0.9, scale: size });
    }
    cylinder(p, 'stem', 0.035 * size, 0.05 * size, 0.7 * size, [0, 0.72 * size, 0], mats.leaf);
  };
  addPlant(-11.9, -6.45, 1.15);
  addPlant(-11.8, 6.35, 1.18);
  addPlant(11.75, -6.35, 1.05);
  addPlant(11.75, 6.25, 1.12);

  // Work desks, computers, task lights and comfy chairs.
  const makeDesk = (x, z, accent, label) => {
    const d = group(scene, label + ' desk', [x, 0, z]);
    box(d, 'desktop', [2.5, 0.16, 1.15], [0, 1.05, 0], mats.woodLight);
    box(d, 'desk front', [2.2, 0.6, 0.12], [0, 0.72, 0.48], mats.wood);
    for (const sx of [-1.03, 1.03]) for (const sz of [-0.4, 0.4]) box(d, 'desk leg', [0.1, 0.9, 0.1], [sx, 0.48, sz], mats.darkWood);
    box(d, 'monitor body', [0.92, 0.66, 0.1], [0, 1.52, -0.29], mats.navy);
    box(d, 'monitor glow', [0.78, 0.5, 0.025], [0, 1.54, -0.225], new THREE.MeshStandardMaterial({ color: accent, emissive: accent, emissiveIntensity: 0.42, roughness: 0.28 }));
    box(d, 'monitor stand', [0.1, 0.21, 0.1], [0, 1.15, -0.29], mats.metal);
    box(d, 'keyboard', [0.68, 0.04, 0.22], [0, 1.16, 0.1], mats.cream);
    box(d, 'desk mat', [0.94, 0.025, 0.52], [0.02, 1.145, 0.12], mats.sofa);
    cylinder(d, 'mug', 0.075, 0.08, 0.16, [0.87, 1.23, 0.23], mats.cream, 12);
    const chair = group(d, 'chair', [0, 0, 1.04]);
    box(chair, 'seat', [0.76, 0.16, 0.7], [0, 0.68, 0], mats.sofa);
    box(chair, 'back', [0.76, 0.78, 0.15], [0, 1.05, 0.28], mats.sofa);
    cylinder(chair, 'chair post', 0.07, 0.07, 0.58, [0, 0.34, 0], mats.metal);
    for (const sx of [-0.25, 0.25]) box(chair, 'chair foot', [0.1, 0.08, 0.54], [sx, 0.06, 0], mats.metal);
    return d;
  };
  makeDesk(-6.7, -2.45, '#e8ae77', 'Creative');
  makeDesk(-3.5, -2.45, '#8fc3b5', 'Developer');
  makeDesk(-0.25, -2.45, '#b8a5dd', 'Designer');
  makeDesk(3.0, -5.9, '#e6b172', 'Research pod');
  makeDesk(6.05, -5.9, '#83a8d3', 'Design pod');
  makeDesk(9.1, -5.9, '#80b6a4', 'Operations pod');

  // New west wing: enclosed focus studio / library with its own furniture.
  // A broad doorway stays open on the east side so both coworkers and boss can enter.
  const focusStudio = group(scene, 'focus studio wing', [-13.1, 0, -2.4]);
  box(focusStudio, 'focus studio rug', [5.15, 0.06, 5.35], [0, 0.08, 0], material('#c8b69a'));
  box(focusStudio, 'focus studio back wall', [5.45, 2.5, 0.15], [0, 1.25, -2.75], mats.wall);
  box(focusStudio, 'focus studio left wall', [0.15, 2.5, 5.45], [-2.68, 1.25, 0], mats.wall);
  box(focusStudio, 'focus studio east wall upper left', [0.15, 2.5, 1.1], [2.68, 1.25, -2.2], mats.wall);
  box(focusStudio, 'focus studio east wall upper right', [0.15, 2.5, 1.1], [2.68, 1.25, 2.2], mats.wall);
  box(focusStudio, 'focus studio south wall left', [1.25, 2.3, 0.15], [-2.05, 1.15, 2.68], mats.wall);
  box(focusStudio, 'focus studio south wall right', [1.25, 2.3, 0.15], [2.05, 1.15, 2.68], mats.wall);
  box(focusStudio, 'focus studio door lintel', [0.16, 0.18, 3.3], [2.68, 2.44, 0], mats.woodLight);

  // Built-in bookcases, repeated spines and a proper reading / planning table.
  for (const shelfX of [-1.55, 1.55]) {
    box(focusStudio, 'library bookcase frame', [1.05, 1.95, 0.42], [shelfX, 1.02, -2.15], mats.wood);
    for (let row = 0; row < 3; row++) {
      box(focusStudio, 'bookcase shelf', [0.96, 0.07, 0.45], [shelfX, 0.5 + row * 0.58, -1.9], mats.woodLight);
      for (let book = 0; book < 5; book++) {
        const colors = [mats.terracotta, mats.leaf, mats.navy, mats.lamp, mats.fabric];
        box(focusStudio, 'book spine', [0.12, 0.31 + (book % 2) * 0.06, 0.17],
          [shelfX - 0.36 + book * 0.18, 0.69 + row * 0.58, -1.88], colors[(book + row) % colors.length]);
      }
    }
  }
  box(focusStudio, 'focus studio worktable', [1.75, 0.14, 0.9], [-0.8, 0.94, 0.15], mats.woodLight);
  for (const x of [-1.48, -0.12]) for (const z of [-0.15, 0.45]) {
    box(focusStudio, 'focus table leg', [0.08, 0.86, 0.08], [x, 0.43, z], mats.darkWood);
  }
  box(focusStudio, 'open notebook', [0.48, 0.035, 0.34], [-0.9, 1.035, 0.12], mats.cream);
  box(focusStudio, 'notebook page line', [0.3, 0.012, 0.018], [-0.9, 1.06, 0.12], mats.terracotta);
  box(focusStudio, 'table lamp base', [0.22, 0.06, 0.22], [-0.2, 1.06, 0.15], mats.metal);
  cylinder(focusStudio, 'table lamp stem', 0.025, 0.025, 0.28, [-0.2, 1.21, 0.15], mats.metal, 8);
  cylinder(focusStudio, 'table lamp shade', 0.13, 0.2, 0.15, [-0.2, 1.39, 0.15], mats.lamp, 10);
  const focusChair = group(focusStudio, 'focus studio chair', [-0.8, 0, 1.12]);
  box(focusChair, 'focus chair seat', [0.62, 0.14, 0.58], [0, 0.55, 0], mats.sofa);
  box(focusChair, 'focus chair back', [0.62, 0.66, 0.14], [0, 0.91, 0.22], mats.sofa);
  cylinder(focusChair, 'focus chair stem', 0.055, 0.055, 0.45, [0, 0.27, 0], mats.metal, 8);
  addPlant(-10.9, -4.45, 0.6);
  box(scene, 'focus studio sign', [2.15, 0.38, 0.08], [-13.1, 2.68, -5.22], mats.navy);
  box(scene, 'focus studio sign highlight', [1.1, 0.035, 0.035], [-13.1, 2.69, -5.16], mats.lamp);

  // Extra landscaping around the enlarged site edges.
  addPlant(-20.0, -5.8, 1.25);
  addPlant(-20.2, 4.8, 1.1);
  addPlant(22.0, 6.5, 1.2);
  addPlant(22.1, 19.0, 1.15);

  // A shared wall board for sprint notes and a room-wide planning surface.
  box(scene, 'sprint board frame', [4.2, 1.85, 0.16], [6.7, 2.45, -8.0], mats.wood);
  box(scene, 'sprint board', [3.95, 1.6, 0.045], [6.7, 2.45, -7.89], mats.cream);
  for (let i = 0; i < 4; i++) {
    box(scene, 'sprint note', [0.55, 0.32, 0.025], [5.45 + (i % 2) * 0.85, 2.55 + Math.floor(i / 2) * 0.48, -7.85],
      [mats.terracotta, mats.leafLight, mats.lamp, mats.glass][i]);
  }
  box(scene, 'sprint marker rail', [2.5, 0.055, 0.05], [6.7, 1.63, -7.85], mats.metal);

  // Extra team wing: conference table, rolling chairs, and a place to brainstorm.
  const warRoom = group(scene, 'war room', [11.0, 0, 3.15]);
  box(warRoom, 'war room rug', [3.6, 0.055, 3.5], [0, 0.11, 0], material('#c9d3bd'));
  // Keep the conference set compact and aligned to the room rug—no chairs
  // spilling into the dining entrance or the central walkway.
  cylinder(warRoom, 'conference table top', 1.08, 1.08, 0.16, [0, 0.96, 0], mats.woodLight, 32);
  cylinder(warRoom, 'conference table foot', 0.24, 0.33, 0.84, [0, 0.49, 0], mats.darkWood, 16);
  for (let i = 0; i < 5; i++) {
    const a = i * Math.PI * 2 / 5;
    const chair = group(warRoom, 'meeting chair', [Math.cos(a) * 1.22, 0, Math.sin(a) * 1.12]);
    box(chair, 'chair seat', [0.52, 0.15, 0.5], [0, 0.57, 0], [mats.sofa, mats.terracotta, mats.navy, mats.leaf, mats.fabric][i]);
    box(chair, 'chair back', [0.52, 0.68, 0.12], [0, 0.93, -0.18], [mats.sofa, mats.terracotta, mats.navy, mats.leaf, mats.fabric][i]);
    cylinder(chair, 'chair stem', 0.06, 0.06, 0.48, [0, 0.27, 0], mats.metal, 8);
    box(chair, 'chair base', [0.44, 0.06, 0.42], [0, 0.06, 0], mats.metal);
  }
  box(warRoom, 'team screen frame', [1.55, 1.04, 0.12], [0, 1.75, -1.32], mats.navy);
  box(warRoom, 'team screen', [1.35, 0.82, 0.035], [0, 1.77, -1.24], material('#9ed1c0', 0.25, { emissive: '#5b9f8e', emissiveIntensity: 0.38 }));
  addPlant(12.05, 5.75, 0.65);

  // The old loose pouf/table cluster was removed from the circulation spine.
  // The lounge and conference room are the dedicated social zones now.

  // Cozy lounge: sofa, cushions, coffee table, rug, books and standing lamp.
  const lounge = group(scene, 'lounge', [5.9, 0, -2.0]);
  box(lounge, 'rug', [5.3, 0.055, 3.4], [0, 0.12, 0], material('#d8bfa3'));
  box(lounge, 'sofa base', [3.5, 0.55, 1.16], [0, 0.5, -0.45], mats.sofa);
  box(lounge, 'sofa back', [3.5, 1.05, 0.28], [0, 0.98, -0.95], mats.sofa);
  box(lounge, 'sofa arm', [0.3, 0.75, 1.15], [-1.58, 0.66, -0.42], mats.sofa);
  box(lounge, 'sofa arm', [0.3, 0.75, 1.15], [1.58, 0.66, -0.42], mats.sofa);
  box(lounge, 'cushion', [0.82, 0.16, 0.6], [-0.88, 0.83, -0.44], mats.fabric);
  box(lounge, 'cushion', [0.82, 0.16, 0.6], [0.05, 0.83, -0.44], mats.terracotta);
  box(lounge, 'cushion', [0.82, 0.16, 0.6], [0.92, 0.83, -0.44], mats.cream);
  box(lounge, 'coffee table', [2, 0.16, 0.94], [0, 0.55, 0.95], mats.woodLight);
  for (const x of [-0.78, 0.78]) for (const z of [0.64, 1.26]) box(lounge, 'coffee table leg', [0.08, 0.44, 0.08], [x, 0.3, z], mats.darkWood);
  box(lounge, 'book one', [0.6, 0.07, 0.38], [-0.43, 0.67, 0.94], material('#d68d65'));
  box(lounge, 'book two', [0.55, 0.07, 0.35], [-0.39, 0.75, 0.92], material('#7e9a81'));
  const lamp = group(lounge, 'floor lamp', [2.1, 0, -0.5]);
  cylinder(lamp, 'lamp base', 0.3, 0.3, 0.1, [0, 0.18, 0], mats.metal);
  cylinder(lamp, 'lamp pole', 0.045, 0.045, 2.1, [0, 1.23, 0], mats.metal);
  cylinder(lamp, 'lamp shade', 0.28, 0.43, 0.42, [0, 2.38, 0], mats.lamp, 12);

  // Gaming nook with arcade cabinet and a tiny console screen.
  const game = group(scene, 'game room', [6.2, 0, 2.7]);
  box(game, 'game rug', [4.8, 0.055, 3.1], [0, 0.12, 0], material('#c6b5a1'));
  for (let i = 0; i < 2; i++) {
    const x = -1.15 + i * 1.7;
    box(game, 'arcade base', [0.85, 1.45, 0.62], [x, 0.9, -0.95], i ? mats.terracotta : mats.navy);
    box(game, 'arcade screen frame', [0.6, 0.48, 0.07], [x, 1.25, -0.59], mats.darkWood);
    box(game, 'arcade screen', [0.49, 0.36, 0.025], [x, 1.26, -0.545], material(i ? '#e5ad75' : '#90c2ae', 0.3, { emissive: i ? '#d77d42' : '#4c9882', emissiveIntensity: 0.45 }));
    sphere(game, 'arcade button', 0.06, [x + 0.15, 0.96, -0.54], mats.lamp, [1, 0.4, 1]);
  }
  box(game, 'console screen', [1.35, 0.82, 0.12], [0, 1.14, 1.08], mats.navy);
  box(game, 'console display', [1.13, 0.62, 0.035], [0, 1.15, 1.005], material('#9fc9ad', 0.25, { emissive: '#6d9b8c', emissiveIntensity: 0.35 }));
  box(game, 'console shelf', [1.8, 0.16, 0.5], [0, 0.55, 1.08], mats.woodLight);
  for (let i = 0; i < 2; i++) {
    // Keep the beanbags in the two back corners so the middle walking lane
    // stays open between the arcade cabinets and the console.
    sphere(game, 'bean bag', 0.48, [i ? 1.85 : -1.85, 0.36, 1.05], i ? mats.terracotta : mats.sofa, [1.0, 0.68, 1.0]);
  }

  // Pantry with fridge, counter, coffee machine and tiny galon.
  const pantry = group(scene, 'pantry', [-6.2, 0, 2.5]);
  box(pantry, 'counter', [3.8, 0.88, 1.15], [0, 0.59, -0.2], mats.woodLight);
  box(pantry, 'counter top', [4, 0.12, 1.28], [0, 1.07, -0.2], mats.cream);
  box(pantry, 'cabinet', [0.82, 1.9, 0.8], [-1.2, 1.08, -1.15], mats.white);
  box(pantry, 'fridge door', [0.66, 1.55, 0.1], [-1.2, 1.17, -0.71], material('#c4d0ca'));
  box(pantry, 'fridge handle', [0.04, 0.55, 0.06], [-0.93, 1.2, -0.63], mats.metal);
  box(pantry, 'coffee machine', [0.62, 0.72, 0.5], [0.25, 1.45, -0.18], mats.navy);
  box(pantry, 'coffee machine panel', [0.37, 0.3, 0.045], [0.25, 1.51, 0.08], mats.lamp);
  cylinder(pantry, 'mug', 0.1, 0.11, 0.16, [0.65, 1.23, -0.05], mats.terracotta, 12);
  cylinder(pantry, 'water jug', 0.22, 0.24, 0.58, [1.25, 1.39, -0.2], material('#a9ced0', 0.25, { transparent: true, opacity: 0.78 }), 12);
  cylinder(pantry, 'galon stand', 0.26, 0.26, 0.55, [1.25, 0.62, -0.2], mats.white, 12);
  box(pantry, 'galon tap', [0.16, 0.08, 0.17], [1.25, 0.79, 0.07], mats.navy);

  // Bathroom suite with a real doorway, glass shower, vanity and toilet.
  const bathroom = group(scene, 'bathroom suite', [-10.5, 0, 5.0]);
  box(bathroom, 'bathroom tile floor', [4.0, 0.08, 4.1], [0, 0.04, 0], mats.bathTile);
  box(bathroom, 'bathroom back wall', [4.2, 2.5, 0.16], [0, 1.25, -2.0], mats.wall);
  box(bathroom, 'bathroom left wall', [0.16, 2.5, 4.1], [-2.02, 1.25, 0], mats.wall);
  box(bathroom, 'bathroom right wall', [0.16, 2.5, 4.1], [2.02, 1.25, 0], mats.wall);
  box(bathroom, 'bathroom entry left', [1.15, 2.5, 0.16], [-1.43, 1.25, 1.98], mats.wall);
  box(bathroom, 'bathroom entry right', [1.15, 2.5, 0.16], [1.43, 1.25, 1.98], mats.wall);
  // Compact shower cubicle; see-through glass keeps the miniature readable.
  box(bathroom, 'shower tray', [1.35, 0.12, 1.28], [-1.2, 0.14, -1.18], material('#c5d8d1'));
  box(bathroom, 'shower rear glass', [1.35, 1.9, 0.045], [-1.2, 1.1, -1.82], mats.glass);
  box(bathroom, 'shower side glass', [0.045, 1.9, 1.3], [-1.86, 1.1, -1.18], mats.glass);
  cylinder(bathroom, 'shower head', 0.09, 0.11, 0.09, [-1.68, 2.05, -1.74], mats.metal, 12);
  cylinder(bathroom, 'shower rail', 0.025, 0.025, 1.2, [-1.7, 1.52, -1.73], mats.metal, 8);
  // Toilet and cistern.
  box(bathroom, 'toilet cistern', [0.52, 0.7, 0.28], [0.95, 0.47, -1.37], mats.white);
  sphere(bathroom, 'toilet bowl', 0.36, [0.95, 0.3, -0.83], mats.white, [0.88, 0.8, 1.05]);
  cylinder(bathroom, 'toilet seat', 0.28, 0.32, 0.055, [0.95, 0.49, -0.83], mats.metal, 20);
  // Vanity with a basin and mirror.
  box(bathroom, 'bathroom vanity', [1.15, 0.72, 0.58], [0.85, 0.48, 0.62], mats.woodLight);
  box(bathroom, 'bathroom vanity top', [1.27, 0.12, 0.68], [0.85, 0.88, 0.62], mats.white);
  sphere(bathroom, 'bathroom basin', 0.25, [0.85, 0.96, 0.62], material('#c8d8d2'), [1.35, 0.35, 1]);
  box(bathroom, 'bathroom mirror frame', [0.92, 1.08, 0.1], [0.85, 1.6, -1.88], mats.wood);
  box(bathroom, 'bathroom mirror', [0.78, 0.9, 0.035], [0.85, 1.61, -1.815], mats.glass);
  cylinder(bathroom, 'vanity tap', 0.035, 0.035, 0.22, [0.85, 1.08, 0.38], mats.metal, 8);
  box(scene, 'bathroom sign', [1.15, 0.34, 0.07], [-9.0, 2.08, 6.93], mats.navy);
  box(scene, 'bathroom sign inlay', [0.6, 0.035, 0.035], [-9.0, 2.08, 6.88], mats.lamp);

  // Partitioned dining room: dining table, chairs, plates, fruit and a serving counter.
  const dining = group(scene, 'dining room', [4.7, 0, 6.08]);
  box(dining, 'dining zone rug', [6.6, 0.06, 3.15], [0, 0.09, 0], material('#d8cbb3'));
  // Wider glass-and-wood walls leave proper walking clearance around the table.
  box(dining, 'dining side left lower', [0.16, 1.45, 2.65], [-3.45, 0.75, 0.12], mats.wood);
  box(dining, 'dining side left glass', [0.055, 0.82, 2.65], [-3.45, 1.86, 0.12], mats.glass);
  box(dining, 'dining side right lower', [0.16, 1.45, 2.65], [3.45, 0.75, 0.12], mats.wood);
  box(dining, 'dining side right glass', [0.055, 0.82, 2.65], [3.45, 1.86, 0.12], mats.glass);
  box(dining, 'dining rear left lower', [1.4, 1.45, 0.16], [-1.4, 0.75, -1.42], mats.wood);
  box(dining, 'dining rear left glass', [1.4, 0.82, 0.055], [-1.4, 1.86, -1.42], mats.glass);
  box(dining, 'dining rear right lower', [1.4, 1.45, 0.16], [1.4, 0.75, -1.42], mats.wood);
  box(dining, 'dining rear right glass', [1.4, 0.82, 0.055], [1.4, 1.86, -1.42], mats.glass);
  box(dining, 'dining tabletop', [2.15, 0.16, 1.15], [0, 0.93, 0.05], mats.woodLight);
  for (const x of [-0.88, 0.88]) for (const z of [-0.37, 0.42]) box(dining, 'dining table leg', [0.12, 0.84, 0.12], [x, 0.43, z], mats.darkWood);
  const diningChairs = [
    [-1.53, 0.08, 0], [1.53, 0.08, 0], [-0.8, 0.08, -1.0], [0.8, 0.08, -1.0],
    [-0.8, 0.08, 1.08], [0.8, 0.08, 1.08]
  ];
  diningChairs.forEach(([x, y, z], i) => {
    const seat = group(dining, 'dining chair', [x, y, z]);
    const fabric = [mats.sofa, mats.terracotta, mats.navy, mats.leaf, mats.fabric, mats.wood][i];
    box(seat, 'dining chair seat', [0.58, 0.13, 0.55], [0, 0.48, 0], fabric);
    box(seat, 'dining chair back', [0.58, 0.68, 0.13], [0, 0.84, -0.22], fabric);
    for (const lx of [-0.22, 0.22]) for (const lz of [-0.2, 0.2]) box(seat, 'dining chair leg', [0.055, 0.43, 0.055], [lx, 0.22, lz], mats.metal);
  });
  cylinder(dining, 'dinner plate one', 0.23, 0.24, 0.025, [-0.55, 1.03, 0.05], mats.white, 20);
  cylinder(dining, 'dinner plate two', 0.23, 0.24, 0.025, [0.55, 1.03, 0.05], mats.white, 20);
  cylinder(dining, 'fruit bowl', 0.22, 0.29, 0.13, [0, 1.07, -0.24], mats.terracotta, 16);
  for (let i = 0; i < 4; i++) sphere(dining, 'fruit', 0.08, [-0.12 + (i % 2) * 0.13, 1.18, -0.29 + Math.floor(i / 2) * 0.1], [mats.terracotta, mats.lamp, mats.leaf, mats.cream][i]);
  box(dining, 'serving sideboard', [1.1, 0.8, 0.54], [1.65, 0.45, -0.85], mats.wood);
  box(dining, 'serving counter top', [1.18, 0.1, 0.6], [1.65, 0.9, -0.85], mats.cream);
  addPlant(1.85, 6.25, 0.65);

  // Outdoor pool deck next to the HQ entrance.
  const poolDeck = group(scene, 'pool deck', [17.0, 0, 15.5]);
  box(poolDeck, 'pool patio', [8.1, 0.16, 6.0], [0, -0.04, 0], material('#d8c8ab'));
  box(poolDeck, 'pool basin', [5.15, 0.42, 3.35], [0, 0.17, -0.1], material('#668f96'));
  box(poolDeck, 'pool water', [4.73, 0.055, 2.92], [0, 0.4, -0.1], mats.poolWater);
  // Pale coping pieces make the water edge legible in the dollhouse view.
  box(poolDeck, 'pool coping front', [5.32, 0.12, 0.18], [0, 0.45, 1.57], mats.cream);
  box(poolDeck, 'pool coping back', [5.32, 0.12, 0.18], [0, 0.45, -1.76], mats.cream);
  box(poolDeck, 'pool coping left', [0.18, 0.12, 3.3], [-2.57, 0.45, -0.1], mats.cream);
  box(poolDeck, 'pool coping right', [0.18, 0.12, 3.3], [2.57, 0.45, -0.1], mats.cream);
  const poolRipples = [];
  for (let i = 0; i < 4; i++) {
    const ripple = new THREE.Mesh(new THREE.TorusGeometry(0.18 + i * 0.07, 0.012, 4, 24), material('#b9e5df', 0.25, { transparent: true, opacity: 0.65 }));
    ripple.rotation.x = -Math.PI / 2;
    ripple.position.set(-0.85 + i * 0.55, 0.45, -0.3 + (i % 2) * 0.55);
    ripple.name = 'pool ripple';
    poolDeck.add(ripple);
    poolRipples.push({ ripple, phase: i * 1.45 });
  }
  // Ladder at the corner.
  for (let i = 0; i < 2; i++) cylinder(poolDeck, 'pool ladder rail', 0.035, 0.035, 0.95, [2.18 + i * 0.3, 0.73, 1.12], mats.metal, 8);
  for (let i = 0; i < 3; i++) cylinder(poolDeck, 'pool ladder step', 0.03, 0.03, 0.3, [2.18 + i * 0.15, 0.42 + i * 0.18, 1.12], mats.metal, 8);
  // Sunbeds and parasol on the dry side, away from the water.
  for (const x of [-3.35, 3.35]) {
    const bed = group(poolDeck, 'sun lounger', [x, 0, 0.95]);
    box(bed, 'lounger cushion', [1.35, 0.13, 0.55], [0, 0.34, 0], mats.fabric);
    box(bed, 'lounger back', [0.65, 0.1, 0.5], [0, 0.56, -0.2], mats.sofa, { rotation: [-0.18, 0, 0] });
    for (const lx of [-0.48, 0.48]) box(bed, 'lounger feet', [0.08, 0.28, 0.08], [lx, 0.18, 0], mats.metal);
  }
  cylinder(poolDeck, 'parasol pole', 0.035, 0.035, 2.1, [-3.55, 1.05, -1.45], mats.metal, 8);
  const parasol = cylinder(poolDeck, 'parasol canopy', 0.25, 1.25, 0.38, [-3.55, 2.0, -1.45], material('#dca979'), 16);
  parasol.scale.z = 1.1;
  addPlant(15.0, 10.8, 0.8);

  // An actual translucent divider separates the lounge from the game nook.
  // The center opening stays wide enough for walking routes.
  const loungeGameDivider = group(scene, 'lounge and game room divider');
  for (const [x, width] of [[3.95, 1.4], [8.0, 1.4]]) {
    box(loungeGameDivider, 'divider wood lower panel', [width, 1.3, 0.14], [x, 0.76, 1.04], mats.wood);
    box(loungeGameDivider, 'divider glass upper panel', [width, 0.82, 0.055], [x, 1.86, 1.04], mats.glass);
    box(loungeGameDivider, 'divider cap rail', [width + 0.06, 0.07, 0.18], [x, 2.3, 1.04], mats.woodLight);
  }

  // Low glass partitions divide the studio into quieter work pods while keeping sightlines.
  const workDividers = [
    [-5.0, -3.0], [-1.82, -3.0], [1.42, -5.35], [4.56, -5.35], [7.68, -5.35]
  ];
  workDividers.forEach(([x, z], i) => {
    box(scene, 'work pod divider base', [0.11, 0.64, 1.82], [x, 0.36, z], mats.woodLight);
    box(scene, 'work pod divider glass', [0.045, 0.82, 1.82], [x, 1.09, z], mats.glass);
  });

  // Glass-and-wood partitions frame the executive room without closing it off.
  const bossPartitions = group(scene, 'boss office partitions', [-1.65, 0, 3.75]);
  box(bossPartitions, 'boss rear left partition', [2.05, 1.85, 0.13], [-1.58, 1.0, -2.05], mats.wood);
  box(bossPartitions, 'boss rear left glass', [2.05, 0.95, 0.045], [-1.58, 2.38, -2.05], mats.glass);
  box(bossPartitions, 'boss rear right partition', [1.78, 1.85, 0.13], [1.71, 1.0, -2.05], mats.wood);
  box(bossPartitions, 'boss rear right glass', [1.78, 0.95, 0.045], [1.71, 2.38, -2.05], mats.glass);
  box(bossPartitions, 'boss side left partition', [0.13, 1.85, 3.85], [-2.62, 1.0, -0.04], mats.wood);
  box(bossPartitions, 'boss side left glass', [0.045, 0.95, 3.0], [-2.62, 2.38, -0.04], mats.glass);
  box(bossPartitions, 'boss side right rear partition', [0.13, 1.85, 1.05], [2.62, 1.0, -1.35], mats.wood);
  box(bossPartitions, 'boss side right rear glass', [0.045, 0.95, 1.05], [2.62, 2.38, -1.35], mats.glass);
  box(bossPartitions, 'boss side right front partition', [0.13, 1.85, 1.35], [2.62, 1.0, 1.2], mats.wood);
  box(bossPartitions, 'boss side right front glass', [0.045, 0.95, 1.35], [2.62, 2.38, 1.2], mats.glass);

  // A dedicated founder zone: warm rug, executive desk, laptop, guest chairs,
  // and a custom 3D Riiddev avatar based on the supplied character reference.
  const bossZone = group(scene, 'boss office', [-1.65, 0, 3.75]);
  box(bossZone, 'boss area rug', [5.2, 0.055, 3.7], [0, 0.11, -0.25], material('#d8c3a8'));
  box(bossZone, 'executive desk top', [3.65, 0.17, 1.05], [0, 1.05, -1.25], mats.woodLight);
  box(bossZone, 'executive desk front', [3.25, 0.66, 0.13], [0, 0.68, -0.73], mats.wood);
  for (const x of [-1.48, 1.48]) for (const z of [-1.58, -0.96]) box(bossZone, 'executive desk leg', [0.11, 0.88, 0.11], [x, 0.46, z], mats.darkWood);
  box(bossZone, 'executive monitor frame', [1.15, 0.72, 0.1], [0, 1.55, -1.55], mats.navy);
  box(bossZone, 'executive monitor glow', [0.98, 0.55, 0.03], [0, 1.56, -1.49], material('#a4d4be', 0.24, { emissive: '#75b59b', emissiveIntensity: 0.5 }));
  box(bossZone, 'executive monitor stand', [0.12, 0.2, 0.12], [0, 1.17, -1.54], mats.metal);
  box(bossZone, 'boss keyboard', [0.72, 0.04, 0.23], [0, 1.16, -0.95], mats.cream);
  box(bossZone, 'boss desk mat', [1.05, 0.025, 0.55], [0, 1.145, -0.92], mats.navy);
  cylinder(bossZone, 'boss coffee mug', 0.09, 0.1, 0.16, [1.15, 1.22, -0.95], mats.terracotta, 12);
  box(bossZone, 'nameplate', [1.35, 0.25, 0.07], [0, 0.82, -0.65], mats.navy);
  box(bossZone, 'nameplate gold accent', [0.92, 0.035, 0.025], [0, 0.86, -0.605], mats.lamp);
  for (const x of [-2.1, 2.1]) {
    const guest = group(bossZone, 'guest chair', [x, 0, -0.02]);
    box(guest, 'guest chair seat', [0.72, 0.15, 0.67], [0, 0.48, 0], mats.sofa);
    box(guest, 'guest chair back', [0.72, 0.82, 0.15], [0, 0.9, -0.24], mats.sofa);
    cylinder(guest, 'guest chair leg', 0.07, 0.07, 0.44, [0, 0.22, 0], mats.metal, 8);
  }

  // 3D avatar inspired by the reference: black hair, warm skin, navy jacket,
  // cream trousers, monochrome sneakers, and white wired earbuds.
  const bossRoot = group(scene, 'riiddev-founder-avatar', [-1.65, 0, 4.45]);
  bossRoot.userData.character = agents.find((agent) => agent.id === 'boss');
  const bossSkin = material('#ca8b79');
  const bossHair = material('#241f20', 0.92);
  const bossJacket = material('#292c51', 0.72);
  const bossShirt = material('#fffdf7', 0.9);
  const bossPants = material('#f0dfbd', 0.92);
  const bossShoes = material('#1f2224', 0.7);
  const bossSole = material('#fffdf9', 0.85);
  const earbudMat = material('#fffdf9', 0.35);
  const faceInk = material('#261e1d', 0.9);
  const cableMat = material('#fffdf9', 0.38);
  const goldMat = material('#d9b46e', 0.42, { metalness: 0.25 });
  sphere(bossRoot, 'boss pants waist', 0.28, [0, 0.61, 0], bossPants, [1.25, 0.48, 0.9]);
  const bossLegs = [];
  for (const side of [-1, 1]) {
    const leg = group(bossRoot, side < 0 ? 'boss left walking leg' : 'boss right walking leg', [side * 0.155, 0.52, 0]);
    sphere(leg, 'cream trouser', 0.22, [0, -0.18, 0], bossPants, [0.72, 1.38, 0.78]);
    sphere(leg, 'sneaker sole', 0.15, [0, -0.465, 0.115], bossSole, [1.0, 0.34, 1.55]);
    sphere(leg, 'black sneaker', 0.15, [0, -0.41, 0.105], bossShoes, [1.0, 0.58, 1.45]);
    sphere(leg, 'white sneaker toe', 0.1, [0, -0.405, 0.255], bossSole, [1.0, 0.78, 0.9]);
    for (let lace = 0; lace < 2; lace++) box(leg, 'sneaker lace', [0.09, 0.012, 0.018], [0, -0.36 + lace * 0.025, 0.17 + lace * 0.055], bossSole);
    bossLegs.push(leg);
  }
  sphere(bossRoot, 'white tee', 0.37, [0, 0.96, 0.005], bossShirt, [0.83, 1.13, 0.74]);
  sphere(bossRoot, 'navy jacket body', 0.39, [0, 0.98, -0.005], bossJacket, [1.05, 1.08, 0.72]);
  box(bossRoot, 'white shirt panel', [0.23, 0.58, 0.035], [0, 0.96, 0.276], bossShirt);
  box(bossRoot, 'left jacket front', [0.16, 0.62, 0.05], [-0.185, 0.96, 0.265], bossJacket, { rotation: [0, 0, -0.08] });
  box(bossRoot, 'right jacket front', [0.16, 0.62, 0.05], [0.185, 0.96, 0.265], bossJacket, { rotation: [0, 0, 0.08] });
  box(bossRoot, 'jacket zipper', [0.018, 0.48, 0.018], [0, 0.92, 0.305], goldMat);
  const bossArms = [];
  for (const side of [-1, 1]) {
    const arm = group(bossRoot, side < 0 ? 'boss left animated arm' : 'boss right animated arm', [side * 0.35, 1.12, 0.02]);
    sphere(arm, 'jacket shoulder', 0.18, [side * 0.02, 0.05, -0.025], bossJacket, [0.95, 0.92, 0.95]);
    sphere(arm, 'jacket sleeve', 0.16, [side * 0.055, -0.21, 0.015], bossJacket, [0.78, 1.5, 0.78]);
    sphere(arm, 'jacket cuff', 0.11, [-side * 0.03, -0.44, 0.12], bossJacket, [0.9, 0.72, 0.85]);
    sphere(arm, 'boss hand', 0.105, [-side * 0.095, -0.53, 0.185], bossSkin, [0.92, 1.0, 0.8]);
    bossArms.push({ group: arm, side });
  }
  const bossHead = group(bossRoot, 'boss animated head', [0, 0, 0]);
  sphere(bossHead, 'hair silhouette', 0.38, [0, 1.78, -0.02], bossHair, [1.04, 0.94, 0.94]);
  sphere(bossHead, 'face', 0.37, [0, 1.51, 0.075], bossSkin, [0.98, 1.1, 0.87]);
  sphere(bossHead, 'left side hair', 0.15, [-0.32, 1.58, 0.03], bossHair, [0.72, 1.36, 0.98]);
  sphere(bossHead, 'right side hair', 0.15, [0.32, 1.58, 0.03], bossHair, [0.72, 1.36, 0.98]);
  sphere(bossHead, 'front fringe', 0.22, [0, 1.81, 0.2], bossHair, [1.45, 0.48, 0.58]);
  sphere(bossHead, 'left fringe', 0.12, [-0.21, 1.73, 0.24], bossHair, [0.84, 0.7, 0.65]);
  sphere(bossHead, 'right fringe', 0.12, [0.21, 1.73, 0.24], bossHair, [0.84, 0.7, 0.65]);
  for (const x of [-0.36, 0.36]) {
    sphere(bossHead, 'ear', 0.09, [x, 1.52, 0.07], bossSkin, [0.7, 1.1, 0.7]);
    sphere(bossHead, 'white earbud', 0.07, [x * 1.01, 1.54, 0.155], earbudMat, [0.7, 1.25, 0.7]);
    sphere(bossHead, 'earbud stem', 0.025, [x * 1.01, 1.46, 0.18], earbudMat, [0.8, 1.4, 0.8]);
  }
  for (const x of [-0.125, 0.125]) {
    sphere(bossHead, 'eye', 0.034, [x, 1.54, 0.389], faceInk, [1, 1.08, 0.58]);
    sphere(bossHead, 'eye highlight', 0.011, [x - 0.008, 1.553, 0.408], bossSole, [1, 1, 0.6]);
  }
  box(bossHead, 'left eyebrow', [0.17, 0.035, 0.035], [-0.13, 1.655, 0.37], faceInk, { rotation: [0, 0, 0.08] });
  box(bossHead, 'right eyebrow', [0.17, 0.035, 0.035], [0.13, 1.655, 0.37], faceInk, { rotation: [0, 0, -0.08] });
  sphere(bossHead, 'nose', 0.043, [0, 1.465, 0.416], bossSkin, [0.82, 0.9, 0.8]);
  const smileCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.13, 1.385, 0.374), new THREE.Vector3(-0.07, 1.355, 0.395),
    new THREE.Vector3(0, 1.35, 0.4), new THREE.Vector3(0.07, 1.355, 0.395),
    new THREE.Vector3(0.13, 1.385, 0.374)
  ]);
  const smile = new THREE.Mesh(new THREE.TubeGeometry(smileCurve, 14, 0.012, 5, false), faceInk);
  smile.name = 'friendly smile';
  bossHead.add(smile);
  const cableLeft = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.36, 1.46, 0.19), new THREE.Vector3(-0.39, 1.22, 0.19),
    new THREE.Vector3(-0.31, 1.02, 0.26), new THREE.Vector3(-0.15, 0.91, 0.3),
    new THREE.Vector3(0.03, 0.79, 0.31), new THREE.Vector3(0.04, 0.63, 0.27)
  ]);
  const cableRight = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.36, 1.46, 0.19), new THREE.Vector3(0.4, 1.22, 0.19),
    new THREE.Vector3(0.34, 1.0, 0.26), new THREE.Vector3(0.19, 0.9, 0.3),
    new THREE.Vector3(0.03, 0.79, 0.31), new THREE.Vector3(0.04, 0.63, 0.27)
  ]);
  for (const [name, curve] of [['left earbud cable', cableLeft], ['right earbud cable', cableRight]]) {
    const cable = new THREE.Mesh(new THREE.TubeGeometry(curve, 24, 0.012, 5, false), cableMat);
    cable.name = name;
    cable.castShadow = false;
    bossRoot.add(cable);
  }
  cylinder(bossRoot, 'boss title halo', 0.22, 0.22, 0.045, [0, 2.15, 0], goldMat, 16);
  for (let spike = 0; spike < 3; spike++) {
    const tip = cylinder(bossRoot, 'boss crown detail', 0.025, 0.07, 0.12, [(spike - 1) * 0.12, 2.23, 0], goldMat, 6);
    tip.rotation.z = (spike - 1) * -0.18;
  }

  // Boss has a real activity loop, not a decorative idle animation:
  // desk work -> walk the aisle -> team meeting -> lounge break -> coffee ->
  // review board -> back to the executive desk.
  const bossRoute = [
    { x: -1.65, z: 4.45, face: Math.PI, activity: 'work', dwell: 7 },
    { x: 2.5, z: 8.25, face: 0.55, activity: 'walk', dwell: 0 },
    { x: 2.15, z: 6.35, face: Math.PI / 2, activity: 'dining', dwell: 6 },
    { x: 11.0, z: 5.38, face: Math.PI, activity: 'meeting', dwell: 6 },
    { x: 3.7, z: -0.45, face: 2.3, activity: 'lounge', dwell: 5 },
    { x: -6.0, z: 3.7, face: Math.PI, activity: 'coffee', dwell: 5 },
    { x: -12.25, z: -2.6, face: Math.PI / 2, activity: 'review', dwell: 5 },
    { x: 13.2, z: 12.4, face: 0.5, activity: 'pool', dwell: 6 },
    { x: -1.65, z: 4.45, face: Math.PI, activity: 'work', dwell: 8 }
  ];
  bossRoot.rotation.y = bossRoute[0].face;
  const bossMotion = {
    target: 0, walking: false, wait: bossRoute[0].dwell, activity: bossRoute[0].activity,
    phase: 1.4, stepRate: 9.6, route: [], pathIndex: 0
  };

  // Desk-side bookcase and colorful books.
  const shelf = group(scene, 'bookcase', [-8.6, 0, -1.6]);
  box(shelf, 'bookcase body', [0.72, 2.25, 2.2], [0, 1.2, 0], mats.wood);
  for (let y = 0.55; y < 2.15; y += 0.55) box(shelf, 'shelf plank', [0.8, 0.09, 2.18], [0, y, 0], mats.woodLight);
  const bookColors = ['#d98d6b', '#e1c77e', '#8eaf91', '#89a8bd', '#c89ac2', '#f0e4d1'];
  for (let i = 0; i < 15; i++) box(shelf, 'book', [0.35 + (i % 3) * 0.04, 0.36, 0.09], [-0.02, 0.34 + Math.floor(i / 5) * 0.55, -0.8 + (i % 5) * 0.38], material(bookColors[i % bookColors.length]), { rotation: [0, 0, (i % 2 ? 0.08 : -0.04)] });

  // Ceiling pendant lights, hanging above the work and lounge zones.
  for (const x of [-6, -2.5, 2, 6.2]) {
    cylinder(scene, 'pendant cable', 0.025, 0.025, 0.56, [x, 3.76, -1.1], mats.metal, 6);
    cylinder(scene, 'pendant shade', 0.27, 0.42, 0.23, [x, 3.42, -1.1], mats.lamp, 12);
    const light = new THREE.PointLight('#ffe3b2', 0.32, 7);
    light.position.set(x, 3.2, -1.1);
    scene.add(light);
  }

  // Characters are deliberately simple toy-like figures; their wandering is decorative.
  const characterGroups = [];
  const waypoints = [
    [[-7.5, 0, -0.15], [-10.2, 0, -1.8], [-12.2, 0, -2.65], [-10.65, 0, -2.6]],
    [[-4.4, 0, 0.0], [-2.7, 0, 0.0], [-2.7, 0, 1.4], [-4.5, 0, 0.0]],
    [[4.2, 0, 1.8], [4.2, 0, 2.75], [5.85, 0, 2.75], [5.85, 0, 1.8]],
    [[3.45, 0, -0.3], [4.2, 0, -0.1], [4.8, 0, 0.4], [3.45, 0, -0.3]],
    [[-7.8, 0, 3.8], [-10.6, 0, 5.3], [-10.6, 0, 5.3], [-7.8, 0, 3.8]],
    [[4.2, 0, 1.8], [4.2, 0, 2.75], [5.85, 0, 2.75], [5.85, 0, 1.8]],
    [[9.1, 0, -3.7], [9.1, 0, -1.2], [9.8, 0, -0.2], [9.1, 0, -3.7]],
    [[-0.25, 0, -0.52], [-0.25, 0, -0.52], [-0.25, 0, -0.52]],
    [[9.1, 0, -3.7], [9.1, 0, -1.2], [9.8, 0, -0.2], [9.1, 0, -3.7]]
  ];

  // Explicit home stations turn the office from a random walk into a small
  // believable workplace: active agents stay by their own workstation, review
  // agents hold a review pose, and idle agents wander through the social spaces.
  const movementPlans = {
    forge: { position: [-6.7, -0.62], face: Math.PI, mode: 'work', stationary: true },
    scout: { position: [9.35, 5.75], face: Math.PI, mode: 'review', stationary: true },
    pixel: { position: [4.2, 1.8], mode: 'wander', points: waypoints[2], target: 1, speed: 0.62 },
    orbit: { position: [3.45, -0.3], mode: 'wander', points: waypoints[3], target: 1, speed: 0.58 },
    guard: { position: [-4.7, 3.8], face: Math.PI / 2, mode: 'waiting', stationary: true },
    nova: { position: [3.0, -3.86], face: Math.PI, mode: 'work', stationary: true },
    patch: { position: [6.05, -3.86], face: Math.PI, mode: 'work', stationary: true },
    muse: { position: [-0.25, -0.62], face: Math.PI, mode: 'review', stationary: true },
    moss: { position: [9.1, -3.86], face: Math.PI, mode: 'waiting', stationary: true }
  };
  // Navigation mesh: padded furniture footprints and room partitions. All agents
  // use the same route planner so their paths bend around props instead of
  // walking through desks, chairs, walls, shower fixtures, or pool water.
  const navStep = 0.4;
  const navMinX = -15.7;
  const navMaxX = 21.5;
  const navMinZ = -8.8;
  const navMaxZ = 19.2;
  const navWidth = Math.floor((navMaxX - navMinX) / navStep) + 1;
  const navDepth = Math.floor((navMaxZ - navMinZ) / navStep) + 1;
  const navBlockers = [
    // Outer room shell.
    { x1: -16.2, x2: -15.72, z1: -8.45, z2: 10.8 },
    { x1: 15.72, x2: 16.2, z1: -8.45, z2: 10.8 },
    { x1: -16.2, x2: 16.2, z1: -8.45, z2: -8.02 },
    // Focus studio enclosure: east doorway stays open between z -4.0 and -0.8.
    { x1: -15.9, x2: -10.3, z1: -5.32, z2: -5.02 },
    { x1: -15.9, x2: -15.62, z1: -5.25, z2: 0.42 },
    { x1: -10.55, x2: -10.3, z1: -5.25, z2: -4.0 },
    { x1: -10.55, x2: -10.3, z1: -0.8, z2: 0.42 },
    { x1: -15.85, x2: -14.45, z1: 0.18, z2: 0.42 },
    { x1: -11.75, x2: -10.35, z1: 0.18, z2: 0.42 },
    // Bookcases and worktable inside the new wing.
    { x1: -15.3, x2: -13.95, z1: -4.9, z2: -4.2 },
    { x1: -12.2, x2: -10.85, z1: -4.9, z2: -4.2 },
    { x1: -14.9, x2: -12.9, z1: -2.88, z2: -1.62 },
    { x1: -14.3, x2: -13.5, z1: -1.72, z2: -0.88 },
    // Desk and chair envelopes, expanded with a walking clearance.
    { x1: -8.34, x2: -5.06, z1: -3.5, z2: -0.65 },
    { x1: -5.56, x2: -1.45, z1: -3.5, z2: -0.65 },
    { x1: -2.3, x2: 1.8, z1: -3.5, z2: -0.65 },
    { x1: 1.33, x2: 4.7, z1: -6.9, z2: -4.1 },
    { x1: 4.38, x2: 7.76, z1: -6.9, z2: -4.1 },
    { x1: 7.42, x2: 10.8, z1: -6.9, z2: -4.1 },
    // Glass pod dividers between workstations.
    { x1: -5.12, x2: -4.88, z1: -3.96, z2: -1.96 },
    { x1: -1.94, x2: -1.7, z1: -3.96, z2: -1.96 },
    { x1: 1.3, x2: 1.54, z1: -6.31, z2: -4.39 },
    { x1: 4.44, x2: 4.68, z1: -6.31, z2: -4.39 },
    { x1: 7.56, x2: 7.8, z1: -6.31, z2: -4.39 },
    // Reading nook, bookcase, lounge, and arcade room.
    { x1: -9.16, x2: -8.04, z1: -3.08, z2: -0.12 },
    // Actual lounge furniture footprints leave an aisle beside the sofa.
    { x1: 3.86, x2: 7.92, z1: -3.75, z2: -1.57 },
    { x1: 4.54, x2: 7.28, z1: -1.85, z2: -0.3 },
    { x1: 7.55, x2: 8.48, z1: -3.17, z2: -1.8 },
    // Divider panels between lounge and gaming room, with a walk-through gap.
    { x1: 3.2, x2: 4.7, z1: 0.72, z2: 1.38 },
    { x1: 7.25, x2: 8.75, z1: 0.72, z2: 1.38 },
    // Arcade cabinets, console and beanbags; the carpet itself is walkable.
    { x1: 4.55, x2: 5.55, z1: 1.24, z2: 2.44 },
    { x1: 6.25, x2: 7.25, z1: 1.24, z2: 2.44 },
    { x1: 3.75, x2: 4.8, z1: 3.18, z2: 4.3 },
    { x1: 7.6, x2: 8.65, z1: 3.18, z2: 4.3 },
    { x1: 5.25, x2: 7.15, z1: 3.5, z2: 4.1 },
    // Pantry counters / fridge.
    { x1: -8.1, x2: -4.3, z1: 0.9, z2: 3.15 },
    // Executive desk and visitor seating.
    { x1: -4.15, x2: 0.82, z1: 1.76, z2: 4.18 },
    // Boss room's glass / wood partitions; the front remains open.
    { x1: -4.34, x2: -4.17, z1: 1.78, z2: 5.74 },
    { x1: -4.19, x2: -2.1, z1: 1.58, z2: 1.82 },
    { x1: -0.82, x2: 1.03, z1: 1.58, z2: 1.82 },
    { x1: 0.92, x2: 1.08, z1: 1.78, z2: 2.96 },
    { x1: 0.92, x2: 1.08, z1: 4.25, z2: 5.72 },
    // Bathroom external walls and door jambs.
    { x1: -12.72, x2: -12.38, z1: 2.9, z2: 7.12 },
    { x1: -8.63, x2: -8.29, z1: 2.9, z2: 7.12 },
    { x1: -12.72, x2: -8.29, z1: 2.84, z2: 3.16 },
    { x1: -12.72, x2: -11.18, z1: 6.84, z2: 7.16 },
    { x1: -9.82, x2: -8.29, z1: 6.84, z2: 7.16 },
    // Bathroom fixtures.
    { x1: -12.0, x2: -10.95, z1: 3.2, z2: 4.65 },
    { x1: -10.0, x2: -9.08, z1: 3.65, z2: 4.8 },
    { x1: -10.35, x2: -8.98, z1: 5.48, z2: 6.15 },
    // Meeting room furniture and chairs.
    { x1: 9.45, x2: 12.65, z1: 1.35, z2: 5.0 },
    // Dining room glass partitions and the table/chair cluster.
    { x1: 1.1, x2: 1.4, z1: 4.58, z2: 7.58 },
    { x1: 8.0, x2: 8.3, z1: 4.58, z2: 7.58 },
    { x1: 2.53, x2: 4.05, z1: 4.46, z2: 4.78 },
    { x1: 5.35, x2: 6.87, z1: 4.46, z2: 4.78 },
    { x1: 2.85, x2: 6.55, z1: 4.96, z2: 7.24 },
    // Pool water, coping, sunbeds and parasol. The surrounding deck stays walkable.
    { x1: 14.2, x2: 19.85, z1: 13.6, z2: 17.35 },
    { x1: 13.45, x2: 14.35, z1: 15.8, z2: 17.2 },
    { x1: 19.65, x2: 20.55, z1: 15.8, z2: 17.2 }
  ];
  const navBlockedAt = (x, z) => {
    if (x < navMinX || x > navMaxX || z < navMinZ || z > navMaxZ) return true;
    if (z < 10.65 && (x < -15.62 || x > 15.62)) return true;
    const clearance = 0.22;
    return navBlockers.some((r) =>
      x >= r.x1 - clearance && x <= r.x2 + clearance &&
      z >= r.z1 - clearance && z <= r.z2 + clearance
    );
  };
  const navIndex = (ix, iz) => iz * navWidth + ix;
  const navPoint = (ix, iz) => [navMinX + ix * navStep, navMinZ + iz * navStep];
  const navCellFor = (point) => ({
    ix: Math.max(0, Math.min(navWidth - 1, Math.round((point.x - navMinX) / navStep))),
    iz: Math.max(0, Math.min(navDepth - 1, Math.round((point.z - navMinZ) / navStep)))
  });
  const nearestWalkableCell = (point) => {
    const start = navCellFor(point);
    if (!navBlockedAt(...navPoint(start.ix, start.iz))) return start;
    for (let radius = 1; radius <= 18; radius++) {
      let best = null;
      let bestDistance = Infinity;
      for (let dx = -radius; dx <= radius; dx++) {
        for (let dz = -radius; dz <= radius; dz++) {
          if (Math.max(Math.abs(dx), Math.abs(dz)) !== radius) continue;
          const ix = start.ix + dx;
          const iz = start.iz + dz;
          if (ix < 0 || ix >= navWidth || iz < 0 || iz >= navDepth) continue;
          const p = navPoint(ix, iz);
          if (navBlockedAt(p[0], p[1])) continue;
          const d = Math.hypot(p[0] - point.x, p[1] - point.z);
          if (d < bestDistance) { best = { ix, iz }; bestDistance = d; }
        }
      }
      if (best) return best;
    }
    return start;
  };
  const findWalkPath = (from, to) => {
    const start = nearestWalkableCell(from);
    const goal = nearestWalkableCell(to);
    const startId = navIndex(start.ix, start.iz);
    const goalId = navIndex(goal.ix, goal.iz);
    if (startId === goalId) return [navPoint(goal.ix, goal.iz)];
    const total = navWidth * navDepth;
    const gScore = new Float32Array(total);
    gScore.fill(Infinity);
    const cameFrom = new Int32Array(total);
    cameFrom.fill(-1);
    const closed = new Uint8Array(total);
    const heap = [];
    const heuristic = (a, b) => {
      const ax = a % navWidth, az = Math.floor(a / navWidth);
      const bx = b % navWidth, bz = Math.floor(b / navWidth);
      const dx = Math.abs(ax - bx), dz = Math.abs(az - bz);
      return Math.max(dx, dz) + (Math.SQRT2 - 1) * Math.min(dx, dz);
    };
    const push = (node) => {
      heap.push(node);
      let i = heap.length - 1;
      while (i > 0) {
        const parent = (i - 1) >> 1;
        if (heap[parent].f <= node.f) break;
        heap[i] = heap[parent]; i = parent;
      }
      heap[i] = node;
    };
    const pop = () => {
      if (!heap.length) return null;
      const top = heap[0];
      const last = heap.pop();
      if (heap.length) {
        let i = 0;
        while (true) {
          let child = i * 2 + 1;
          if (child >= heap.length) break;
          if (child + 1 < heap.length && heap[child + 1].f < heap[child].f) child++;
          if (heap[child].f >= last.f) break;
          heap[i] = heap[child]; i = child;
        }
        heap[i] = last;
      }
      return top;
    };
    gScore[startId] = 0;
    push({ id: startId, f: heuristic(startId, goalId) });
    const directions = [
      [1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1],
      [1, 1, Math.SQRT2], [1, -1, Math.SQRT2], [-1, 1, Math.SQRT2], [-1, -1, Math.SQRT2]
    ];
    let found = false;
    let iterations = 0;
    while (heap.length && iterations < total * 4) {
      iterations++;
      const current = pop().id;
      if (closed[current]) continue;
      if (current === goalId) { found = true; break; }
      closed[current] = 1;
      const cx = current % navWidth;
      const cz = Math.floor(current / navWidth);
      for (const [dx, dz, cost] of directions) {
        const nx = cx + dx, nz = cz + dz;
        if (nx < 0 || nx >= navWidth || nz < 0 || nz >= navDepth) continue;
        const [wx, wz] = navPoint(nx, nz);
        if (navBlockedAt(wx, wz)) continue;
        // Do not cut diagonally through the corner of a desk or partition.
        if (dx && dz) {
          const sideA = navPoint(cx + dx, cz);
          const sideB = navPoint(cx, cz + dz);
          if (navBlockedAt(...sideA) || navBlockedAt(...sideB)) continue;
        }
        const nextId = navIndex(nx, nz);
        if (closed[nextId]) continue;
        const score = gScore[current] + cost;
        if (score >= gScore[nextId]) continue;
        cameFrom[nextId] = current;
        gScore[nextId] = score;
        push({ id: nextId, f: score + heuristic(nextId, goalId) });
      }
    }
    // If a room is sealed or unreachable, keep the character on its current
    // safe tile instead of taking a straight-line shortcut through furniture.
    if (!found) return [navPoint(start.ix, start.iz)];
    const rawIds = [];
    let cursor = goalId;
    rawIds.push(cursor);
    while (cursor !== startId && cameFrom[cursor] !== -1) {
      cursor = cameFrom[cursor];
      rawIds.push(cursor);
    }
    rawIds.reverse();
    const raw = rawIds.map((id) => navPoint(id % navWidth, Math.floor(id / navWidth)));
    const clearSegment = (a, b) => {
      const distance = Math.hypot(b[0] - a[0], b[1] - a[1]);
      const checks = Math.max(2, Math.ceil(distance / (navStep * 0.32)));
      for (let i = 1; i < checks; i++) {
        const t = i / checks;
        if (navBlockedAt(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t)) return false;
      }
      return true;
    };
    // String-pull the grid route into a few natural arcs instead of tiny right angles.
    const smooth = [raw[0]];
    let anchor = 0;
    while (anchor < raw.length - 1) {
      let next = raw.length - 1;
      while (next > anchor + 1 && !clearSegment(raw[anchor], raw[next])) next--;
      smooth.push(raw[next]);
      anchor = next;
    }
    return smooth;
  };

  characters.forEach((info, i) => {
    // Working/review agents spawn at a dedicated home station. Wanderers use
    // a navigation-safe starting cell, so no character appears inside furniture.
    const plan = movementPlans[info.id];
    const requestedSpawn = plan?.position ? [plan.position[0], 0, plan.position[1]] : waypoints[i][0];
    const spawnCell = plan?.stationary || plan?.position
      ? null
      : nearestWalkableCell({ x: requestedSpawn[0], z: requestedSpawn[2] });
    const spawnPoint = plan?.position
      ? plan.position
      : navPoint(spawnCell.ix, spawnCell.iz);
    const c = group(scene, 'character-' + info.id, [spawnPoint[0], 0, spawnPoint[1]]);
    if (Number.isFinite(plan?.face)) c.rotation.y = plan.face;
    c.userData.character = info;
    const skin = material(info.color);
    const shirt = material(info.shirt);
    const hair = material(info.hair);
    const characterHead = sphere(c, 'head', 0.27, [0, 1.25, 0], skin, [0.88, 1.02, 0.88]);
    sphere(c, 'hair', 0.275, [0, 1.39, -0.035], hair, [0.9, 0.55, 0.9]);
    const characterBody = sphere(c, 'body', 0.28, [0, 0.77, 0], shirt, [0.83, 1.08, 0.62]);
    const armL = group(c, 'left arm pivot', [-0.23, 0.94, 0]);
    const armR = group(c, 'right arm pivot', [0.23, 0.94, 0]);
    sphere(armL, 'arm-left', 0.105, [-0.045, -0.17, 0], skin, [0.82, 1.2, 0.82]);
    sphere(armR, 'arm-right', 0.105, [0.045, -0.17, 0], skin, [0.82, 1.2, 0.82]);
    const legL = group(c, 'left leg pivot', [-0.12, 0.47, 0]);
    const legR = group(c, 'right leg pivot', [0.12, 0.47, 0]);
    cylinder(legL, 'leg-left', 0.085, 0.095, 0.4, [0, -0.14, 0], mats.navy, 8);
    cylinder(legR, 'leg-right', 0.085, 0.095, 0.4, [0, -0.14, 0], mats.navy, 8);
    sphere(legL, 'shoe-left', 0.12, [0, -0.34, 0.04], mats.cream, [1, 0.58, 1.35]);
    sphere(legR, 'shoe-right', 0.12, [0, -0.34, 0.04], mats.cream, [1, 0.58, 1.35]);
    const face = material('#4b3b33');
    sphere(c, 'eye-left', 0.025, [-0.085, 1.27, 0.232], face, [1, 1, 0.5]);
    sphere(c, 'eye-right', 0.025, [0.085, 1.27, 0.232], face, [1, 1, 0.5]);
    const stateColor = info.status === 'working' ? '#79b88a' : info.status === 'review' ? '#e0b46b' : info.status === 'blocked' ? '#d78370' : '#96a3b0';
    const stateMaterial = new THREE.MeshStandardMaterial({ color: stateColor, emissive: stateColor, emissiveIntensity: 0.58, roughness: 0.35 });
    const stateOrb = sphere(c, 'status-orb', 0.075, [0, 1.78, 0], stateMaterial);
    const stateRing = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.018, 6, 14), stateMaterial);
    stateRing.name = 'status-ring';
    stateRing.position.set(0, 1.78, 0);
    stateRing.rotation.x = Math.PI / 2;
    c.add(stateRing);
    c.userData.statusOrb = stateOrb;
    c.userData.statusRing = stateRing;
    const points = plan?.points || waypoints[i];
    const target = Math.min(plan?.target ?? 1, points.length - 1);
    const stationary = Boolean(plan?.stationary);
    const firstTarget = points[target] || points[0];
    c.userData.motion = {
      points, target, speed: plan?.speed ?? (0.82 + (i % 3) * 0.08),
      phase: i * 1.8, legs: [legL, legR], arms: [armL, armR], body: characterBody, head: characterHead,
      route: stationary ? [] : findWalkPath(c.position, { x: firstTarget[0], z: firstTarget[2] }),
      pathIndex: 0, walking: !stationary, walkTimer: 1.2 + i * 0.7,
      mode: plan?.mode || 'wander'
    };
    characterGroups.push(c);
  });

  // A tiny mailbox and outdoor stepping stones add a playful dollhouse edge.
  box(scene, 'welcome sign post', [0.12, 1.45, 0.12], [-11.35, 0.68, 8.3], mats.wood);
  box(scene, 'welcome sign', [1.8, 0.62, 0.14], [-11.35, 1.42, 8.27], mats.cream);
  for (let i = 0; i < 7; i++) {
    const stone = cylinder(scene, 'stepping stone', 0.36, 0.38, 0.1, [-7.5 + i * 2.5, -0.05, 8.0], material(i % 2 ? '#d6c9b3' : '#c7bba8'), 8);
    stone.rotation.y = i * 0.3;
  }

  const originalCamera = new THREE.Vector3(34, 26, 40);
  const resize = () => {
    const width = Math.max(host.clientWidth, 320);
    const height = Math.max(host.clientHeight, 320);
    camera.aspect = width / height;
    // Keep the full dollhouse in view on narrow portrait screens.
    camera.fov = width < 620 ? 47 : width < 920 ? 42 : 38;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  };
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(host);
  resize();

  let isNight = false;
  const setNight = (night) => {
    isNight = Boolean(night);
    const sky = isNight ? '#292e3f' : '#d8d9cc';
    const fog = isNight ? '#292e3f' : '#d8d9cc';
    gsap.to(scene.background, { r: new THREE.Color(sky).r, g: new THREE.Color(sky).g, b: new THREE.Color(sky).b, duration: 0.65 });
    if (scene.fog) {
      scene.fog.color.set(fog);
    }
    gsap.to(sun, { intensity: isNight ? 0.42 : 1.85, duration: 0.7 });
    gsap.to(warmFill, { intensity: isNight ? 0.75 : 0.2, duration: 0.7 });
    renderer.toneMappingExposure = isNight ? 0.7 : 0.82;
    mats.lamp.emissiveIntensity = isNight ? 1.25 : 0.45;
    mats.lamp.color.set(isNight ? '#fff0bb' : '#ffdf99');
  };

  const roomViews = {
    all: { position: [34, 26, 40], target: [0, 1.0, 4.7] },
    focus: { position: [-4.8, 8.5, 13.5], target: [-13.1, 1.1, -2.4] },
    boss: { position: [10.5, 8.5, 13], target: [-1.65, 1.05, 3.3] },
    studio: { position: [12, 10, 16], target: [0.2, 1, -3.0] },
    meeting: { position: [15, 10, 16], target: [11.0, 1, 3.15] },
    lounge: { position: [14, 10, 10], target: [5.7, 1, -1.6] },
    games: { position: [13, 9, 12], target: [6.2, 0.8, 2.0] },
    pantry: { position: [9, 9, 14], target: [-6.4, 1, 1.9] },
    bathroom: { position: [-2.5, 8.8, 13], target: [-10.5, 1.25, 5.0] },
    dining: { position: [13, 9.5, 18], target: [4.7, 1, 6.0] },
    pool: { position: [23.5, 13.5, 25], target: [17.0, 0.5, 15.5] }
  };
  const focusRoom = (room) => {
    const view = roomViews[room] || roomViews.all;
    gsap.to(camera.position, { x: view.position[0], y: view.position[1], z: view.position[2], duration: 1.1, ease: 'power3.inOut', onUpdate: () => controls.update() });
    gsap.to(controls.target, { x: view.target[0], y: view.target[1], z: view.target[2], duration: 1.1, ease: 'power3.inOut' });
  };
  const resetView = () => focusRoom('all');

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let pointerDown = null;
  const onPointerDown = (event) => {
    if (event.button !== 0) return;
    pointerDown = { x: event.clientX, y: event.clientY };
  };
  const onPointerUp = (event) => {
    if (!pointerDown) return;
    const distance = Math.hypot(event.clientX - pointerDown.x, event.clientY - pointerDown.y);
    pointerDown = null;
    if (distance > 6) return;
    const bounds = renderer.domElement.getBoundingClientRect();
    pointer.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
    pointer.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects([...characterGroups, bossRoot], true);
    if (!hits.length) return;
    let parent = hits[0].object;
    while (parent && !parent.userData.character) parent = parent.parent;
    if (parent?.userData.character && typeof onSelect === 'function') {
      onSelect(parent.userData.character.id);
    }
  };
  renderer.domElement.addEventListener('pointerdown', onPointerDown);
  renderer.domElement.addEventListener('pointerup', onPointerUp);
  renderer.domElement.style.cursor = 'grab';

  let animationFrame = 0;
  const clock = new THREE.Clock();
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const animate = () => {
    animationFrame = requestAnimationFrame(animate);
    const delta = Math.min(clock.getDelta(), 0.04);
    const elapsed = clock.elapsedTime;
    if (!reducedMotion) {
      const bossWave = elapsed * bossMotion.stepRate + bossMotion.phase;
      if (bossMotion.walking) {
        const waypoint = bossRoute[bossMotion.target];
        // Look ahead before reaching each intermediate node. A* already
        // returns line-of-sight-safe segments, so this removes the stop-start
        // footwork at every corner without cutting through obstacles.
        while (bossMotion.pathIndex < bossMotion.route.length - 1) {
          const probe = bossMotion.route[bossMotion.pathIndex];
          if (Math.hypot(probe[0] - bossRoot.position.x, probe[1] - bossRoot.position.z) >= 0.34) break;
          bossMotion.pathIndex++;
        }
        const pathPoint = bossMotion.route[bossMotion.pathIndex];
        if (!pathPoint) {
          bossRoot.position.x = waypoint.x;
          bossRoot.position.z = waypoint.z;
          bossRoot.rotation.y = waypoint.face;
          bossRoot.position.y = 0;
          bossMotion.walking = false;
          bossMotion.activity = waypoint.activity;
          bossMotion.wait = waypoint.dwell;
        } else {
          const dx = pathPoint[0] - bossRoot.position.x;
          const dz = pathPoint[1] - bossRoot.position.z;
          const distance = Math.hypot(dx, dz);
          if (distance < 0.16) {
            if (bossMotion.pathIndex < bossMotion.route.length - 1) {
              bossMotion.pathIndex++;
            } else {
              bossRoot.position.x = pathPoint[0];
              bossRoot.position.z = pathPoint[1];
              bossRoot.rotation.y = waypoint.face;
              bossRoot.position.y = 0;
              bossMotion.walking = false;
              bossMotion.activity = waypoint.activity;
              bossMotion.wait = waypoint.dwell;
              bossLegs.forEach((leg) => { leg.rotation.x = 0; leg.rotation.z = 0; });
            }
          } else {
            const desiredAngle = Math.atan2(dx, dz);
            const angleDelta = Math.atan2(
              Math.sin(desiredAngle - bossRoot.rotation.y),
              Math.cos(desiredAngle - bossRoot.rotation.y)
            );
            bossRoot.rotation.y += angleDelta * Math.min(1, delta * 6.2);
            const ease = THREE.MathUtils.clamp(distance * 1.7, 0.25, 1);
            const step = Math.min(1.45 * delta * ease, distance);
            let nextBossX = bossRoot.position.x + (dx / distance) * step;
            let nextBossZ = bossRoot.position.z + (dz / distance) * step;
            let bossCrowded = false;
            for (let j = 0; j < characterGroups.length; j++) {
              const teammate = characterGroups[j];
              const sx = nextBossX - teammate.position.x;
              const sz = nextBossZ - teammate.position.z;
              const separation = Math.hypot(sx, sz);
              if (separation < 0.62) {
                const angle = separation > 0.001 ? Math.atan2(sz, sx) : bossMotion.phase + j * 2.399;
                const push = (0.62 - separation) * 0.58;
                const candidateX = nextBossX + Math.cos(angle) * push;
                const candidateZ = nextBossZ + Math.sin(angle) * push;
                if (!navBlockedAt(candidateX, candidateZ)) {
                  nextBossX = candidateX;
                  nextBossZ = candidateZ;
                } else {
                  bossCrowded = true;
                }
              }
            }
            if (!navBlockedAt(nextBossX, nextBossZ) && !bossCrowded) {
              bossRoot.position.x = nextBossX;
              bossRoot.position.z = nextBossZ;
            } else {
              bossMotion.route = findWalkPath(bossRoot.position, { x: waypoint.x, z: waypoint.z });
              bossMotion.pathIndex = 0;
            }
            const stride = Math.sin(bossWave) * 0.58;
            bossLegs[0].rotation.x = stride;
            bossLegs[1].rotation.x = -stride;
            bossLegs[0].rotation.z = Math.cos(bossWave) * 0.035;
            bossLegs[1].rotation.z = -Math.cos(bossWave) * 0.035;
            bossArms.forEach(({ group: arm, side }) => {
              arm.rotation.x = -Math.sin(bossWave) * 0.34;
              arm.rotation.z = side * Math.sin(bossWave) * 0.07;
            });
            bossRoot.position.y = Math.abs(Math.sin(bossWave)) * 0.06;
            bossHead.rotation.y = Math.sin(elapsed * 0.75) * 0.04;
          }
        }
      } else {
        bossMotion.wait = Math.max(0, bossMotion.wait - delta);
        if (bossMotion.wait <= 0) {
          bossMotion.target = (bossMotion.target + 1) % bossRoute.length;
          const next = bossRoute[bossMotion.target];
          bossMotion.route = findWalkPath(bossRoot.position, { x: next.x, z: next.z });
          bossMotion.pathIndex = 0;
          bossMotion.walking = true;
          bossMotion.activity = 'walk';
        }

        // Distinct readable poses while the boss pauses at each destination.
        const rest = elapsed * 1.7 + bossMotion.phase;
        bossRoot.position.y = Math.sin(elapsed * 1.15) * 0.012;
        bossHead.rotation.y = Math.sin(elapsed * 0.55) * 0.045;
        bossHead.rotation.z = Math.sin(elapsed * 0.8) * 0.012;
        bossLegs[0].rotation.x = 0;
        bossLegs[1].rotation.x = 0;
        bossArms.forEach(({ group: arm, side }) => {
          arm.rotation.x = 0;
          arm.rotation.z = 0;
          if (bossMotion.activity === 'work') {
            arm.rotation.x = -0.88 + Math.sin(rest * 2.8 + side) * 0.035;
            arm.rotation.z = side * 0.045;
            bossHead.rotation.x = Math.sin(rest * 1.5) * 0.035;
          } else if (bossMotion.activity === 'meeting') {
            arm.rotation.x = -0.42 + Math.sin(rest * 2.2 + side) * 0.14;
            arm.rotation.z = side * (0.27 + Math.sin(rest * 1.8) * 0.08);
            bossHead.rotation.y = Math.sin(rest * 1.1) * 0.12;
          } else if (bossMotion.activity === 'coffee') {
            arm.rotation.x = side > 0 ? -1.35 + Math.sin(rest * 1.4) * 0.06 : -0.08;
            arm.rotation.z = side > 0 ? -0.2 : -0.02;
            bossHead.rotation.x = side > 0 ? -0.09 : 0;
          } else if (bossMotion.activity === 'lounge') {
            arm.rotation.x = Math.sin(rest * 0.75 + side) * 0.05;
            arm.rotation.z = side * 0.11;
            bossHead.rotation.x = Math.sin(rest * 0.7) * 0.025;
          } else if (bossMotion.activity === 'review') {
            arm.rotation.x = side > 0 ? -0.55 + Math.sin(rest * 2.0) * 0.12 : -0.18;
            arm.rotation.z = side * (side > 0 ? 0.32 : 0.07);
            bossHead.rotation.y = Math.sin(rest * 0.9) * 0.07;
          } else if (bossMotion.activity === 'dining') {
            arm.rotation.x = side > 0 ? -1.08 + Math.sin(rest * 1.6) * 0.06 : -0.08 + Math.sin(rest * 0.9) * 0.025;
            arm.rotation.z = side > 0 ? -0.18 : 0.04;
            bossHead.rotation.x = side > 0 ? -0.08 : 0;
          } else if (bossMotion.activity === 'pool') {
            arm.rotation.x = -0.12 + Math.sin(rest * 0.8 + side) * 0.08;
            arm.rotation.z = side * (0.2 + Math.sin(rest * 0.6) * 0.08);
            bossHead.rotation.y = Math.sin(rest * 0.55) * 0.11;
            bossHead.rotation.x = Math.sin(rest * 0.8) * 0.025;
          }
        });
      }
      plantLeaves.forEach(({ leaf, phase }) => {
        leaf.rotation.z = Math.sin(elapsed * 0.55 + phase) * 0.045;
        leaf.rotation.x = Math.cos(elapsed * 0.42 + phase) * 0.025;
      });
      poolRipples.forEach(({ ripple, phase }) => {
        const wave = (elapsed * 0.42 + phase) % 1;
        const scale = 0.72 + wave * 0.48;
        ripple.scale.set(scale, scale, scale);
        ripple.material.opacity = 0.16 + (1 - wave) * 0.38;
      });
    }
    characterGroups.forEach((character, i) => {
      const motion = character.userData.motion;
      if (character.userData.statusOrb && character.userData.statusRing) {
        const pulse = 1 + Math.sin(elapsed * 2.35 + motion.phase) * 0.065;
        character.userData.statusOrb.scale.setScalar(pulse);
        character.userData.statusRing.rotation.z += delta * 0.14;
      }
      if (reducedMotion) return;

      // Stationary characters still feel alive, but no longer roam randomly
      // away from their assigned activity or clip through a desk to get there.
      if (motion.mode === 'work' || motion.mode === 'review' || motion.mode === 'waiting') {
        character.position.y = Math.sin(elapsed * 1.15 + motion.phase) * 0.009;
        if (motion.head) {
          motion.head.rotation.y = Math.sin(elapsed * 0.55 + motion.phase) * (motion.mode === 'waiting' ? 0.09 : 0.035);
          motion.head.rotation.x = Math.sin(elapsed * 0.8 + motion.phase) * 0.022;
        }
        motion.legs.forEach((leg) => { leg.rotation.x = 0; leg.rotation.z = 0; });
        if (motion.mode === 'work') {
          motion.arms[0].rotation.x = -0.86 + Math.sin(elapsed * 3.2 + motion.phase) * 0.045;
          motion.arms[1].rotation.x = -0.91 + Math.cos(elapsed * 3.0 + motion.phase) * 0.045;
          motion.arms[0].rotation.z = -0.045;
          motion.arms[1].rotation.z = 0.045;
          if (motion.body) motion.body.rotation.z = Math.sin(elapsed * 2.2 + motion.phase) * 0.012;
        } else if (motion.mode === 'review') {
          motion.arms[0].rotation.x = -0.42 + Math.sin(elapsed * 1.8 + motion.phase) * 0.09;
          motion.arms[1].rotation.x = -0.52 + Math.cos(elapsed * 1.5 + motion.phase) * 0.07;
          motion.arms[0].rotation.z = -0.08;
          motion.arms[1].rotation.z = 0.08;
          if (motion.body) motion.body.rotation.z = Math.sin(elapsed * 0.75 + motion.phase) * 0.012;
        } else {
          motion.arms[0].rotation.x = Math.sin(elapsed * 0.7 + motion.phase) * 0.035;
          motion.arms[1].rotation.x = -Math.sin(elapsed * 0.7 + motion.phase) * 0.035;
          motion.arms[0].rotation.z = -0.025;
          motion.arms[1].rotation.z = 0.025;
        }
        return;
      }

      if (motion.walking) {
        // Advance across close route nodes before stepping, keeping motion
        // continuous while preserving the A* collision-safe path.
        while (motion.pathIndex < motion.route.length - 1) {
          const probe = motion.route[motion.pathIndex];
          if (Math.hypot(probe[0] - character.position.x, probe[1] - character.position.z) >= 0.34) break;
          motion.pathIndex++;
        }
        const waypoint = motion.route[motion.pathIndex];
        if (!waypoint) {
          motion.walking = false;
          motion.walkTimer = 1.2 + (i % 3) * 0.9;
          return;
        }
        const dx = waypoint[0] - character.position.x;
        const dz = waypoint[1] - character.position.z;
        const distance = Math.hypot(dx, dz);
        if (distance < 0.16) {
          if (motion.pathIndex < motion.route.length - 1) {
            motion.pathIndex++;
          } else {
            character.position.x = waypoint[0];
            character.position.z = waypoint[1];
            motion.walking = false;
            motion.walkTimer = 1.25 + (i % 3) * 0.8;
            motion.legs.forEach((leg) => { leg.rotation.x = 0; leg.rotation.z = 0; });
            motion.arms.forEach((arm) => { arm.rotation.x = 0; arm.rotation.z = 0; });
          }
          return;
        }

        const desiredAngle = Math.atan2(dx, dz);
        const angleDelta = Math.atan2(
          Math.sin(desiredAngle - character.rotation.y),
          Math.cos(desiredAngle - character.rotation.y)
        );
        character.rotation.y += angleDelta * Math.min(1, delta * 6.8);
        // Ease in and out at each corner so the little people do not snap-turn.
        const ease = THREE.MathUtils.clamp(distance * 1.8, 0.24, 1);
        const step = Math.min(motion.speed * delta * ease, distance);
        let nextX = character.position.x + (dx / distance) * step;
        let nextZ = character.position.z + (dz / distance) * step;

        // A small separation impulse prevents teammates from occupying the
        // same point in a narrow aisle while still respecting static blockers.
        for (let j = 0; j < characterGroups.length; j++) {
          if (i === j) continue;
          const other = characterGroups[j];
          const sepX = nextX - other.position.x;
          const sepZ = nextZ - other.position.z;
          const sep = Math.hypot(sepX, sepZ);
          if (sep < 0.56) {
            const angle = sep > 0.001 ? Math.atan2(sepZ, sepX) : (i + 1) * 2.399 + j;
            const push = (0.56 - sep) * 0.45;
            const pushedX = nextX + Math.cos(angle) * push;
            const pushedZ = nextZ + Math.sin(angle) * push;
            if (!navBlockedAt(pushedX, pushedZ)) { nextX = pushedX; nextZ = pushedZ; }
          }
        }
        const bossDX = nextX - bossRoot.position.x;
        const bossDZ = nextZ - bossRoot.position.z;
        const bossDistance = Math.hypot(bossDX, bossDZ);
        if (bossDistance < 0.62) {
          const angle = bossDistance > 0.001 ? Math.atan2(bossDZ, bossDX) : (i + 1) * 2.399;
          const push = (0.62 - bossDistance) * 0.45;
          const pushedX = nextX + Math.cos(angle) * push;
          const pushedZ = nextZ + Math.sin(angle) * push;
          if (!navBlockedAt(pushedX, pushedZ)) { nextX = pushedX; nextZ = pushedZ; }
        }
        if (!navBlockedAt(nextX, nextZ)) {
          character.position.x = nextX;
          character.position.z = nextZ;
        } else {
          const target = motion.points[motion.target];
          motion.route = findWalkPath(character.position, { x: target[0], z: target[2] });
          motion.pathIndex = 0;
        }

        const stride = Math.sin(elapsed * 10.5 + motion.phase);
        motion.legs[0].rotation.x = stride * 0.43;
        motion.legs[1].rotation.x = -stride * 0.43;
        motion.legs[0].rotation.z = Math.cos(elapsed * 5.25 + motion.phase) * 0.025;
        motion.legs[1].rotation.z = -Math.cos(elapsed * 5.25 + motion.phase) * 0.025;
        motion.arms[0].rotation.x = -stride * 0.31;
        motion.arms[1].rotation.x = stride * 0.31;
        motion.arms[0].rotation.z = -Math.sin(elapsed * 5.25 + motion.phase) * 0.035;
        motion.arms[1].rotation.z = Math.sin(elapsed * 5.25 + motion.phase) * 0.035;
        character.position.y = Math.abs(Math.sin(elapsed * 10.5 + motion.phase)) * 0.035;
        if (motion.body) motion.body.rotation.z = -Math.sin(angleDelta) * 0.035;
      } else {
        motion.walkTimer -= delta;
        character.position.y = Math.sin(elapsed * 1.3 + motion.phase) * 0.012;
        motion.legs[0].rotation.x = 0;
        motion.legs[1].rotation.x = 0;
        motion.legs[0].rotation.z = 0;
        motion.legs[1].rotation.z = 0;
        motion.arms[0].rotation.x = Math.sin(elapsed * 0.8 + motion.phase) * 0.035;
        motion.arms[1].rotation.x = -Math.sin(elapsed * 0.8 + motion.phase) * 0.035;
        if (motion.body) motion.body.rotation.z = Math.sin(elapsed * 0.65 + motion.phase) * 0.012;
        if (motion.walkTimer <= 0) {
          motion.target = (motion.target + 1) % motion.points.length;
          const target = motion.points[motion.target];
          motion.route = findWalkPath(character.position, { x: target[0], z: target[2] });
          motion.pathIndex = 0;
          motion.walking = true;
        }
      }
    });
    controls.update();
    renderer.render(scene, camera);
  };
  animate();

  return {
    setNight,
    focusRoom,
    resetView,
    destroy() {
      cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointerup', onPointerUp);
      controls.dispose();
      renderer.dispose();
      host.removeChild(renderer.domElement);
      scene.traverse((object) => {
        if (object.isMesh) {
          object.geometry.dispose();
          if (Array.isArray(object.material)) object.material.forEach((m) => m.dispose());
          else if (object.material) object.material.dispose();
        }
      });
    }
  };
}