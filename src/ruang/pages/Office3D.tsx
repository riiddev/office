import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState, type MutableRefObject } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { officeStateBadge } from '../office-state.ts'
import { agentLook } from '../agents.ts'
import { bathroomQueueSpot, clampTarget, createLayout, diningSpot, FLOOR_HEIGHT, floorOf, GAME_ROOM, idlePlan, mushollaSpot, placementFor, walkPath3, type Floor, type OfficeLayout, type Placement, type Vec3 } from '../office3d-layout.ts'
import { Environment } from '../scene3d/environment.tsx'
import { RBox, WorkDesk } from '../scene3d/props.tsx'
import type { OfficeStation } from '../types.ts'

// 3D view of the same Office snapshot the 2D view renders. Positions come from each station's
// room, roomPosition and seat, so the 3D office shows exactly the states the server derived.

type Registry<T> = MutableRefObject<Map<string, T>>

/** Ground-floor spots outside the building (gang, sidewalk, yard) stay in view from lantai 2. */
function outdoors(x: number, z: number, layout: OfficeLayout): boolean {
  const { minX, maxX, maxZ } = layout.building
  const inGameRoom = x > GAME_ROOM.minX && x < GAME_ROOM.maxX && z > GAME_ROOM.minZ && z < GAME_ROOM.maxZ
  return x < minX || z > maxZ || (x > maxX && !inGameRoom)
}

// Shared by every character: lets walkers steer around anyone standing, sitting or lying in their way.
const crowd = new Set<THREE.Group>()
const scratch = { move: new THREE.Vector3(), push: new THREE.Vector3() }
const damp = (current: number, target: number, rate: number, delta: number) => current + (target - current) * (1 - Math.exp(-rate * delta))
const angleTo = (from: number, to: number) => Math.atan2(Math.sin(to - from), Math.cos(to - from))
const seedOf = (id: string) => { let hash = 0; for (let index = 0; index < id.length; index += 1) hash = (hash * 31 + id.charCodeAt(index)) % 9973; return (hash / 9973) * Math.PI * 2 }
const smooth = (edge0: number, edge1: number, value: number) => { const x = Math.min(1, Math.max(0, (value - edge0) / (edge1 - edge0))); return x * x * (3 - 2 * x) }
const WALK_SPEED = 1.55

function Character({ station, placement, layout, floor, onSelect, anchor, prayerSessionStart, prayerCycleDuration }: { station: OfficeStation & { routineStop?: DailyStop }; placement: Placement; layout: OfficeLayout; floor: Floor; onSelect: (station: OfficeStation, trigger: HTMLElement | null) => void; anchor: (object: THREE.Object3D | null) => void; prayerSessionStart: number; prayerCycleDuration: number }) {
  const root = useRef<THREE.Group>(null)
  const body = useRef<THREE.Group>(null)
  const torso = useRef<THREE.Group>(null)
  const head = useRef<THREE.Group>(null)
  const leftEye = useRef<THREE.Group>(null)
  const rightEye = useRef<THREE.Group>(null)
  const leftLeg = useRef<THREE.Mesh>(null)
  const rightLeg = useRef<THREE.Mesh>(null)
  const leftArm = useRef<THREE.Mesh>(null)
  const rightArm = useRef<THREE.Mesh>(null)
  const colors = agentLook(station.id)
  const offline = station.state === 'Offline'
  const unknown = station.state === 'Unknown'
  const tint = (color: string) => offline ? '#7b7f7d' : color
  // Only the first placement is applied as a prop; later changes are walked to via the aisle.
  const [start] = useState<Vec3>(() => placement.position)
  const path = useRef<THREE.Vector3[]>([])
  const progress = useRef({ last: new THREE.Vector3(), stuckSeconds: 0 })
  const destination = placement.position.join(',')
  const seed = useMemo(() => seedOf(station.id), [station.id])
  // Everything animated is eased towards its target each frame, so no pose ever snaps.
  const pose = useRef((() => {
    // Start already in the initial pose (seated, on the floor, in bed) instead of easing into it on load.
    const sit = placement.seated && !placement.pose ? 1 : 0
    const floorPose = placement.pose === 'floor' ? 1 : 0
    const lie = placement.pose === 'lie' ? 1 : 0
    const legs = sit || floorPose ? -Math.PI / 2.2 : 0
    return { speed: 0, phase: seed, sit, lie, floor: floorPose, legL: legs, legR: legs, armL: 0, armR: 0, armLz: 0, armRz: 0, headYaw: 0, headPitch: 0, headRoll: 0, lean: 0, sway: 0, bodyY: lie * ((placement.height ?? 0.5) + 0.16) + (1 - lie) * (-0.14 * sit - 0.5 * floorPose), bobY: 0, twist: 0, torsoX: 0, prayerY: 0 }
  })())
  useEffect(() => {
    const group = root.current
    if (!group) return
    crowd.add(group)
    return () => { crowd.delete(group) }
  }, [])
  useEffect(() => {
    const group = root.current
    if (!group) return
    path.current = walkPath3([group.position.x, group.position.y, group.position.z], placement.position, layout).map(([px, py, pz]) => new THREE.Vector3(px, py, pz))
    // placement.position is captured through `destination`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [destination])

  useFrame((state, rawDelta) => {
    const group = root.current
    if (!group) return
    const delta = Math.min(rawDelta, 0.05)
    const time = state.clock.elapsedTime
    const s = pose.current
    const nodes = path.current
    const moving = nodes.length > 0
    // Stand up (or climb out of bed) before walking off.
    const grounded = s.sit < 0.12 && s.lie < 0.12 && s.floor < 0.12
    let walking = false
    if (moving && grounded) {
      let next = nodes[0]
      const last = nodes.length === 1
      scratch.move.subVectors(next, group.position)
      // Intermediate waypoints are passed with a little tolerance so corners are rounded, not pivoted on.
      while (!last && scratch.move.length() < 0.16 && nodes.length > 1) {
        nodes.shift()
        next = nodes[0]
        scratch.move.subVectors(next, group.position)
      }
      const distance = scratch.move.length()
      const finalLeg = nodes.length === 1
      if (finalLeg && distance < 0.04) {
        nodes.shift()
        group.position.copy(next)
      } else {
        walking = true
        const heading = Math.atan2(scratch.move.x, scratch.move.z)
        const turn = Math.abs(angleTo(group.rotation.y, heading))
        // Ease in from rest, ease out towards the final spot, and slow for sharp turns instead of sliding sideways.
        const approach = finalLeg ? 0.35 + distance * 1.6 : 1
        const target = WALK_SPEED * Math.min(1, approach) * (1 - Math.min(0.7, turn / 2.2))
        s.speed = damp(s.speed, target, target > s.speed ? 4 : 7, delta)
        const step = Math.min(distance, s.speed * delta)
        scratch.move.normalize().multiplyScalar(step)
        // Step around other people rather than through them (not close to the destination, where seats sit side by side).
        if (!(finalLeg && distance < 0.8)) {
          scratch.push.set(0, 0, 0)
          for (const other of crowd) {
            if (other === group || Math.abs(other.position.y - group.position.y) > 1) continue
            const dx = group.position.x - other.position.x
            const dz = group.position.z - other.position.z
            const gap = Math.hypot(dx, dz)
            if (gap > 0.01 && gap < 0.7) { scratch.push.x += (dx / gap) * (0.7 - gap); scratch.push.z += (dz / gap) * (0.7 - gap) }
          }
          scratch.move.addScaledVector(scratch.push, Math.min(1, delta * 2.2))
        }
        group.position.add(scratch.move)
        if (Math.hypot(scratch.move.x, scratch.move.z) > 1e-5) group.rotation.y += angleTo(group.rotation.y, heading) * (1 - Math.exp(-9 * delta))
        s.phase += delta * s.speed * 4.6
      }
    }
    if (!walking) s.speed = damp(s.speed, 0, 9, delta)
    // Only the floor in view is drawn; from lantai 2 the agents outside on the ground stay visible.
    const upstairs = group.position.y > FLOOR_HEIGHT / 2
    group.visible = floor === 2 ? upstairs || outdoors(group.position.x, group.position.z, layout) : !upstairs
    const arrived = !moving
    if (arrived) {
      // Settle exactly onto the seat / bed / spot, and turn to face the right way.
      const gx = placement.position[0] - group.position.x
      const gy = placement.position[1] - group.position.y
      const gz = placement.position[2] - group.position.z
      if (Math.abs(gx) + Math.abs(gy) + Math.abs(gz) < 0.3) {
        const k = 1 - Math.exp(-8 * delta)
        group.position.x += gx * k; group.position.y += gy * k; group.position.z += gz * k
      }
      group.rotation.y += angleTo(group.rotation.y, placement.facing) * (1 - Math.exp(-6 * delta))
    }
    const settled = arrived && Math.abs(angleTo(group.rotation.y, placement.facing)) < 0.35
    s.sit = damp(s.sit, arrived && placement.seated && !placement.pose ? 1 : 0, 6, delta)
    s.floor = damp(s.floor, arrived && placement.pose === 'floor' ? 1 : 0, 5, delta)
    s.lie = damp(s.lie, arrived && settled && placement.pose === 'lie' ? 1 : 0, 3.2, delta)
    const sitting = Math.max(s.sit, s.floor)
    const seatedNow = sitting > 0.5 && s.lie < 0.5
    const working = station.state === 'Working' || station.state === 'Reviewing'
    const typing = working && seatedNow ? 1 : 0
    const talking = station.state === 'Collaborating' && !walking && s.lie < 0.5
    const gait = Math.min(1, s.speed / 1.2)
    const stride = Math.sin(s.phase) * 0.62 * gait
    const t = time + seed * 7
    // Keystrokes: irregular little bursts, with pauses where the agent reads the screen or thinks.
    const think = smooth(0.55, 0.9, Math.sin(t * 0.21) * Math.sin(t * 0.07 + 1.3) + 0.35)
    const tapL = Math.max(0, Math.sin(t * 17.3)) * (0.55 + 0.45 * Math.sin(t * 4.9)) * (1 - think)
    const tapR = Math.max(0, Math.sin(t * 13.1 + 2)) * (0.55 + 0.45 * Math.sin(t * 6.3 + 1)) * (1 - think)
    const reviewing = station.state === 'Reviewing'
    const activity = station.activity.toLowerCase()
    const praying = activity.includes('prayer') && settled && !walking
    const eating = /eat|breakfast|lunch|dinner|snack/.test(activity)
    const drinking = /coffee|drink of water/.test(activity)
    const showering = /showering|brushing teeth/.test(activity)
    const playing = /playing games/.test(activity)
    const prayerElapsed = Math.max(0, performance.now() / 1000 - prayerSessionStart)
    const prayerCycle = Math.min(24, (prayerElapsed / prayerCycleDuration) * 24)
    // Targets for every joint.
    const restLegs = -Math.PI / 2.2
    let legL = stride, legR = -stride
    legL = legL * (1 - sitting) + restLegs * sitting; legR = legR * (1 - sitting) + restLegs * sitting
    legL = legL * (1 - s.lie); legR = legR * (1 - s.lie)
    let armL = -stride * 0.8 * (1 - sitting), armR = stride * 0.8 * (1 - sitting)
    let armLz = 0, armRz = 0
    const sitIdle = sitting * (1 - typing)
    armL += -0.5 * sitIdle; armR += -0.5 * sitIdle
    if (typing) {
      armL = -1.12 + tapL * 0.16 - think * 0.12 + (reviewing ? Math.sin(t * 0.9) * 0.05 : 0)
      armR = -1.12 + tapR * 0.16 - think * 0.1 + (reviewing ? Math.sin(t * 1.3 + 1) * 0.08 : 0)
      armLz = 0.04; armRz = -0.04
      // Now and then one hand moves to the mouse / lifts while thinking.
      armR += think * Math.sin(t * 1.7) * 0.1
    }
    if (talking) {
      const g1 = Math.max(0, Math.sin(t * 1.9)), g2 = Math.max(0, Math.sin(t * 1.3 + 2))
      armL += -0.35 * sitIdle - 0.55 * g1 - 0.15
      armR += -0.2 * g2 - 0.1
      armLz = 0.25 * g1; armRz = -0.18 * g2
    }
    if (s.lie > 0.5) { armL = 0; armR = 0 }
    // Head: faces the screen while working, glances around when idle, looks ahead when walking.
    const glance = Math.sin(t * 0.31) * Math.sin(t * 0.13 + 1.1) * 0.55
    let headYaw = walking ? 0 : glance, headPitch = 0.04 * Math.sin(t * 0.5), headRoll = 0
    if (typing) { headYaw = Math.sin(t * 0.4) * 0.07 + think * glance * 0.6; headPitch = 0.16 + tapL * 0.02 - think * 0.1; headRoll = Math.sin(t * 0.8) * 0.03 }
    if (talking) { headPitch = 0.06 + Math.abs(Math.sin(t * 2.3)) * 0.07; headYaw = glance * 0.5 }
    if (walking) headPitch = 0.02
    if (eating) {
      const liftLeft = Math.max(0, Math.sin(t * 1.6 + seed))
      const liftRight = Math.max(0, Math.sin(t * 1.35 + seed * 1.7))
      armL = -0.7 - liftLeft * 0.42
      armR = -0.7 - liftRight * 0.42
      headPitch = 0.13 + Math.abs(Math.sin(t * 1.2)) * 0.07
    }
    if (drinking) {
      armR = -1.15 + Math.sin(t * 1.5 + seed) * 0.08
      armL = -0.25
      headPitch = 0.16 + Math.max(0, Math.sin(t * 0.7)) * 0.1
    }
    if (showering) {
      armL = -0.55 + Math.sin(t * 2.1 + seed) * 0.24
      armR = -0.65 + Math.sin(t * 2.1 + seed + 1.4) * 0.28
      armLz = -0.06; armRz = 0.06
      headPitch = 0.12 + Math.sin(t * 1.1) * 0.05
    }
    if (playing) {
      armL = -0.55 + Math.sin(t * 3 + seed) * 0.4
      armR = -0.55 + Math.sin(t * 3.2 + seed + 1) * 0.4
      headYaw = Math.sin(t * 0.6 + seed) * 0.2
    }
    let prayerStage: 'qiyam' | 'ruku' | 'itidal' | 'sujud' | 'sitting' | 'final-sitting' = 'qiyam'
    let torsoTarget = 0
    let prayerYTarget = 0
    if (prayerCycle >= 3 && prayerCycle < 5) prayerStage = 'ruku'
    else if (prayerCycle >= 5 && prayerCycle < 6.2) prayerStage = 'itidal'
    else if ((prayerCycle >= 6.2 && prayerCycle < 8.2) || (prayerCycle >= 9.6 && prayerCycle < 11.6) || (prayerCycle >= 17.8 && prayerCycle < 19.8) || (prayerCycle >= 21.2 && prayerCycle < 23.2)) prayerStage = 'sujud'
    else if ((prayerCycle >= 8.2 && prayerCycle < 9.6) || (prayerCycle >= 19.8 && prayerCycle < 21.2)) prayerStage = 'sitting'
    else if (prayerCycle >= 23.2) prayerStage = 'final-sitting'
    if (praying) {
      // Synchronized two-rakat sequence: qiyam, ruku, itidal, two sujuds with a sitting between,
      // then the second rakat and final sitting. Every participant uses the same session phase.
      if (prayerStage === 'ruku') { torsoTarget = -0.58; legL = legR = 0.04; armL = armR = -0.9; headPitch = 0.28 }
      else if (prayerStage === 'itidal') { torsoTarget = -0.02; armL = armR = -0.24; headPitch = 0.03 }
      else if (prayerStage === 'sujud') { torsoTarget = -1.12; prayerYTarget = -0.25; legL = legR = -1.05; armL = armR = -0.05; headPitch = -0.3 }
      else if (prayerStage === 'sitting' || prayerStage === 'final-sitting') { torsoTarget = -0.28; prayerYTarget = -0.23; legL = legR = -1.18; armL = armR = -0.32; headPitch = 0.08 }
      else { torsoTarget = 0; prayerYTarget = 0; legL = legR = 0; armL = armR = -0.2; headPitch = 0.02 }
      armLz = 0; armRz = 0
      headYaw = 0
    }
    if (s.lie > 0.5) { headYaw = 0; headPitch = 0; headRoll = Math.sin(t * 0.3) * 0.02 }
    // Body: bob and sway while walking, weight shifts / breathing while standing, settle into a seat.
    const breathe = Math.sin(t * (s.lie > 0.5 ? 1.1 : 1.9)) * (s.lie > 0.5 ? 0.012 : 0.008)
    const bob = Math.abs(Math.sin(s.phase)) * 0.045 * gait
    const sway = walking ? Math.sin(s.phase) * 0.035 * gait : (sitting > 0.5 ? Math.sin(t * 0.37) * 0.012 : Math.sin(t * 0.45) * 0.018)
    const twist = Math.sin(s.phase) * 0.07 * gait * -1
    const lean = (walking ? 0.05 * gait : 0) + (typing ? 0.09 : 0) + (sitIdle * 0.03) + (talking ? Math.sin(t * 1.1) * 0.03 : 0)
    // Settle each channel; typing taps are driven fast enough to read as keystrokes.
    const joint = typing ? 26 : 14
    s.legL = damp(s.legL, legL, 14, delta); s.legR = damp(s.legR, legR, 14, delta)
    s.armL = damp(s.armL, armL, joint, delta); s.armR = damp(s.armR, armR, joint, delta)
    s.armLz = damp(s.armLz, armLz, 10, delta); s.armRz = damp(s.armRz, armRz, 10, delta)
    s.headYaw = damp(s.headYaw, headYaw, 4, delta); s.headPitch = damp(s.headPitch, headPitch, 6, delta); s.headRoll = damp(s.headRoll, headRoll, 5, delta)
    s.lean = damp(s.lean, lean, 5, delta); s.sway = damp(s.sway, sway, 8, delta); s.twist = damp(s.twist, twist, 10, delta)
    s.bobY = damp(s.bobY, bob, 14, delta)
    const targetY = s.lie * ((placement.height ?? 0.5) + 0.16) + (1 - s.lie) * (-0.14 * s.sit - 0.5 * s.floor)
    s.bodyY = damp(s.bodyY, targetY, 10, delta)
    s.torsoX = damp(s.torsoX, praying ? torsoTarget : 0, 8, delta)
    s.prayerY = damp(s.prayerY, praying ? prayerYTarget : 0, 7, delta)
    if (leftLeg.current && rightLeg.current) { leftLeg.current.rotation.x = s.legL; rightLeg.current.rotation.x = s.legR }
    if (leftArm.current && rightArm.current) {
      leftArm.current.rotation.x = s.armL; rightArm.current.rotation.x = s.armR
      leftArm.current.rotation.z = s.armLz; rightArm.current.rotation.z = s.armRz
    }
    if (torso.current) torso.current.rotation.x = s.torsoX
    if (head.current) {
      head.current.rotation.set(s.headPitch, s.headYaw, s.headRoll)
      const headY = praying && prayerStage === 'sujud' ? 1.08 : praying && (prayerStage === 'sitting' || prayerStage === 'final-sitting') ? 1.18 : 1.3
      head.current.position.y = damp(head.current.position.y, headY, 8, delta)
    }
    if (leftEye.current && rightEye.current) {
      const blink = (time + seed * 3) % 4.3 < 0.12 ? 0.1 : 1
      leftEye.current.scale.y = rightEye.current.scale.y = damp(leftEye.current.scale.y, s.lie > 0.5 ? 0.1 : blink, 40, delta)
    }
    if (body.current) {
      // Lying down: the body tips back so the head rests towards the pillow (local -z).
      body.current.rotation.x = -Math.PI / 2 * s.lie + s.lean * (1 - s.lie)
      body.current.rotation.y = s.twist
      body.current.rotation.z = s.sway
      body.current.position.y = s.bodyY + s.bobY + breathe + s.prayerY
    }
    // If a crowd push or an awkward corner stalls a walker, recompute its route from its current position.
    const movement = progress.current
    const moved = Math.hypot(group.position.x - movement.last.x, group.position.z - movement.last.z)
    if (nodes.length > 0) {
      movement.stuckSeconds = moved < 0.004 ? movement.stuckSeconds + delta : 0
      if (movement.stuckSeconds > 2.5) {
        path.current = walkPath3([group.position.x, group.position.y, group.position.z], placement.position, layout)
          .map(([px, py, pz]) => new THREE.Vector3(px, py, pz))
        movement.stuckSeconds = 0
      }
    } else {
      movement.stuckSeconds = 0
    }
    movement.last.copy(group.position)
  })

  return <group ref={root} position={start}>
    <group ref={body} onClick={(event) => { event.stopPropagation(); onSelect(station, null) }} onPointerOver={() => { document.body.style.cursor = 'pointer' }} onPointerOut={() => { document.body.style.cursor = '' }}>
      <mesh ref={leftLeg} position={[-0.11, 0.66, 0]} castShadow geometry={legGeometry}><meshStandardMaterial color={tint(colors.pants)} roughness={0.8}/></mesh>
      <mesh ref={rightLeg} position={[0.11, 0.66, 0]} castShadow geometry={legGeometry}><meshStandardMaterial color={tint(colors.pants)} roughness={0.8}/></mesh>
      <group ref={torso} position={[0, 1.2, 0]}><RBox position={[0, -0.22, 0]} size={[0.48, 0.58, 0.3]} radius={0.07} color={tint(colors.shirt)} roughness={0.85}/></group>
      <mesh ref={leftArm} position={[-0.31, 1.2, 0]} castShadow geometry={armGeometry}><meshStandardMaterial color={tint(colors.shirt)} roughness={0.85}/></mesh>
      <mesh ref={rightArm} position={[0.31, 1.2, 0]} castShadow geometry={armGeometry}><meshStandardMaterial color={tint(colors.shirt)} roughness={0.85}/></mesh>
      {/* The head pivots at the neck so it can nod, turn and tilt. */}
      <group ref={head} position={[0, 1.3, 0]}>
        <group position={[0, -1.3, 0]}>
          <RBox position={[0, 1.5, 0]} size={[0.4, 0.4, 0.37]} radius={0.08} color={tint(colors.skin)} roughness={0.7}/>
          <RBox position={[0, 1.72, -0.02]} size={[0.43, 0.13, 0.41]} radius={0.05} color={tint(colors.hair)} roughness={0.9}/>
          <RBox position={[0, 1.58, -0.19]} size={[0.43, 0.3, 0.06]} radius={0.03} color={tint(colors.hair)} roughness={0.9}/>
          <group ref={leftEye} position={[-0.09, 1.52, 0.186]}><RBox position={[0, 0, 0]} size={[0.06, 0.07, 0.01]} radius={0.004} color="#17201e" shadow={false}/></group>
          <group ref={rightEye} position={[0.09, 1.52, 0.186]}><RBox position={[0, 0, 0]} size={[0.06, 0.07, 0.01]} radius={0.004} color="#17201e" shadow={false}/></group>
          <RBox position={[0, 1.4, 0.186]} size={[0.12, 0.025, 0.01]} radius={0.004} color="#9a5a44" shadow={false}/>
        </group>
      </group>
      {station.id === 'boss' && <RBox position={[0, 1.08, 0.16]} size={[0.07, 0.25, 0.025]} radius={0.01} color="#d9b36b" shadow={false}/>}
      {unknown && <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[0.45, 0.55, 24]}/><meshBasicMaterial color="#e9c47b" transparent opacity={0.85}/></mesh>}
      <object3D ref={anchor} position={[0, 2.05, 0]}/>
    </group>
  </group>
}

// Legs and arms pivot at the hip / shoulder: translate the geometry so its top sits at the origin.
const legGeometry = new THREE.BoxGeometry(0.17, 0.62, 0.2).translate(0, -0.31, 0)
const armGeometry = new THREE.BoxGeometry(0.12, 0.52, 0.14).translate(0, -0.26, 0)

/**
 * Screen-space labels: each frame, project every anchor into the canvas and move its DOM label
 * there directly (no React re-render). Labels live outside the Canvas, so they unmount cleanly
 * and use the page's own styles and focus handling.
 */
function LabelProjector({ anchors, labels }: { anchors: Registry<THREE.Object3D>; labels: Registry<HTMLElement> }) {
  const point = useMemo(() => new THREE.Vector3(), [])
  useFrame(({ camera, size }) => {
    const projected: { element: HTMLElement; x: number; y: number; depth: number }[] = []
    for (const [key, object] of anchors.current) {
      const element = labels.current.get(key)
      if (!element) continue
      let shown = true
      for (let node: THREE.Object3D | null = object; node; node = node.parent) if (!node.visible) { shown = false; break }
      object.getWorldPosition(point).project(camera)
      const visible = shown && point.z < 1 && Math.abs(point.x) <= 1.1 && Math.abs(point.y) <= 1.1
      element.style.visibility = visible ? 'visible' : 'hidden'
      if (visible) projected.push({ element, x: ((point.x + 1) / 2) * size.width, y: ((1 - point.y) / 2) * size.height, depth: point.z })
    }
    // Nearest labels keep their spot; a farther label that would overlap one already placed is
    // lifted above it, so every agent stays readable and clickable.
    projected.sort((a, b) => a.depth - b.depth)
    const placed: { left: number; right: number; top: number; bottom: number }[] = []
    for (const label of projected) {
      const width = label.element.offsetWidth
      const height = label.element.offsetHeight
      const x = Math.min(Math.max(label.x, width / 2 + 4), size.width - width / 2 - 4)
      let bottom = label.y
      const left = x - width / 2
      const right = x + width / 2
      for (let guard = 0; guard < 6; guard += 1) {
        const hit = placed.find((box) => left < box.right && right > box.left && bottom - height < box.bottom && bottom > box.top)
        if (!hit) break
        bottom = hit.top - 4
      }
      placed.push({ left, right, top: bottom - height, bottom })
      label.element.style.transform = `translate(${x}px, ${Math.max(bottom, height + 4)}px) translate(-50%, -100%)`
      label.element.style.zIndex = String(Math.round((1 - label.depth) * 10_000))
    }
  })
  return null
}

export interface ViewHandle { reset: () => void; focus: (target: Vec3, zoom?: number) => void }

/** Orbit (drag), pan (right-drag, two fingers, arrow keys or pan mode) and zoom, kept in bounds. */
const Controls = forwardRef<ViewHandle, { panMode: boolean; keyTarget: HTMLElement | null; layout: OfficeLayout; elevation: number }>(function Controls({ panMode, keyTarget, layout, elevation }, handle) {
  const { camera, gl, size } = useThree()
  const controls = useRef<OrbitControls | null>(null)
  // Room / reset moves glide the camera there instead of cutting.
  const glide = useRef<{ position: THREE.Vector3; target: THREE.Vector3 } | null>(null)
  const { target: cameraTarget, offset: cameraOffset } = layout.camera
  const target = useMemo(() => new THREE.Vector3(...cameraTarget), [cameraTarget])
  const frame = useMemo(() => (animate = false) => {
    const aspect = size.width / Math.max(size.height, 1)
    const offset = new THREE.Vector3(...cameraOffset)
    // Narrow (portrait) views need to back off so the whole building fits across.
    offset.setLength(offset.length() * Math.max(1, 1.2 / aspect))
    const focus = target.clone().set(aspect < 1 ? cameraTarget[0] - 1.4 : cameraTarget[0], cameraTarget[1] + elevation, aspect < 1 ? 0.8 : cameraTarget[2])
    const orbit = controls.current
    if (animate && orbit) { glide.current = { position: focus.clone().add(offset), target: focus.clone() }; return }
    // An undamped update applies and clears any momentum left from an earlier drag,
    // so it has to happen before the camera is placed, not after.
    if (orbit) { orbit.enableDamping = false; orbit.update() }
    camera.position.copy(focus).add(offset)
    camera.lookAt(focus)
    if (!orbit) return
    orbit.target.copy(focus)
    orbit.update()
    orbit.enableDamping = true
  }, [camera, size.width, size.height, target, cameraOffset, cameraTarget, elevation])

  useEffect(() => {
    const orbit = new OrbitControls(camera, gl.domElement)
    orbit.enableDamping = true
    orbit.screenSpacePanning = false // pan across the floor, not up into the sky
    orbit.minDistance = 5
    orbit.maxDistance = 48
    orbit.minPolarAngle = 0.2
    orbit.maxPolarAngle = 1.32
    orbit.rotateSpeed = 0.7
    orbit.zoomSpeed = 0.8
    orbit.addEventListener('start', () => { glide.current = null })
    orbit.keyPanSpeed = 25
    controls.current = orbit
    frame()
    return () => { orbit.dispose(); controls.current = null }
    // frame() only sets the initial view; re-running it on resize is handled below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [camera, gl])
  useEffect(() => { frame() }, [frame])
  useEffect(() => {
    const orbit = controls.current
    if (!orbit) return
    orbit.mouseButtons.LEFT = panMode ? THREE.MOUSE.PAN : THREE.MOUSE.ROTATE
    orbit.mouseButtons.RIGHT = panMode ? THREE.MOUSE.ROTATE : THREE.MOUSE.PAN
    orbit.touches.ONE = panMode ? THREE.TOUCH.PAN : THREE.TOUCH.ROTATE
  }, [panMode])
  useEffect(() => {
    const orbit = controls.current
    if (!orbit || !keyTarget) return
    orbit.listenToKeyEvents(keyTarget)
    return () => orbit.stopListenToKeyEvents()
  }, [keyTarget])
  useImperativeHandle(handle, () => ({
    reset: () => frame(true),
    focus: (targetPosition: Vec3, zoom = 0.58) => {
      const orbit = controls.current
      if (!orbit) { frame(); return }
      const aspect = size.width / Math.max(size.height, 1)
      const offset = new THREE.Vector3(...cameraOffset)
      offset.setLength(offset.length() * Math.max(1, 1.2 / aspect) * zoom)
      const focusPoint = new THREE.Vector3(...targetPosition)
      glide.current = { position: focusPoint.clone().add(offset), target: focusPoint }
    },
  }), [frame, camera, size.width, size.height, cameraOffset])

  useFrame((_, delta) => {
    const orbit = controls.current
    if (!orbit) return
    const goal = glide.current
    if (goal) {
      const k = 1 - Math.exp(-5 * Math.min(delta, 0.05))
      camera.position.lerp(goal.position, k)
      orbit.target.lerp(goal.target, k)
      if (camera.position.distanceToSquared(goal.position) < 0.001 && orbit.target.distanceToSquared(goal.target) < 0.001) glide.current = null
    }
    orbit.update()
    const [x, z] = clampTarget(orbit.target.x, orbit.target.z, layout.pan)
    if (x !== orbit.target.x || z !== orbit.target.z) {
      const shift = new THREE.Vector3(x - orbit.target.x, 0, z - orbit.target.z)
      orbit.target.add(shift)
      camera.position.add(shift)
    }
  })
  return null
})

function register<T>(registry: Registry<T>, key: string) {
  return (value: T | null) => { if (value) registry.current.set(key, value); else registry.current.delete(key) }
}

/** Current time, refreshed every `interval` ms. */
function useClock(interval: number) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), interval)
    return () => window.clearInterval(timer)
  }, [interval])
  return now
}

function useThemeName(): 'dark' | 'light' {
  const read = () => (document.documentElement.dataset.theme === 'light' ? 'light' : 'dark')
  const [theme, setTheme] = useState<'dark' | 'light'>(read)
  useEffect(() => {
    const observer = new MutationObserver(() => setTheme(read()))
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    return () => observer.disconnect()
  }, [])
  return theme
}

/** Day in the light theme; evening in the dark theme, when the lamps in the scene switch on. */
function Lighting({ theme }: { theme: 'dark' | 'light' }) {
  const day = theme === 'light'
  return <>
    <color attach="background" args={[day ? '#bfe0ef' : '#1a2335']}/>
    <fog attach="fog" args={[day ? '#bfe0ef' : '#1a2335', 38, 75]}/>
    <hemisphereLight args={[day ? '#fff4e0' : '#7f95bd', day ? '#5d7a4c' : '#1e2620', day ? 1.1 : 0.32]}/>
    <directionalLight position={[10, 16, 9]} intensity={day ? 2.4 : 0.75} color={day ? '#fff1d6' : '#ff9a5a'} castShadow shadow-mapSize={[2048, 2048]} shadow-bias={-0.0004} shadow-camera-left={-16} shadow-camera-right={16} shadow-camera-top={16} shadow-camera-bottom={-16} shadow-camera-far={60}/>
    <ambientLight intensity={day ? 0.35 : 0.14} color={day ? '#ffffff' : '#8fa4d8'}/>
  </>
}

const FLOORS: { floor: Floor; label: string; title: string }[] = [
  { floor: 2, label: 'Kamar & Balkon', title: 'Lantai 2: bedroom, lesehan and balcony' },
  { floor: 1, label: 'Kantor', title: 'Lantai 1: office, lounge, pantry and game room' },
]
/**
 * Daily routine times are interpreted in Asia/Jakarta (WIB).
 * The approximate sunset prayer times can be adjusted here without changing the schedule engine.
 */
const PRAYER_TIMES = {
  fajr: { start: 4 * 60 + 30, end: 5 * 60 },
  dhuhr: { start: 12 * 60, end: 12 * 60 + 30 },
  asr: { start: 16 * 60, end: 16 * 60 + 30 },
  maghrib: { start: 18 * 60 + 5, end: 18 * 60 + 25 },
  isha: { start: 19 * 60 + 15, end: 19 * 60 + 35 },
} as const

type DailyStop = 'desk' | 'meeting' | 'bathroom' | 'bathroom-queue' | 'bedroom' | 'tidur' | 'musholla' | 'dining' | 'bakso' | 'dapur' | 'lounge' | 'kopi' | 'galon' | 'game' | 'arcade' | 'balkon'
type RoutineAction = { stop: DailyStop; state: OfficeStation['state']; activity: string; displayState: string; queueRank?: number }
type SimulatedStation = OfficeStation & { routineStop: DailyStop; queueRank?: number }

function jakartaMinuteOfDay(timestamp: number): number {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(new Date(timestamp))
  const hour = Number(parts.find((part) => part.type === 'hour')?.value ?? 0)
  const minute = Number(parts.find((part) => part.type === 'minute')?.value ?? 0)
  return hour * 60 + minute
}

/** Deterministic per-agent routine: staggered bathroom turns and varied shared-space destinations. */
function dailyRoutine(station: OfficeStation, minute: number, crewCount: number): RoutineAction {
  const seat = Math.max(station.seat, 1)
  const count = Math.max(crewCount, 1)
  const action = (stop: DailyStop, state: OfficeStation['state'], activity: string, displayState = activity, queueRank?: number): RoutineAction => ({
    stop, state, activity, displayState, ...(queueRank === undefined ? {} : { queueRank }),
  })
  const choice = (stops: DailyStop[], offset = 0) => stops[(seat - 1 + offset) % stops.length]
  const work = (wrapUp = false): RoutineAction => {
    const reviewing = wrapUp ? seat % 2 === 0 : seat % 4 === 0
    return action('desk', reviewing ? 'Reviewing' : 'Working', wrapUp ? (reviewing ? 'Reviewing final tasks' : 'Finishing work') : (reviewing ? 'Reviewing code and notes' : 'Working at the computer'), reviewing ? 'Reviewing' : 'Working')
  }
  const prayer = (name: string) => action('musholla', 'Idle', name, 'Praying')
  const headingToPrayer = () => action('musholla', 'Idle', 'Heading to the musholla', 'Heading to prayer')

  // Sleep is a fixed window, including after midnight, so agents never wake between schedule slots.
  if (minute >= 22 * 60 || minute < PRAYER_TIMES.fajr.start) {
    return action('tidur', 'Idle', 'Sleeping', 'Asleep')
  }
  if (minute < PRAYER_TIMES.fajr.end) return prayer('Fajr prayer')
  if (minute < 6 * 60) {
    // Six-minute turns give each agent a bathroom/shower slot while the rest get ready by their beds.
    const turn = Math.floor((minute - 5 * 60) / 6)
    const bathroomSeat = turn + 1
    if (seat - 1 < turn) return action('bedroom', 'Idle', 'Getting dressed after showering', 'Getting ready')
    if (seat === bathroomSeat) return action('bathroom', 'Idle', 'Showering · brushing teeth', 'Bathroom turn')
    if (turn >= count) return action('bedroom', 'Idle', 'Getting dressed for work', 'Getting ready')
    return action('bathroom-queue', 'Idle', `Waiting in bathroom queue · ${seat - turn - 1}`, 'In queue', seat - turn - 2)
  }
  if (minute < 7 * 60) return action('dining', 'Idle', 'Breakfast · eating and chatting', 'Breakfast')
  if (minute < 8 * 60) {
    return minute < 7 * 60 + 20
      ? action('bedroom', 'Idle', 'Getting dressed and preparing for work', 'Getting ready')
      : action('desk', 'Idle', 'Walking to the workplace', 'Heading to work')
  }
  if (minute >= PRAYER_TIMES.dhuhr.start - 10 && minute < PRAYER_TIMES.dhuhr.start) return headingToPrayer()
  if (minute < PRAYER_TIMES.dhuhr.start) return work()
  if (minute < PRAYER_TIMES.dhuhr.end) return prayer('Dhuhr prayer')
  if (minute < 14 * 60) return action('dining', 'Idle', 'Lunch · eating with colleagues', 'Lunch break')
  if (minute < 15 * 60 + 30) {
    const block = Math.floor((minute - 14 * 60) / 30)
    const joinsMeeting = (seat + block) % 3 === 0
    return joinsMeeting
      ? action('meeting', 'Collaborating', 'Team sync · sharing progress', 'In a meeting')
      : work()
  }
  if (minute < PRAYER_TIMES.asr.start - 10) {
    const stop = choice(['kopi', 'galon', 'bakso', 'lounge'], Math.floor((minute - (15 * 60 + 30)) / 10))
    const activity = stop === 'kopi' ? 'Coffee break' : stop === 'galon' ? 'Getting a drink of water' : 'Snack break · socializing'
    return action(stop, 'Idle', activity, 'Break')
  }
  if (minute < PRAYER_TIMES.asr.start) return headingToPrayer()
  if (minute < PRAYER_TIMES.asr.end) return prayer('Asr prayer')
  if (minute < 17 * 60 + 30) return work(true)
  if (minute < PRAYER_TIMES.maghrib.start - 10) {
    return action(choice(['lounge', 'balkon', 'game']), 'Idle', 'Unwinding after work', 'After work')
  }
  if (minute < PRAYER_TIMES.maghrib.start) return headingToPrayer()
  if (minute < PRAYER_TIMES.maghrib.end) return prayer('Maghrib prayer')
  if (minute < PRAYER_TIMES.isha.start - 10) return action('dining', 'Idle', 'Dinner · eating and talking', 'Dinner')
  if (minute < PRAYER_TIMES.isha.start) return headingToPrayer()
  if (minute < PRAYER_TIMES.isha.end) return prayer('Isha prayer')
  if (minute < 21 * 60 + 30) {
    const offset = Math.floor((minute - PRAYER_TIMES.isha.end) / 20)
    const stop = choice(['lounge', 'game', 'arcade', 'balkon', 'dining'], offset)
    const activity = stop === 'lounge' ? 'Watching TV and chatting'
      : stop === 'game' || stop === 'arcade' ? 'Playing games together'
      : stop === 'balkon' ? 'Reading and relaxing on the balcony'
      : 'Relaxing around the dining tables'
    return action(stop, 'Idle', activity, 'Leisure')
  }
  if (minute < 22 * 60) {
    const turn = Math.floor((minute - (21 * 60 + 30)) / 3)
    const bathroomSeat = turn + 1
    if (seat - 1 < turn) return action('bedroom', 'Idle', 'Getting ready for bed after brushing teeth', 'Getting ready for bed')
    if (seat === bathroomSeat) return action('bathroom', 'Idle', 'Brushing teeth before bed', 'Bedtime routine')
    if (turn >= count) return action('bedroom', 'Idle', 'Settling down for sleep', 'Getting ready for bed')
    return action('bathroom-queue', 'Idle', `Waiting for the sink · queue ${seat - turn - 1}`, 'In queue', seat - turn - 2)
  }
  return action('tidur', 'Idle', 'Sleeping', 'Asleep')
}

const BATHROOM_SPOTS: Placement[] = [
  { position: [8.2, FLOOR_HEIGHT, -3.75], facing: Math.PI, seated: false, label: 'Shower' },
]

const FLOOR_KEY = 'mc.officeFloor'
const SLEEP_KEY = 'mc.officeSleep'

/** An on/off preference kept per browser. */
function useStoredFlag(key: string): [boolean, (value: boolean) => void] {
  const [value, setValue] = useState(() => { try { return localStorage.getItem(key) === '1' } catch { return false } })
  return [value, (next: boolean) => {
    setValue(next)
    try { localStorage.setItem(key, next ? '1' : '0') } catch { /* per-browser convenience only */ }
  }]
}

function useFloor(): [Floor, (floor: Floor) => void] {
  const [floor, setFloor] = useState<Floor>(() => {
    try { return localStorage.getItem(FLOOR_KEY) === '2' ? 2 : 1 } catch { return 1 }
  })
  return [floor, (next: Floor) => {
    setFloor(next)
    try { localStorage.setItem(FLOOR_KEY, String(next)) } catch { /* per-browser convenience only */ }
  }]
}

export default function Office3D({ stations: crew, onSelect, themeOverride, focusRoom = 'all', simulationNow = Date.now(), simulationRate = 60 }: { stations: OfficeStation[]; onSelect: (station: OfficeStation, trigger: HTMLElement | null) => void; themeOverride?: 'dark' | 'light'; focusRoom?: string; simulationNow?: number; simulationRate?: number }) {
  const anchors = useRef(new Map<string, THREE.Object3D>())
  const labels = useRef(new Map<string, HTMLElement>())
  const view = useRef<ViewHandle>(null)
  const [panMode, setPanMode] = useState(false)
  const [keyTarget, setKeyTarget] = useState<HTMLElement | null>(null)
  const documentTheme = useThemeName()
  const theme = themeOverride ?? documentTheme
  const [floor, setFloor] = useFloor()
  const [sleepMode, setSleepMode] = useStoredFlag(SLEEP_KEY)
  const prayerSession = useRef({ key: '', startedAt: 0 })
  const now = useClock(2000)
  const scheduleMinute = jakartaMinuteOfDay(simulationNow)
  const stations = crew.map((station): SimulatedStation => {
    const routine = dailyRoutine(station, scheduleMinute, crew.length)
    const action = sleepMode && routine.state === 'Idle' && routine.stop !== 'tidur'
      ? { ...routine, stop: 'tidur' as const, activity: 'Sleeping · manual sleep mode', displayState: 'Asleep' }
      : routine
    const atDesk = action.stop === 'desk'
    const inMeeting = action.stop === 'meeting'
    return {
      ...station,
      state: action.state,
      room: atDesk || inMeeting ? 'Workspace' : 'Lounge',
      roomPosition: inMeeting ? 'meeting-area' : atDesk ? 'desk' : 'daily-life',
      activity: action.activity,
      displayState: action.displayState,
      routineStop: action.stop,
      queueRank: action.queueRank,
    }
  })
  const prayerKey = stations.find((station) => /^(Fajr|Dhuhr|Asr|Maghrib|Isha) prayer$/.test(station.activity))?.activity ?? ''
  if (!prayerKey) {
    prayerSession.current.key = ''
    prayerSession.current.startedAt = 0
  } else if (prayerSession.current.key !== prayerKey) {
    prayerSession.current = { key: prayerKey, startedAt: performance.now() / 1000 }
  }
  const prayerSessionStart = prayerSession.current.startedAt
  const prayerCycleDuration = Math.max(3, 28 * 60 / Math.max(simulationRate, 1))

  // One unlabeled desk per agent (hot desking); the building is sized for the crew.
  const layout = useMemo(() => createLayout(stations.length), [stations.length])
  // Idle agents wander between the lounge, the game room, the pantry, the street food and
  // lantai 2 (decorative only), spread so no two share a spot. With sleep mode on, every idle
  // agent goes to bed upstairs instead.
  const idleSeats = stations.filter((station) => station.state === 'Idle' && station.room === 'Lounge').map((station) => station.seat)
  const plan = idlePlan(idleSeats, now, layout, sleepMode ? idleSeats : [])
  const wandering = (station: OfficeStation) => station.state === 'Idle' && station.room === 'Lounge' ? plan.get(station.seat) : undefined
  // Agents at the meeting table take the next free place around it.
  const meetingOrder = stations.filter((station) => station.roomPosition === 'meeting-area').map((station) => station.id)
  const reservationIndex = (stop: DailyStop, station: SimulatedStation) => stations
    .filter((candidate) => candidate.routineStop === stop)
    .sort((a, b) => a.seat - b.seat)
    .findIndex((candidate) => candidate.id === station.id)
  const placement = (station: SimulatedStation): Placement => {
    const seat = Math.max(station.seat, 1)
    if (station.routineStop === 'desk') return placementFor(station, layout)
    if (station.routineStop === 'meeting') return placementFor(station, layout, Math.max(0, meetingOrder.indexOf(station.id)))
    if (station.routineStop === 'musholla') return mushollaSpot(Math.max(0, reservationIndex('musholla', station)))
    if (station.routineStop === 'dining') return diningSpot(Math.max(0, reservationIndex('dining', station)))
    if (station.routineStop === 'bathroom-queue') return bathroomQueueSpot(Math.max(0, station.queueRank ?? reservationIndex('bathroom-queue', station)))
    if (station.routineStop === 'bathroom') return BATHROOM_SPOTS[0]
    if (station.routineStop === 'bedroom' || station.routineStop === 'tidur') {
      const beds = layout.idleStops.find((stop) => stop.key === 'tidur')
      const bed = beds?.spots[(seat - 1) % (beds.spots.length || 1)]
      if (bed) return station.routineStop === 'tidur'
        ? bed
        : { position: bed.position, facing: bed.facing, seated: false, label: 'Getting ready in the bedroom' }
    }
    const stop = layout.idleStops.find((item) => item.key === station.routineStop)
    const spot = stop?.spots[(seat - 1) % (stop.spots.length || 1)]
    if (spot) return spot
    return wandering(station)?.placement ?? placementFor(station, layout, Math.max(0, meetingOrder.indexOf(station.id)))
  }
  const floorCount = (value: Floor) => stations.filter((station) => floorOf(placement(station).position) === value).length
  const occupiedSeats = new Set(stations.filter((station) => station.room === 'Workspace' && station.roomPosition !== 'meeting-area' && station.state !== 'Offline').map((station) => station.seat))
  useEffect(() => {
    const views: Record<string, { floor: Floor; target: Vec3; zoom: number }> = {
      all: { floor: 1, target: layout.camera.target, zoom: 1 },
      studio: { floor: 1, target: [layout.building.minX / 2 - 1.8, 0, -1.7], zoom: 0.6 },
      meeting: { floor: 1, target: [(layout.meetingRoom.minX + layout.meetingRoom.maxX) / 2, 0, 2.8], zoom: 0.52 },
      lounge: { floor: 1, target: [4.6, 0, -2.8], zoom: 0.48 },
      games: { floor: 1, target: [12.5, 0, -2.5], zoom: 0.48 },
      pantry: { floor: 1, target: [8.2, 0, -2.2], zoom: 0.5 },
      street: { floor: 1, target: [layout.gangCenterX, 0, 1.0], zoom: 0.6 },
      bedroom: { floor: 2, target: [-3.6, FLOOR_HEIGHT, -2.9], zoom: 0.52 },
      bathroom: { floor: 2, target: [8.5, FLOOR_HEIGHT, -4.0], zoom: 0.45 },
      lesehan: { floor: 2, target: [4.3, FLOOR_HEIGHT, -3.0], zoom: 0.5 },
      balcony: { floor: 2, target: [2.6, FLOOR_HEIGHT, 5.4], zoom: 0.5 },
      boss: { floor: 1, target: [layout.desks[0]?.[0] ?? -2, 0, -0.3], zoom: 0.62 },
      focus: { floor: 1, target: [layout.building.minX / 2, 0, -2.5], zoom: 0.58 },
      dining: { floor: 1, target: [8.2, 0, -2.2], zoom: 0.6 },
      pool: { floor: 1, target: layout.camera.target, zoom: 1 },
    }
    const selected = views[focusRoom] ?? views.all
    if (floor !== selected.floor) setFloor(selected.floor)
    const frame = window.requestAnimationFrame(() => view.current?.focus(selected.target, selected.zoom))
    return () => window.cancelAnimationFrame(frame)
    // The room dock sets the floor and camera together; the static layout changes only with crew size.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusRoom, layout])
  return <div className="office-3d" ref={setKeyTarget} tabIndex={0} role="region" aria-label="3D office. Drag to rotate, right-drag or two fingers to pan, scroll to zoom, arrow keys pan when focused. Page Up and Page Down change floors." onKeyDown={(event) => {
    if (event.key === 'PageUp' || event.key === 'PageDown') { event.preventDefault(); setFloor(event.key === 'PageUp' ? 2 : 1) }
  }}>
    <Canvas shadows dpr={[1, 1.75]} camera={{ position: [-3, 13, 16], fov: 40, near: 0.5, far: 150 }} gl={{ antialias: true, powerPreference: 'high-performance' }}>
      <Lighting theme={theme}/>
      <Environment night={theme === 'dark'} layout={layout} floor={floor}/>
      {floor === 1 && layout.desks.map((position, index) => <WorkDesk key={index} position={position} active={occupiedSeats.has(index + 1)} withChair/>)}
      {stations.map((station) => <Character key={station.id} station={station} placement={placement(station)} layout={layout} floor={floor} onSelect={onSelect} prayerSessionStart={prayerSessionStart} prayerCycleDuration={prayerCycleDuration} anchor={register(anchors, `agent-${station.id}`)}/>)}
      <LabelProjector anchors={anchors} labels={labels}/>
      <Controls key={layout.deskCount} ref={view} panMode={panMode} keyTarget={keyTarget} layout={layout} elevation={floor === 2 ? FLOOR_HEIGHT : 0}/>
    </Canvas>
    <div className="office-3d-labels">
      {stations.map((station) => {
        const badge = officeStateBadge(station.state)
        const idle = wandering(station)
        return <button key={station.id} ref={register(labels, `agent-${station.id}`)} type="button" className={`agent-tag-3d state-${station.state.toLowerCase()}`} onClick={(event) => onSelect(station, event.currentTarget)} aria-label={`${station.name}. ${station.state}.${station.activity ? ` ${station.activity}.` : ''}${idle ? ` ${idle.placement.label ?? idle.stop.label}.` : ''} Open station details.`}>
          {station.activity && <span className={`speech speech-3d${/sleep/i.test(station.activity) ? ' speech-sleep' : ''}`}>{station.activity}</span>}
          {!station.activity && idle && <span className={`speech speech-3d speech-idle${idle.placement.pose === 'lie' ? ' speech-sleep' : ''}`}>{idle.placement.pose === 'lie' ? '💤 ' : ''}{idle.placement.label ?? idle.stop.label}</span>}
          <span className="agent-tag-row"><span className="pixel-station-name">{station.privacy === 'locked' ? '🔒 ' : ''}{station.name}</span><span className={`badge ${badge.tone}`}>{station.displayState ?? (station.state === 'Idle' ? 'Idle' : station.state)}</span></span>
        </button>
      })}
    </div>
    <div className="office-3d-floors" role="group" aria-label="Floors">
      {FLOORS.map((item) => <button key={item.floor} type="button" className={floor === item.floor ? 'active' : ''} aria-pressed={floor === item.floor} onClick={() => setFloor(item.floor)} title={`${item.title} (Page ${item.floor === 2 ? 'Up' : 'Down'})`}>
        <b>{item.floor}</b><span>{item.label}</span><small>{floorCount(item.floor)}</small>
      </button>)}
    </div>
    <div className="office-3d-tools">
      <button type="button" className={sleepMode ? 'active sleep' : ''} aria-pressed={sleepMode} onClick={() => { setSleepMode(!sleepMode); if (!sleepMode && idleSeats.length > 0) setFloor(2) }} title="Send every idle agent to bed on lantai 2">💤 Tidur</button>
      <button type="button" className={panMode ? 'active' : ''} aria-pressed={panMode} onClick={() => setPanMode((value) => !value)} title="Drag moves the view instead of rotating it">✥ Geser</button>
      <button type="button" onClick={() => view.current?.reset()} title="Back to the starting view">↺ Reset view</button>
    </div>
  </div>
}
