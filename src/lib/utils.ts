import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number, currency = 'EUR'): string {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

export function formatPercent(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`
}

export function getVerdictColor(verdict: 'BUY_NOW' | 'GOOD_DEAL' | 'PASS'): string {
  switch (verdict) {
    case 'BUY_NOW':
      return 'text-emerald-400'
    case 'GOOD_DEAL':
      return 'text-yellow-400'
    case 'PASS':
      return 'text-red-400'
  }
}

export function getVerdictBg(verdict: 'BUY_NOW' | 'GOOD_DEAL' | 'PASS'): string {
  switch (verdict) {
    case 'BUY_NOW':
      return 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20'
    case 'GOOD_DEAL':
      return 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20'
    case 'PASS':
      return 'bg-red-400/10 text-red-400 border-red-400/20'
  }
}

export function getVerdictLabel(verdict: 'BUY_NOW' | 'GOOD_DEAL' | 'PASS'): string {
  switch (verdict) {
    case 'BUY_NOW':
      return 'COMPRA ORA'
    case 'GOOD_DEAL':
      return 'BUON AFFARE'
    case 'PASS':
      return 'PASSA'
  }
}
