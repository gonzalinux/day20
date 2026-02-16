import { ref } from 'vue'

export type ToastVariant = 'success' | 'error' | 'warning'

const DEFAULT_DURATIONS: Record<ToastVariant, number> = {
  success: 1500,
  error: 3000,
  warning: 4000,
}

const visible = ref(false)
const message = ref('')
const variant = ref<ToastVariant>('success')
let timer: ReturnType<typeof setTimeout> | null = null

export function useToast() {
  function show(msg: string, v: ToastVariant = 'success', duration?: number) {
    if (timer) clearTimeout(timer)
    message.value = msg
    variant.value = v
    visible.value = true
    timer = setTimeout(() => (visible.value = false), duration ?? DEFAULT_DURATIONS[v])
  }

  return { visible, message, variant, show }
}
