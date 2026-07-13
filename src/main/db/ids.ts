import { randomUUID } from 'node:crypto'

export function newId(): string {
  return randomUUID()
}

export function now(): number {
  return Date.now()
}
