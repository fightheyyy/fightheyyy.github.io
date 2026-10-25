<script setup lang="ts">
const root = useTemplateRef<HTMLElement>('root')
const landscape = useTemplateRef<SVGSVGElement>('landscape')
const horizon = useTemplateRef<SVGPathElement>('horizon')
const awake = ref(false)
const stroll = useMeadowWalk(awake, horizon)
const gaze = reactive({ x: 0, y: 0 })
let observer: IntersectionObserver | undefined
let reducedMotion = false
function look(event: PointerEvent) {
  if (reducedMotion || !root.value || event.pointerType === 'touch') return
  const bounds = root.value.getBoundingClientRect()
  gaze.x = Math.max(-1, Math.min(1, (event.clientX - bounds.left) / bounds.width * 2 - 1))
  gaze.y = Math.max(-1, Math.min(1, (event.clientY - bounds.top) / bounds.height * 2 - 1))
  const matrix = landscape.value?.getScreenCTM()
  if (matrix) {
    const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse())
    stroll.notice(point.x, point.y)
  }
}
function rest() { gaze.x = 0; gaze.y = 0; stroll.forget() }
const eyeOffset = computed(() => `translate(${gaze.x * 2.5} ${gaze.y * 1.5})`)
onMounted(() => {
  reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches
  observer = new IntersectionObserver(entries => { awake.value = entries.some(entry => entry.isIntersecting) })
  if (root.value) observer.observe(root.value)
})
onBeforeUnmount(() => observer?.disconnect())
</script>

<template>
  <section id="garden" ref="root" class="cat-dream" :class="{ 'is-awake': awake }" aria-label="小八的梦游花园" @pointermove="look" @pointerleave="rest">
    <VisitConstellation />
    <svg ref="landscape" class="dream-landscape" viewBox="0 0 1200 500" fill="none" aria-hidden="true">
      <path ref="horizon" class="dream-horizon" d="M-30 427C156 358 282 395 432 405S702 451 886 392s249-34 346-8" />
      <path class="dream-far-hill" d="M-20 439c151-36 259-10 354 14m416-18c175 0 247-60 476-21" />
      <g class="dream-sun-anchor" transform="translate(-214 -143)"><g class="dream-sun">
        <g class="dream-rays"><path d="M214 74V62m0 132v-12m-54-54h-12m132 0h-12m-92-38-8-8m92 92-8-8m-76 0-8 8m92-92-8 8"/></g>
        <path class="dream-sun-body" d="M174 115v-29q0-6 6-2l21 14a40 40 0 0 1 26 0l21-14q6-4 6 2v29a42 42 0 1 1-80 0Z"/>
        <g :transform="eyeOffset"><g class="dream-eyes"><rect x="199" y="119" width="5" height="13" rx="2.5"/><rect x="223" y="119" width="5" height="13" rx="2.5"/></g></g>
      </g>
      </g><g class="dream-cloud-anchor" transform="translate(-730 -130)"><g class="dream-cloud">
        <path class="dream-cloud-body" d="M825 176c-24 1-29-31-8-39 0-16 12-24 24-20l5-18q2-6 6-1l13 17q12-2 21 4l15-14q5-4 6 3l3 24c24-1 34 40 5 44Z"/>
        <g :transform="eyeOffset"><g class="dream-eyes"><rect x="855" y="143" width="4" height="11" rx="2"/><rect x="875" y="143" width="4" height="11" rx="2"/></g></g>
      </g>
      </g><g class="dream-star-anchor" transform="translate(317 -238)"><g class="dream-star">
        <path class="dream-star-body" d="m755 231 7 16 17 1q4 0 1 4l-13 11 4 17q1 4-3 2l-15-9-15 9q-4 2-3-2l4-17-13-11q-3-4 1-4l17-1 7-16q2-4 4 0Z"/>
        <g :transform="eyeOffset"><g class="dream-eyes"><rect x="745" y="253" width="3" height="7" rx="1.5"/><rect x="757" y="253" width="3" height="7" rx="1.5"/></g></g>
      </g>
      </g><g class="dream-moon-anchor" transform="translate(200 -300)"><g class="dream-moon">
        <path class="dream-moon-body" d="M1003 254c-8 24 5 45 28 47-15 24-52 21-60-7-6-21 8-43 32-40Z"/>
        <path class="dream-moon-eye" d="m984 285 5 2 4-3"/>
      </g>
      </g><g class="dream-grass">
        <path class="dream-stem" d="M291 402v-45m0 30c-16-1-25-12-23-25 16 0 25 9 23 25m0-10c16-1 25-12 23-25-16 0-25 9-23 25"/>
        <path class="dream-grass-body" d="M277 346v-21l11 9h7l12-9v21c0 19-30 19-30 0Z"/>
        <g :transform="eyeOffset"><g class="dream-eyes"><rect x="285" y="344" width="3" height="7" rx="1.5"/><rect x="296" y="344" width="3" height="7" rx="1.5"/></g></g>
      </g>
      <g class="dream-sprout"><path class="dream-stem" d="M889 395v-28m0 11c-16 1-23-6-23-17 15-3 23 5 23 17m0-5c14 0 19-9 17-18-13 0-19 7-17 18"/></g>
      <g class="dream-petal">
        <path class="dream-flower-stem" d="M106 344v59m0-13c-10 0-15-6-15-14 10 0 15 5 15 14"/>
        <path class="dream-petal-body" d="M106 337c-20-23-39-12-29 7 5 9 17 9 29 0-7 19 5 28 15 16 6-8 0-17-15-23 21-10 23-28 8-29-12-1-17 11-8 29Z"/>
        <circle class="dream-petal-heart" cx="106" cy="339" r="4"/>
      </g>
      <g class="dream-meadow-details"><path d="m173 406 2-9 3 9m565 17 3-12 3 12m269-27 2-8 3 8"/><circle cx="443" cy="431" r="2"/><circle cx="817" cy="443" r="1.5"/></g>
      <g :transform="stroll.transform.value">
        <ellipse class="dream-cat-shadow" cx="0" cy="0" rx="30" ry="2" />
      </g>
    </svg>
    <!-- Match the SVG viewBox in HTML: Safari can mispaint Canvas inside foreignObject. -->
    <div class="dream-traveler-stage" aria-hidden="true">
      <div class="dream-traveler-anchor" :style="{ left: `${stroll.body.x / 12}%`, top: `${stroll.body.y / 5}%`, transform: `rotate(${stroll.body.angle}deg)` }">
        <div class="dream-traveler" :style="{ transform: `translateY(${stroll.body.bob / 91 * 100}%) scaleY(${stroll.body.squash})` }">
          <XiaobaMascot fluid :size="84" variant="agents" :animated="awake" :pose="stroll.pose.value" :flip="stroll.flip.value" :gaze-enabled="stroll.looking.value" :attention="stroll.attention.value" />
        </div>
      </div>
    </div>
  </section>
</template>
