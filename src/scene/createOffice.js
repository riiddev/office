import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import gsap from 'gsap';
import { characters } from '../data/characters.js';

const material = (color, roughness = 0.85, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness, ...extra });

export function createOffice(host) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#e8e8d8');
  scene.fog = new THREE.Fog('#e8e8d8', 25, 55);

  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
  camera.position.set(17, 17, 21);

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
  controls.maxDistance = 36;
  controls.maxPolarAngle = Math.PI * 0.47;
  controls.target.set(0, 1.1, 0);

  scene.add(new THREE.HemisphereLight('#fff7df', '#7c8878', 2.05));
  const sun = new THREE.DirectionalLight('#fff0cd', 3.2);
  sun.position.set(-7, 15, 8);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -18;
  sun.shadow.camera.right = 18;
  sun.shadow.camera.top = 18;
  sun.shadow.camera.bottom = -18;
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
  box(scene, 'garden platform', [23, 0.36, 15], [0, -0.28, 0], mats.grass);
  box(scene, 'wood floor', [19.2, 0.22, 11.2], [0, -0.02, 0], mats.floor);
  box(scene, 'front step', [5, 0.22, 0.65], [0, -0.12, 5.9], mats.woodLight);

  // Three walls leave the front open like a miniature dollhouse.
  box(scene, 'back wall', [19.2, 4.3, 0.22], [0, 2.1, -5.56], mats.wall);
  box(scene, 'left wall', [0.22, 4.3, 11.2], [-9.62, 2.1, 0], mats.wall);
  box(scene, 'right low wall', [0.22, 1.3, 11.2], [9.62, 0.65, 0], mats.wall);
  box(scene, 'back wood trim', [19.35, 0.2, 0.32], [0, 4.22, -5.52], mats.woodLight);
  box(scene, 'left wood trim', [0.32, 0.2, 11.3], [-9.62, 4.22, 0], mats.woodLight);

  // Big window wall with wood mullions and a view of rounded hills.
  box(scene, 'window glass', [8.5, 2.45, 0.09], [-3.8, 2.55, -5.41], mats.glass, { castShadow: false });
  for (let i = 0; i < 5; i++) box(scene, 'window mullion', [0.09, 2.55, 0.12], [-8.05 + i * 2.12, 2.55, -5.31], mats.woodLight);
  box(scene, 'window sill', [8.7, 0.12, 0.22], [-3.8, 1.25, -5.27], mats.wood);
  const landscape = group(scene, 'outside landscape', [0, 0, -7.9]);
  sphere(landscape, 'hill', 3.5, [-5, 0.7, 0], material('#d4cf9c'), [1.4, 0.35, 0.14]);
  sphere(landscape, 'hill', 4, [1.5, 0.5, -0.1], material('#a7bd96'), [1.1, 0.35, 0.14]);
  sphere(landscape, 'hill', 3, [6, 0.8, 0], material('#e4c49b'), [1.4, 0.35, 0.14]);

  // Structural accent beams and a few indoor plants.
  box(scene, 'beam one', [0.12, 3.9, 0.14], [-8.8, 2, -5.25], mats.wood);
  box(scene, 'beam two', [0.12, 3.9, 0.14], [1.8, 2, -5.25], mats.wood);
  const addPlant = (x, z, size = 1) => {
    const p = group(scene, 'potted plant', [x, 0.12, z]);
    cylinder(p, 'pot', 0.25 * size, 0.3 * size, 0.42 * size, [0, 0.21 * size, 0], mats.terracotta);
    cylinder(p, 'soil', 0.22 * size, 0.22 * size, 0.04 * size, [0, 0.43 * size, 0], mats.darkWood);
    for (let i = 0; i < 5; i++) {
      const angle = i * Math.PI * 0.4;
      sphere(p, 'leaf', 0.22 * size, [Math.cos(angle) * 0.18 * size, (0.68 + (i % 2) * 0.2) * size, Math.sin(angle) * 0.18 * size], i % 2 ? mats.leaf : mats.leafLight, [0.72, 1.45, 0.72]);
    }
    cylinder(p, 'stem', 0.035 * size, 0.05 * size, 0.7 * size, [0, 0.72 * size, 0], mats.leaf);
  };
  addPlant(-8.55, -4.7, 1.1);
  addPlant(-8.4, 4.6, 1.15);
  addPlant(8.45, -4.55, 0.95);
  addPlant(8.4, 4.4, 1.05);

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
    [[-5.8, 0, -1.6], [-4.7, 0, 0.7], [-2.5, 0, -0.9], [-6.9, 0, 1.5]],
    [[-2.9, 0, -1.55], [-0.2, 0, 0.3], [2.1, 0, -1.1], [-3.7, 0, 1.2]],
    [[-0.1, 0, -1.55], [2.5, 0, 0.5], [5.2, 0, 0.7], [2.5, 0, -1.3]],
    [[5.7, 0, 1.7], [4.4, 0, 2.3], [7.2, 0, 2.2], [6.0, 0, -0.1]],
    [[-6.2, 0, 1.1], [-5.3, 0, 0.5], [-7.5, 0, 1.8], [-4.8, 0, 2.1]]
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
    c.userData.motion = { points: waypoints[i], target: 1, speed: 0.45 + (i % 3) * 0.09, phase: i * 1.8, legs: [legL, legR], walkTimer: 1.2 + i * 0.7 };
    characterGroups.push(c);
  });

  // A tiny mailbox and outdoor stepping stones add a playful dollhouse edge.
  box(scene, 'welcome sign post', [0.12, 1.45, 0.12], [-8.1, 0.68, 6.35], mats.wood);
  box(scene, 'welcome sign', [1.45, 0.62, 0.14], [-8.1, 1.42, 6.32], mats.cream);
  for (let i = 0; i < 5; i++) {
    const stone = cylinder(scene, 'stepping stone', 0.36, 0.38, 0.1, [-5 + i * 2.5, -0.05, 6.2], material(i % 2 ? '#d6c9b3' : '#c7bba8'), 8);
    stone.rotation.y = i * 0.3;
  }

  const originalCamera = new THREE.Vector3(17, 17, 21);
  const resize = () => {
    const width = Math.max(host.clientWidth, 320);
    const height = Math.max(host.clientHeight, 320);
    camera.aspect = width / height;
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
    all: { position: [17, 17, 21], target: [0, 1.05, 0] },
    studio: { position: [8, 9, 13], target: [-4.8, 1, -1.7] },
    lounge: { position: [13, 10, 10], target: [5.7, 1, -0.1] },
    games: { position: [13, 9, 12], target: [6.2, 0.8, 2.8] },
    pantry: { position: [7, 9, 13], target: [-6.4, 1, 1.9] }
  };
  const focusRoom = (room) => {
    const view = roomViews[room] || roomViews.all;
    gsap.to(camera.position, { x: view.position[0], y: view.position[1], z: view.position[2], duration: 1.1, ease: 'power3.inOut', onUpdate: () => controls.update() });
    gsap.to(controls.target, { x: view.target[0], y: view.target[1], z: view.target[2], duration: 1.1, ease: 'power3.inOut' });
  };
  const resetView = () => focusRoom('all');

  let animationFrame = 0;
  const clock = new THREE.Clock();
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const animate = () => {
    animationFrame = requestAnimationFrame(animate);
    const delta = Math.min(clock.getDelta(), 0.04);
    const elapsed = clock.elapsedTime;
    characterGroups.forEach((character, i) => {
      const motion = character.userData.motion;
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