<script setup lang="ts">
import { loadXiaobaMascot, type XiaobaPlayer } from '~/utils/xiaoba-mascot'
import { xiaobaLooks, type XiaobaLook } from '~/utils/xiaoba-looks'
const props = withDefaults(defineProps<{ size?: number; animated?: boolean; variant?: XiaobaLook; pose?: string; reaction?: number; flip?: boolean; gazeEnabled?: boolean; attention?: { x: number; y: number } }>(), { size: 64, animated: true, gazeEnabled: true })
const base = useRuntimeConfig().app.baseURL
const root = useTemplateRef<HTMLElement>('root')
const canvas = useTemplateRef<HTMLCanvasElement>('canvas')
const ready = ref(false)
let player: XiaobaPlayer | undefined
let observer: IntersectionObserver | undefined
let motion: MediaQueryList | undefined
let returnToIdle: ReturnType<typeof setTimeout> | undefined
let inView = false
let disposed = false
const restingState = computed(() => props.pose || (props.variant ? xiaobaLooks[props.variant].pose : 'idle'))

function syncPlayback() {
  if (!player) return
  player.destroy()
  player.reducedMotion = motion?.matches ?? false
  if (inView && !document.hidden && !player.reducedMotion && props.animated) player.start()
  else player.draw()
}
function greet() {
  if (!player || motion?.matches || !props.animated || !props.gazeEnabled) return
  clearTimeout(returnToIdle)
  player.setState('waving')
  returnToIdle = setTimeout(() => player?.setState(restingState.value), 1800)
}
function followPointer(event: PointerEvent) {
  if (!player || !inView || motion?.matches || !props.animated || !props.gazeEnabled || event.pointerType === 'touch' || !root.value) return
  const bounds = root.value.getBoundingClientRect()
  const reach = Math.max(160, Math.min(window.innerWidth, window.innerHeight) * 0.4)
  player.setGaze((event.clientX - bounds.left - bounds.width / 2) / reach * (props.flip ? -1 : 1), (event.clientY - bounds.top - bounds.height / 2) / reach)
}
function resetGaze() { player?.setGaze(0, 0) }

onMounted(async () => {
  motion = matchMedia('(prefers-reduced-motion: reduce)')
  motion.addEventListener('change', syncPlayback)
  document.addEventListener('visibilitychange', syncPlayback)
  window.addEventListener('pointermove', followPointer, { passive: true })
  document.addEventListener('pointerleave', resetGaze)
  window.addEventListener('blur', resetGaze)
  if (root.value) {
    observer = new IntersectionObserver(entries => { inView = entries.some(entry => entry.isIntersecting); syncPlayback() })
    observer.observe(root.value)
  }
  try {
    const { runtime, manifest } = await loadXiaobaMascot(base)
    if (disposed || !canvas.value) return
    player = new runtime.PetPlayer(canvas.value)
    const look = props.variant ? xiaobaLooks[props.variant] : undefined
    const source = look ? {
      ...(manifest as Record<string, unknown>),
      coat: { tips: look.tips, gold: look.gold, cream: look.cream },
      roleThemes: { base: { body: look.gold, eyes: look.eyes, outline: null } },
    } : manifest
    player.load(source, { autoplay: false })
    player.setState(restingState.value)
    ready.value = true
    syncPlayback()
  } catch {
    // The matching static cat remains visible if Canvas cannot initialize.
  }
})
watch(() => props.animated, syncPlayback)
watch(restingState, state => player?.setState(state))
watch(() => props.reaction, greet)
watch(() => props.gazeEnabled, resetGaze)
watch(() => [props.attention?.x, props.attention?.y, props.flip], () => {
  if (props.attention && !motion?.matches) player?.setGaze(props.attention.x * (props.flip ? -1 : 1), props.attention.y)
})
onBeforeUnmount(() => {
  disposed = true
  clearTimeout(returnToIdle)
  observer?.disconnect()
  motion?.removeEventListener('change', syncPlayback)
  document.removeEventListener('visibilitychange', syncPlayback)
  window.removeEventListener('pointermove', followPointer)
  document.removeEventListener('pointerleave', resetGaze)
  window.removeEventListener('blur', resetGaze)
  player?.destroy()
})
</script>

<template>
  <span ref="root" class="xiaoba-mascot" :style="{ width: `${size}px`, height: `${size * 208 / 192}px`, transform: flip ? 'scaleX(-1)' : undefined }" aria-hidden="true" @pointerenter="greet">
    <img v-show="!ready" :src="`${base}mascot/xiaoba/${variant || 'logo'}.svg?v=solid-cobalt-white-v4`" alt="" width="192" height="208" decoding="async" />
    <canvas v-show="ready" ref="canvas" width="384" height="416" />
  </span>
</template>
