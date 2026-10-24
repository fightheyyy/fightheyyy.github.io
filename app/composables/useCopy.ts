export function useCopy() {
  const message = ref('')
  let timer: ReturnType<typeof setTimeout> | undefined
  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text)
      message.value = 'Copied'
    } catch {
      message.value = 'Could not copy. Please select the text.'
    }
    clearTimeout(timer)
    timer = setTimeout(() => {
      message.value = ''
    }, 2600)
  }
  onBeforeUnmount(() => clearTimeout(timer))
  return { copy, message }
}
