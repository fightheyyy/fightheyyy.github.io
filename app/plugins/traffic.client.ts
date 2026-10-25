export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.hook('page:finish', () => window.blogTraffic?.track())
})
