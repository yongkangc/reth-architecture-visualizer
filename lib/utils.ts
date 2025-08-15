import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export function formatHex(value: string | number, length: number = 8): string {
  const hex = typeof value === 'string' ? value : value.toString(16)
  const cleaned = hex.replace('0x', '')
  return '0x' + cleaned.slice(0, length) + (cleaned.length > length ? '...' : '')
}

export function randomHex(length: number = 32): string {
  const chars = '0123456789abcdef'
  let result = '0x'
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * 16)]
  }
  return result
}