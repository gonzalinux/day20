import { treaty } from '@elysiajs/eden'
import { ValidationError } from 'elysia/error'
import type { App } from '../../../backend'

const baseUrl = import.meta.env.DEV ? 'localhost:3000' : window.location.host

export const api = treaty<App>(baseUrl, {
  fetch: { credentials: 'include' },
}).api.v1

export function throwError(error: unknown): never {
  // @ts-expect-error this error is returned by the bakend on 422
  if (error.value && error.value.summary)
    // @ts-expect-error this error is returned by the bakend on 422
    throw new ValidationErrorEden(error.value.property, error.value.summary)

  throw error
}

export class ValidationErrorEden extends Error {
  constructor(field: string, summary: string) {
    super(`Validation error on field ${field.substring(1, field.length)}: ${summary}`)
    this.name = 'ValidationErrorEden'
  }
}
