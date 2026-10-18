import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import gsap from 'gsap';
import { agents, characters } from '../data/characters.js';

const material = (color, roughness = 0.85, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness, ...extra });

export function createOffice(host, { onSelect } = {}) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#e8e8d8');
  scene.fog = new THREE.Fog('#e8e8d8', 25, 55);

  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
  camera.position.set(23, 20, 25);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  renderer.domElement.className = 'office-canvas';
  host.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.minDistance = 12;
  controls.maxDistance = 44;
  controls.maxPolarAngle = Math.PI * 0.47;
  controls.target.set(0, 1.1, 0);

  scene.add(new THREE.HemisphereLight('#fff7df', '#7c8878', 2.05));
  const sun = new THREE.DirectionalLight('#fff0cd', 3.2);
  sun.position.set(-7, 15, 8);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -24;
  sun.shadow.camera.right = 24;
  sun.shadow.camera.top = 22;
  sun.shadow.camera.bottom = -22;
  sun.shadow.bias = -0.0003;
  scene.add(sun);

  const warmFill = new THREE.PointLight('#ffd5a0', 0.55, 20);
  warmFill.position.set(0, 5, 0);
  scene.add(warmFill);

  const mats = {
    grass: material('#abb99a'),
    floor: material('#e6d5b9'),
    wall: material('#f0e7d7'),
    wood: material('#b77e52'),
    woodLight: material('#d5aa7c'),
    darkWood: material('#80563d'),
    green: material('#88a47d'),
    leaf: material('#5f8966'),
    leafLight: material('#9aba83'),
    fabric: material('#d8bba1'),
    sofa: material('#76958a'),
    terracotta: material('#d68c6a'),
    cream: material('#faf4e7'),
    metal: material('#6d7777', 0.38, { metalness: 0.4 }),
    screen: material('#253d42', 0.3, { emissive: '#6a9d9c', emissiveIntensity: 0.28 }),
    glass: new THREE.MeshStandardMaterial({ color: '#a9c7c0', roughness: 0.15, metalness: 0.1, transparent: true, opacity: 0.33 }),
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
  box(scene, 'garden platform', [29, 0.36, 19], [0, -0.28, 0], mats.grass);
  box(scene, 'wood floor', [26, 0.22, 15.4], [0, -0.02, 0], mats.floor);
  box(scene, 'front step', [7, 0.22, 0.72], [0, -0.12, 8.05], mats.woodLight);

  // Expanded dollhouse shell: the front stays open, with a wider wing for the team.
  box(scene, 'back wall', [26, 4.3, 0.22], [0, 2.1, -7.62], mats.wall);
  box(scene, 'left wall', [0.22, 4.3, 15.4], [-13.02, 2.1, 0], mats.wall);
  box(scene, 'right low wall', [0.22, 1.3, 15.4], [13.02, 0.65, 0], mats.wall);
  box(scene, 'back wood trim', [26.2, 0.2, 0.32], [0, 4.22, -7.58], mats.woodLight);
  box(scene, 'left wood trim', [0.32, 0.2, 15.5], [-13.02, 4.22, 0], mats.woodLight);

  // A wider window wall makes the office feel bright instead of boxed in.
  box(scene, 'window glass', [10.8, 2.45, 0.09], [-3.1, 2.55, -7.47], mats.glass, { castShadow: false });
  for (let i = 0; i < 6; i++) box(scene, 'window mullion', [0.09, 2.55, 0.12], [-8.05 + i * 2.0, 2.55, -7.36], mats.woodLight);
  box(scene, 'window sill', [10.95, 0.12, 0.22], [-3.1, 1.25, -7.32], mats.wood);
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
  makeDesk(-6.7, -3.35, '#e8ae77', 'Creative');
  makeDesk(-3.5, -3.35, '#8fc3b5', 'Developer');
  makeDesk(-0.25, -3.35, '#b8a5dd', 'Designer');
  makeDesk(3.0, -4.65, '#e6b172', 'Research pod');
  makeDesk(6.05, -4.65, '#83a8d3', 'Design pod');
  makeDesk(9.1, -4.65, '#80b6a4', 'Operations pod');

  // A shared wall board for sprint notes and a room-wide planning surface.
  box(scene, 'sprint board frame', [4.2, 1.85, 0.16], [6.7, 2.45, -7.4], mats.wood);
  box(scene, 'sprint board', [3.95, 1.6, 0.045], [6.7, 2.45, -7.29], mats.cream);
  for (let i = 0; i < 4; i++) {
    box(scene, 'sprint note', [0.55, 0.32, 0.025], [5.45 + (i % 2) * 0.85, 2.55 + Math.floor(i / 2) * 0.48, -7.25],
      [mats.terracotta, mats.leafLight, mats.lamp, mats.glass][i]);
  }
  box(scene, 'sprint marker rail', [2.5, 0.055, 0.05], [6.7, 1.63, -7.25], mats.metal);

  // Extra team wing: conference table, rolling chairs, and a place to brainstorm.
  const warRoom = group(scene, 'war room', [10.1, 0, 0.1]);
  box(warRoom, 'war room rug', [4.8, 0.055, 4.1], [0, 0.11, 0], material('#c9d3bd'));
  cylinder(warRoom, 'conference table top', 1.42, 1.42, 0.16, [0, 0.96, 0], mats.woodLight, 32);
  cylinder(warRoom, 'conference table foot', 0.24, 0.33, 0.84, [0, 0.49, 0], mats.darkWood, 16);
  for (let i = 0; i < 5; i++) {
    const a = i * Math.PI * 2 / 5;
    const chair = group(warRoom, 'meeting chair', [Math.cos(a) * 2.05, 0, Math.sin(a) * 1.68]);
    box(chair, 'chair seat', [0.64, 0.15, 0.62], [0, 0.57, 0], [mats.sofa, mats.terracotta, mats.navy, mats.leaf, mats.fabric][i]);
    box(chair, 'chair back', [0.64, 0.72, 0.14], [0, 0.97, -0.22], [mats.sofa, mats.terracotta, mats.navy, mats.leaf, mats.fabric][i]);
    cylinder(chair, 'chair stem', 0.06, 0.06, 0.48, [0, 0.27, 0], mats.metal, 8);
    box(chair, 'chair base', [0.54, 0.06, 0.5], [0, 0.06, 0], mats.metal);
  }
  box(warRoom, 'team screen frame', [2.0, 1.25, 0.12], [0, 1.8, -1.82], mats.navy);
  box(warRoom, 'team screen', [1.78, 1.02, 0.035], [0, 1.82, -1.74], material('#9ed1c0', 0.25, { emissive: '#5b9f8e', emissiveIntensity: 0.38 }));
  addPlant(12.0, 1.8, 0.7);

  // Small reading / meeting table with round poufs.
  const meeting = group(scene, 'reading corner', [2.9, 0, -2.8]);
  cylinder(meeting, 'round tabletop', 1.05, 1.05, 0.16, [0, 0.95, 0], mats.woodLight, 24);
  cylinder(meeting, 'table leg', 0.13, 0.25, 0.88, [0, 0.47, 0], mats.wood);
  for (let i = 0; i < 3; i++) {
    const a = i * Math.PI * 2 / 3;
    cylinder(meeting, 'pouf', 0.42, 0.43, 0.48, [Math.cos(a) * 1.3, 0.25, Math.sin(a) * 1.3], [mats.terracotta, mats.sofa, mats.fabric][i], 12);
  }
  cylinder(meeting, 'plant pot', 0.22, 0.28, 0.28, [0.43, 1.17, -0.05], mats.terracotta);
  sphere(meeting, 'small plant', 0.26, [0.43, 1.48, -0.05], mats.leafLight, [1, 1.35, 1]);

  // Cozy lounge: sofa, cushions, coffee table, rug, books and standing lamp.
  const lounge = group(scene, 'lounge', [5.9, 0, -0.65]);
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
  const game = group(scene, 'game room', [6.2, 0, 3.5]);
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
    const bean = sphere(game, 'bean bag', 0.55, [i ? 1.3 : -1.35, 0.38, 1.6], i ? mats.terracotta : mats.sofa, [1.1, 0.7, 1.1]);
  }

  // Pantry with fridge, counter, coffee machine and tiny galon.
  const pantry = group(scene, 'pantry', [-6.6, 0, 2.5]);
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
  sphere(bossRoot, 'boss left trouser', 0.22, [-0.155, 0.34, 0], bossPants, [0.72, 1.38, 0.78]);
  sphere(bossRoot, 'boss right trouser', 0.22, [0.155, 0.34, 0], bossPants, [0.72, 1.38, 0.78]);
  for (const x of [-0.155, 0.155]) {
    sphere(bossRoot, 'sneaker sole', 0.15, [x, 0.055, 0.115], bossSole, [1.0, 0.34, 1.55]);
    sphere(bossRoot, 'black sneaker', 0.15, [x, 0.11, 0.105], bossShoes, [1.0, 0.58, 1.45]);
    sphere(bossRoot, 'white sneaker toe', 0.1, [x, 0.115, 0.255], bossSole, [1.0, 0.78, 0.9]);
    for (let lace = 0; lace < 2; lace++) box(bossRoot, 'sneaker lace', [0.09, 0.012, 0.018], [x, 0.16 + lace * 0.025, 0.17 + lace * 0.055], bossSole);
  }
  sphere(bossRoot, 'white tee', 0.37, [0, 0.96, 0.005], bossShirt, [0.83, 1.13, 0.74]);
  sphere(bossRoot, 'navy jacket body', 0.39, [0, 0.98, -0.005], bossJacket, [1.05, 1.08, 0.72]);
  box(bossRoot, 'white shirt panel', [0.23, 0.58, 0.035], [0, 0.96, 0.276], bossShirt);
  box(bossRoot, 'left jacket front', [0.16, 0.62, 0.05], [-0.185, 0.96, 0.265], bossJacket, { rotation: [0, 0, -0.08] });
  box(bossRoot, 'right jacket front', [0.16, 0.62, 0.05], [0.185, 0.96, 0.265], bossJacket, { rotation: [0, 0, 0.08] });
  box(bossRoot, 'jacket zipper', [0.018, 0.48, 0.018], [0, 0.92, 0.305], goldMat);
  for (const side of [-1, 1]) {
    sphere(bossRoot, 'jacket shoulder', 0.18, [side * 0.37, 1.17, -0.005], bossJacket, [0.95, 0.92, 0.95]);
    sphere(bossRoot, 'jacket sleeve', 0.16, [side * 0.405, 0.91, 0.035], bossJacket, [0.78, 1.5, 0.78]);
    sphere(bossRoot, 'jacket cuff', 0.11, [side * 0.32, 0.68, 0.14], bossJacket, [0.9, 0.72, 0.85]);
    sphere(bossRoot, 'boss hand', 0.105, [side * 0.255, 0.59, 0.205], bossSkin, [0.92, 1.0, 0.8]);
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
    [[-7.2, 0, -1.6], [-5.3, 0, -0.5], [-3.6, 0, -1.1], [-7.8, 0, 1.3]],
    [[-3.8, 0, -1.55], [-1.6, 0, -0.4], [1.0, 0, -1.15], [-4.8, 0, 1.1]],
    [[1.5, 0, -1.8], [2.1, 0, 1.0], [5.0, 0, 1.1], [3.1, 0, -1.25]],
    [[7.7, 0, 0.6], [8.7, 0, -1.2], [10.7, 0, -0.8], [9.0, 0, 1.8]],
    [[-9.0, 0, 1.8], [-7.2, 0, 3.4], [-8.6, 0, 4.5], [-10.3, 0, 2.2]],
    [[3.0, 0, -3.1], [4.0, 0, -2.7], [6.5, 0, -2.8], [5.0, 0, -3.3]],
    [[6.1, 0, -2.8], [7.4, 0, -1.8], [8.5, 0, -2.8], [6.0, 0, -3.4]],
    [[8.8, 0, 2.0], [10.8, 0, 2.5], [11.6, 0, 0.5], [9.1, 0, -1.1]],
    [[-1.8, 0, -2.2], [0.2, 0, -0.8], [1.9, 0, -1.7], [-0.2, 0, -3.2]]
  ];
  characters.forEach((info, i) => {
    const c = group(scene, 'character-' + info.id, waypoints[i][0]);
    c.userData.character = info;
    const skin = material(info.color);
    const shirt = material(info.shirt);
    const hair = material(info.hair);
    sphere(c, 'head', 0.27, [0, 1.25, 0], skin, [0.88, 1.02, 0.88]);
    sphere(c, 'hair', 0.275, [0, 1.39, -0.035], hair, [0.9, 0.55, 0.9]);
    sphere(c, 'body', 0.28, [0, 0.77, 0], shirt, [0.83, 1.08, 0.62]);
    sphere(c, 'arm-left', 0.105, [-0.28, 0.77, 0], skin, [0.82, 1.2, 0.82]);
    sphere(c, 'arm-right', 0.105, [0.28, 0.77, 0], skin, [0.82, 1.2, 0.82]);
    const legL = cylinder(c, 'leg-left', 0.085, 0.095, 0.4, [-0.12, 0.33, 0], mats.navy, 8);
    const legR = cylinder(c, 'leg-right', 0.085, 0.095, 0.4, [0.12, 0.33, 0], mats.navy, 8);
    sphere(c, 'shoe-left', 0.12, [-0.12, 0.12, 0.04], mats.cream, [1, 0.58, 1.35]);
    sphere(c, 'shoe-right', 0.12, [0.12, 0.12, 0.04], mats.cream, [1, 0.58, 1.35]);
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
    c.userData.motion = { points: waypoints[i], target: 1, speed: 0.45 + (i % 3) * 0.09, phase: i * 1.8, legs: [legL, legR], walkTimer: 1.2 + i * 0.7 };
    characterGroups.push(c);
  });

  // A tiny mailbox and outdoor stepping stones add a playful dollhouse edge.
  box(scene, 'welcome sign post', [0.12, 1.45, 0.12], [-11.35, 0.68, 8.3], mats.wood);
  box(scene, 'welcome sign', [1.8, 0.62, 0.14], [-11.35, 1.42, 8.27], mats.cream);
  for (let i = 0; i < 7; i++) {
    const stone = cylinder(scene, 'stepping stone', 0.36, 0.38, 0.1, [-7.5 + i * 2.5, -0.05, 8.0], material(i % 2 ? '#d6c9b3' : '#c7bba8'), 8);
    stone.rotation.y = i * 0.3;
  }

  const originalCamera = new THREE.Vector3(23, 20, 25);
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
    const sky = isNight ? '#292e3f' : '#e8e8d8';
    const fog = isNight ? '#292e3f' : '#e8e8d8';
    gsap.to(scene.background, { r: new THREE.Color(sky).r, g: new THREE.Color(sky).g, b: new THREE.Color(sky).b, duration: 0.65 });
    if (scene.fog) {
      scene.fog.color.set(fog);
    }
    gsap.to(sun, { intensity: isNight ? 0.65 : 3.2, duration: 0.7 });
    gsap.to(warmFill, { intensity: isNight ? 1.7 : 0.55, duration: 0.7 });
    renderer.toneMappingExposure = isNight ? 0.95 : 1.12;
    mats.lamp.emissiveIntensity = isNight ? 1.25 : 0.45;
    mats.lamp.color.set(isNight ? '#fff0bb' : '#ffdf99');
  };

  const roomViews = {
    all: { position: [23, 20, 25], target: [0, 1.05, 0] },
    boss: { position: [10.5, 8.5, 13], target: [-1.65, 1.05, 3.3] },
    studio: { position: [12, 10, 16], target: [0.2, 1, -3.0] },
    meeting: { position: [10.5, 8.5, 12], target: [10.1, 1, 0.1] },
    lounge: { position: [14, 10, 10], target: [5.7, 1, -0.1] },
    games: { position: [13, 9, 12], target: [6.2, 0.8, 2.8] },
    pantry: { position: [9, 9, 14], target: [-6.4, 1, 1.9] }
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
      bossRoot.position.y = Math.sin(elapsed * 1.25) * 0.018;
      bossHead.rotation.y = Math.sin(elapsed * 0.55) * 0.045;
      bossHead.rotation.z = Math.sin(elapsed * 0.8) * 0.012;
      plantLeaves.forEach(({ leaf, phase }) => {
        leaf.rotation.z = Math.sin(elapsed * 0.55 + phase) * 0.045;
        leaf.rotation.x = Math.cos(elapsed * 0.42 + phase) * 0.025;
      });
    }
    characterGroups.forEach((character, i) => {
      const motion = character.userData.motion;
      if (character.userData.statusOrb && character.userData.statusRing) {
        const pulse = 1 + Math.sin(elapsed * 2.7 + motion.phase) * 0.08;
        character.userData.statusOrb.scale.setScalar(pulse);
        character.userData.statusRing.rotation.z += delta * 0.2;
      }
      const target = motion.points[motion.target];
      const dx = target[0] - character.position.x;
      const dz = target[2] - character.position.z;
      const distance = Math.sqrt(dx * dx + dz * dz);
      if (!reducedMotion && distance > 0.12) {
        const step = motion.speed * delta;
        character.position.x += (dx / distance) * Math.min(step, distance);
        character.position.z += (dz / distance) * Math.min(step, distance);
        character.rotation.y = Math.atan2(dx, dz);
        motion.legs[0].rotation.x = Math.sin(elapsed * 9 + motion.phase) * 0.4;
        motion.legs[1].rotation.x = -Math.sin(elapsed * 9 + motion.phase) * 0.4;
        character.position.y = Math.abs(Math.sin(elapsed * 9 + motion.phase)) * 0.035;
      } else if (distance <= 0.12) {
        motion.walkTimer -= delta;
        motion.legs[0].rotation.x = 0;
        motion.legs[1].rotation.x = 0;
        character.position.y = Math.sin(elapsed * 1.5 + motion.phase) * 0.018;
        if (motion.walkTimer <= 0) {
          motion.target = (motion.target + 1) % motion.points.length;
          motion.walkTimer = 1.1 + (i % 3) * 0.9;
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