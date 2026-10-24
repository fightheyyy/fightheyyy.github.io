export interface XiaobaPlayer {
  reducedMotion: boolean
  load: (manifest: unknown, options: { autoplay: boolean }) => void
  start: () => void
  destroy: () => void
  draw: () => void
  setState: (state: string) => void
  setGaze: (x: number, y: number) => void
}

interface XiaobaRuntime {
  blogMascotVersion?: string
  PetPlayer: new (canvas: HTMLCanvasElement) => XiaobaPlayer
}

declare global {
  interface Window { XiaoBaPetRuntime?: XiaobaRuntime }
}

let loading: Promise<{ runtime: XiaobaRuntime; manifest: unknown }> | undefined

function script(src: string) {
  return new Promise<void>((resolve, reject) => {
    const element = document.createElement('script')
    element.src = src
    element.async = true
    element.onload = () => resolve()
    element.onerror = () => { element.remove(); reject(new Error(`Could not load mascot asset: ${src}`)) }
    document.head.append(element)
  })
}

export function loadXiaobaMascot(baseURL: string) {
  if (!loading) {
    const base = `${baseURL.replace(/\/?$/, '/')}mascot/xiaoba/`
    loading = (async () => {
      if (window.XiaoBaPetRuntime?.blogMascotVersion !== 'golden-pointer-v1') {
        await script(`${base}grokbot-data.js`)
        await script(`${base}pet-runtime.js?v=golden-pointer-v1`)
      }
      const response = await fetch(`${base}pet.json?v=solid-cobalt-white-v4`)
      if (!response.ok || !window.XiaoBaPetRuntime) throw new Error('XIAOBA mascot is unavailable')
      return { runtime: window.XiaoBaPetRuntime, manifest: await response.json() as unknown }
    })().catch(error => { loading = undefined; throw error })
  }
  return loading
}
