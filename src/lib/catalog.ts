import type { SyntheticEvent } from 'react'

export const CONTACTS = {
  primaryEmail: 'tokohkmandiri@gmail.com',
  secondaryEmail: 'tokohkmandiri01@gmail.com',
  phoneDisplay: '+62 819-5181-345',
  phoneDigits: '628195181345',
}

export const formatRupiah = (value: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value)

export function productImageFallback(event: SyntheticEvent<HTMLImageElement>) {
  event.currentTarget.onerror = null
  event.currentTarget.src = '/product-placeholder.svg'
}
