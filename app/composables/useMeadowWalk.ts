import type { Ref } from 'vue'

// Walk in the landscape's coordinates, so paws stay on the same curve at every size.
export function useMeadowWalk(awake: Readonly<Ref<boolean>>, horizon: Readonly<Ref<SVGPathElement | null>>) {
  const body = reactive({ x: 593, y: 424, angle: 0, bob: 0, squash: 1 })
  const mode = ref<'walking' | 'resting' | 'looking'>('resting')
  const flip = ref(false)
  let samples: { x: number; y: number }[] = []
  let frameId = 0
  let lastFrame = 0
  let until = 0
  let target = 735
  let pace = 22
  let velocity = 0
  let distanceWalked = 0
  let curiosityAfter = 0
  let pointer: { x: number; y: number; at: number } | undefined
  let motion: MediaQueryList | undefined

  const between = (min: number, max: number) => min + Math.random() * (max - min)
  function ground(x: number) {
    const right = samples.findIndex(point => point.x >= x)
    if (right <= 0) return samples[Math.max(0, right)]?.y ?? 424
    const a = samples[right - 1]!
    const b = samples[right]!
    return a.y + (b.y - a.y) * (x - a.x) / Math.max(b.x - a.x, .001)
  }
  function placeOnGrass() {
    body.y = ground(body.x)
    body.angle = Math.atan2(ground(body.x + 3) - ground(body.x - 3), 6) * 180 / Math.PI * .55
  }
  function walk(now: number) {
    let direction = Math.random() < .5 ? -1 : 1
    if (body.x < 440) direction = 1
    if (body.x > 750) direction = -1
    target = Math.max(365, Math.min(825, body.x + direction * between(110, 230)))
    pace = between(18, 26)
    mode.value = 'walking'
    until = now + 22000
  }
  function pause(now: number, looking = false) {
    mode.value = looking ? 'looking' : 'resting'
    until = now + (looking ? between(2600, 4300) : between(2400, 5500))
    if (looking) curiosityAfter = now + between(8500, 12500)
  }
  function notice(x: number, y: number) { pointer = { x, y, at: performance.now() } }
  function forget() { pointer = undefined }

  function frame(now: number) {
    const dt = lastFrame ? Math.min((now - lastFrame) / 1000, .05) : 0
    lastFrame = now
    const interested = pointer && now - pointer.at < 5000
    if (mode.value === 'walking' && interested && now > curiosityAfter
      && Math.hypot(pointer!.x - body.x, pointer!.y - (body.y - 42)) < 155) pause(now, true)

    if (mode.value !== 'walking' && now >= until) {
      if (mode.value === 'resting' && interested && now > curiosityAfter && Math.random() < .55) pause(now, true)
      else walk(now)
    }
    const difference = target - body.x
    // Ease into a stroll and slow down before reaching a chosen stopping point.
    const desired = mode.value === 'walking'
      ? Math.sign(difference) * Math.min(pace, Math.sqrt(Math.abs(difference) * 12)) : 0
    velocity += (desired - velocity) * (1 - Math.exp(-2.1 * dt))
    if (Math.abs(velocity) < .08) velocity = 0
    const step = velocity * dt
    body.x += step
    distanceWalked += Math.abs(step)
    if (mode.value === 'walking' && (Math.abs(difference) < 1.5 || now >= until)) pause(now)

    if (mode.value === 'looking' && pointer && Math.abs(velocity) < 2) flip.value = pointer.x > body.x
    else if (Math.abs(velocity) > 2) flip.value = velocity > 0
    const energy = Math.min(Math.abs(velocity) / pace, 1)
    body.bob = -Math.abs(Math.sin(distanceWalked * .22)) * 1.3 * energy
    body.squash = 1 - Math.sin(distanceWalked * .44) * .012 * energy
    placeOnGrass()
    frameId = requestAnimationFrame(frame)
  }
  function sync() {
    cancelAnimationFrame(frameId)
    frameId = 0
    lastFrame = 0
    if (!awake.value || document.hidden || motion?.matches) {
      velocity = 0
      mode.value = 'resting'
      body.bob = 0
      body.squash = 1
      return
    }
    until = performance.now() + between(1200, 2200)
    frameId = requestAnimationFrame(frame)
  }
  onMounted(() => {
    if (horizon.value) {
      const path = horizon.value
      const length = path.getTotalLength()
      samples = Array.from({ length: 257 }, (_, i) => {
        const point = path.getPointAtLength(length * i / 256)
        return { x: point.x, y: point.y }
      })
      placeOnGrass()
    }
    motion = matchMedia('(prefers-reduced-motion: reduce)')
    motion.addEventListener('change', sync)
    document.addEventListener('visibilitychange', sync)
    sync()
  })
  watch(awake, sync)
  onBeforeUnmount(() => {
    cancelAnimationFrame(frameId)
    motion?.removeEventListener('change', sync)
    document.removeEventListener('visibilitychange', sync)
  })
  return {
    body, flip, notice, forget,
    looking: computed(() => mode.value === 'looking'),
    attention: computed(() => mode.value === 'looking' && pointer ? {
      x: Math.max(-1, Math.min(1, (pointer.x - body.x) / 150)),
      y: Math.max(-1, Math.min(1, (pointer.y - body.y + 42) / 150)),
    } : undefined),
    pose: computed(() => mode.value === 'walking' ? 'running' : mode.value === 'looking' ? 'waiting' : 'idle'),
    transform: computed(() => `translate(${body.x} ${body.y}) rotate(${body.angle})`),
  }
}
