import { treaty } from '@elysiajs/eden'
import type { App } from '../../../backend'

const baseUrl = import.meta.env.DEV ? 'localhost:3000' : window.location.host

export const api = treaty<App>(baseUrl + '/v1/api', {
  fetch: { credentials: 'include' },
})
