<script setup lang="ts">
import { demoTraffic, type TrafficSnapshot } from '~~/shared/traffic'

const props = defineProps<{ data?: TrafficSnapshot }>()
const snapshot = computed(() => props.data ?? demoTraffic)
const root = useTemplateRef<HTMLElement>('root')
const size = reactive({ width: 1440, height: 540 })
const selected = ref<number | null>(null)
let observer: ResizeObserver | undefined

// Four loose groups leave the center open. Connections are only revealed
// during interaction so the resting scene remains a quiet starfield.
const anchors = [
  [173, 140], [230, 108], [288, 119], [331, 167], [403, 162], [446, 119], [418, 70],
  [547, 86], [619, 108], [691, 54], [778, 97], [835, 49], [893, 81], [950, 27],
  [1066, 140], [1195, 130], [1109, 200], [1152, 211], [1210, 216], [1066, 286], [1238, 297],
  [82, 232], [151, 264], [220, 248], [259, 302], [345, 329], [402, 286], [457, 351],
] as const
function noise(seed: number) {
  const value = Math.sin(seed * 127.1 + 311.7) * 43758.5453
  return value - Math.floor(value)
}
const stars = computed(() => {
  const peak = Math.max(1, ...snapshot.value.days.map(day => day.visits))
  const scale = Math.max(.55, Math.min(1, size.width / 1100))
  return snapshot.value.days.slice(-28).map((day, index) => {
    const anchor = anchors[index]!
    const x = Math.max(25, Math.min(size.width - 25, anchor[0] / 1440 * size.width))
    const y = anchor[1] / 540 * size.height
    const strength = Math.sqrt(Math.max(0, day.visits) / peak)
    return { ...day, index, x, y, radius: (.65 + strength * 1.55) * scale, opacity: .3 + strength * .55, sparkle: strength > .88 }
  })
})
const dust = computed(() => Array.from({ length: 510 }, (_, index) => {
  const x = noise(index * 11 + 7001)
  const y = noise(index * 13 + 1703) * .75
  const inOpenMiddle = Math.hypot((x - .5) / .24, (y - .43) / .32) < 1
  return { x: x * size.width, y: y * size.height, r: .35 + Math.pow(noise(index + 215), 4) * .95, opacity: .25 + noise(index + 31) * .4, visible: !inOpenMiddle || index % 5 === 0 }
}).filter(point => point.visible))
const planet = computed(() => {
  const scale = Math.max(.48, Math.min(1, size.width / 1200))
  const radius = 118 * scale
  const x = size.width - 20 * scale
  const y = size.height * .42
  const points: { x: number; y: number; r: number; opacity: number }[] = []
  // Ordered halftone dots describe a sphere and its tilted orbit, rather than
  // decorating every date with an unrelated blob.
  for (let row = -23; row <= 23; row++) {
    for (let col = -38; col <= 23; col++) {
      const px = col * 6 * scale
      const py = row * 6 * scale
      const distance = Math.hypot(px, py) / radius
      const orbitX = px * .91 - py * .415
      const orbitY = px * .415 + py * .91
      const orbit = Math.hypot(orbitX / (radius * 1.68), orbitY / (radius * .24))
      const onOrbit = Math.abs(orbit - 1) < .075 && distance > 1.08
      if (distance > 1 && !onOrbit) continue
      const light = Math.sqrt(Math.max(0, 1 - distance * distance))
      points.push({ x: x + px, y: y + py, r: (onOrbit ? .65 : .25 + light * 1.5) * scale, opacity: onOrbit ? .4 : .18 + light * .48 })
    }
  }
  return points
})
const active = computed(() => selected.value === null ? undefined : stars.value[selected.value])
const activeConstellation = computed(() => {
  if (selected.value === null) return undefined
  const start = Math.floor(selected.value / 7) * 7
  return stars.value.slice(start, start + 7).map(star => `${star.x},${star.y}`).join(' ')
})
const tooltipStyle = computed(() => active.value ? {
  left: `${Math.max(12, Math.min(size.width - 190, active.value.x - 82))}px`,
  top: `${Math.max(12, Math.min(size.height - 78, active.value.y - 79))}px`,
} : {})
function dateLabel(date: string) {
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', timeZone: 'UTC' }).format(new Date(`${date}T00:00:00Z`))
}
function move(event: KeyboardEvent) {
  if (event.key === 'Escape') { selected.value = null; return }
  if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
  event.preventDefault()
  const last = stars.value.length - 1
  if (event.key === 'Home') selected.value = 0
  else if (event.key === 'End') selected.value = last
  else selected.value = ((selected.value ?? -1) + (event.key === 'ArrowLeft' ? -1 : 1) + stars.value.length) % stars.value.length
}

const glyphs: Record<string, string[]> = {
  '0': ['01110', '10001', '10011', '10101', '11001', '10001', '01110'],
  '1': ['00100', '01100', '00100', '00100', '00100', '00100', '01110'],
  '2': ['01110', '10001', '00001', '00010', '00100', '01000', '11111'],
  '3': ['11110', '00001', '00001', '01110', '00001', '00001', '11110'],
  '4': ['00010', '00110', '01010', '10010', '11111', '00010', '00010'],
  '5': ['11111', '10000', '10000', '11110', '00001', '00001', '11110'],
  '6': ['01110', '10000', '10000', '11110', '10001', '10001', '01110'],
  '7': ['11111', '00001', '00010', '00100', '01000', '01000', '01000'],
  '8': ['01110', '10001', '10001', '01110', '10001', '10001', '01110'],
  '9': ['01110', '10001', '10001', '01111', '00001', '00001', '01110'],
  ',': ['0', '0', '0', '0', '0', '1', '1'],
}
const totalLabel = computed(() => Math.max(0, Math.floor(snapshot.value.total)).toLocaleString('en-US'))
const totalDots = computed(() => {
  let offset = 0
  const points: { x: number; y: number }[] = []
  for (const character of totalLabel.value) {
    const glyph = glyphs[character]!
    glyph.forEach((row, y) => [...row].forEach((pixel, x) => {
      if (pixel === '1') points.push({ x: (offset + x) * 4 + 2, y: y * 4 + 2 })
    }))
    offset += glyph[0]!.length + 2
  }
  return { points, width: offset * 4 - 6 }
})
onMounted(() => {
  if (!root.value) return
  observer = new ResizeObserver(([entry]) => {
    if (entry) { size.width = entry.contentRect.width; size.height = entry.contentRect.height }
  })
  observer.observe(root.value)
})
onBeforeUnmount(() => observer?.disconnect())
</script>

<template>
  <div ref="root" class="visit-constellation" @pointerleave="selected = null">
    <svg
      class="visit-sky" :viewBox="`0 0 ${size.width} ${size.height}`" preserveAspectRatio="none"
      role="group" :aria-label="`最近四周每日访问量${snapshot.source === 'demo' ? '，演示数据' : ''}，左右方向键浏览日期`"
      tabindex="0" @keydown="move" @focus="selected = 0" @blur="selected = null"
    >
      <g class="visit-dust" aria-hidden="true"><circle v-for="(point, index) in dust" :key="index" :cx="point.x" :cy="point.y" :r="point.r" :opacity="point.opacity" /></g>
      <g class="visit-planet" aria-hidden="true"><circle v-for="(point, index) in planet" :key="index" :cx="point.x" :cy="point.y" :r="point.r" :opacity="point.opacity" /></g>
      <polyline v-if="activeConstellation" class="visit-star-trail" :points="activeConstellation" aria-hidden="true" />
      <g v-for="star in stars" :key="star.date" class="visit-star" :class="{ 'is-selected': selected === star.index }"
        :transform="`translate(${star.x} ${star.y})`"
        @pointerenter="selected = star.index" @pointerleave="selected = null" @click="selected = star.index">
        <circle r="17" class="visit-hit-area" />
        <circle :r="star.radius" :opacity="star.opacity" />
        <path v-if="star.sparkle" class="visit-star-shine" d="M-5 0h10M0-5v10" />
        <circle v-if="selected === star.index" class="visit-star-ring" r="8" />
      </g>
    </svg>
    <div v-if="active" class="visit-tooltip" :style="tooltipStyle" role="status">
      <span>{{ dateLabel(active.date) }}<span v-if="snapshot.source === 'demo'"> · DEMO</span></span>
      <strong>{{ active.visits.toLocaleString('en-US') }} <span>visits</span></strong>
    </div>
    <div class="visit-period"><span>LAST 4 WEEKS</span><span v-if="snapshot.source === 'demo'" class="visit-demo-label">演示数据</span></div>
    <div class="visit-total" :aria-label="`累计访问量 ${totalLabel}${snapshot.source === 'demo' ? '，演示数据' : ''}`">
      <svg :viewBox="`0 0 ${totalDots.width} 30`" :style="{ width: `${totalDots.width}px` }" aria-hidden="true">
        <circle v-for="(point, index) in totalDots.points" :key="index" :cx="point.x" :cy="point.y" r="1.15" />
      </svg>
      <span>TOTAL VISITS<span v-if="snapshot.source === 'demo'"> · DEMO</span></span>
    </div>
  </div>
</template>
