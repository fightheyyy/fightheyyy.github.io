import { readingProgress } from '~~/shared/editorial'
export function useReadingPosition(body: Ref<HTMLElement | null>) {
  const progress = ref(0)
  const activeId = ref('')
  const titleVisible = ref(false)
  let observer: IntersectionObserver | undefined
  let resize: ResizeObserver | undefined
  let frame = 0
  function update() {
    const element = body.value
    if (!element) return
    const bounds = element.getBoundingClientRect()
    progress.value = readingProgress(bounds.top, bounds.height, window.innerHeight)
    titleVisible.value = bounds.top < 100
    const headings = [...element.querySelectorAll<HTMLElement>('h2[id], h3[id]')]
    activeId.value =
      (
        headings.filter((heading) => heading.getBoundingClientRect().top <= 150).at(-1) ??
        headings[0]
      )?.id ?? ''
  }
  function schedule() {
    cancelAnimationFrame(frame)
    frame = requestAnimationFrame(update)
  }
  onMounted(() => {
    observer = new IntersectionObserver(schedule, { rootMargin: '-5% 0px -70% 0px' })
    body.value?.querySelectorAll('h2[id],h3[id]').forEach((heading) => observer?.observe(heading))
    resize = new ResizeObserver(schedule)
    if (body.value) resize.observe(body.value)
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    schedule()
  })
  onBeforeUnmount(() => {
    observer?.disconnect()
    resize?.disconnect()
    cancelAnimationFrame(frame)
    window.removeEventListener('scroll', schedule)
    window.removeEventListener('resize', schedule)
  })
  return { progress, activeId, titleVisible }
}
