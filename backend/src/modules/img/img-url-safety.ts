import { lookup } from 'node:dns/promises'
import { isIP } from 'node:net'
import { BadRequestException } from '@nestjs/common'

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024
export const IMAGE_FETCH_TIMEOUT_MS = 10_000
export const MAX_REDIRECTS = 5

export type LookupHost = (hostname: string) => Promise<{ address: string; family: number }[]>

const defaultLookup: LookupHost = async (hostname) =>
  (await lookup(hostname, { all: true, verbatim: true })) as { address: string; family: number }[]

const BLOCKED_IPV4_RANGES: Array<[string, number]> = [
  ['0.0.0.0', 8],
  ['10.0.0.0', 8],
  ['100.64.0.0', 10],
  ['127.0.0.0', 8],
  ['169.254.0.0', 16],
  ['172.16.0.0', 12],
  ['192.0.0.0', 24],
  ['192.0.2.0', 24],
  ['192.168.0.0', 16],
  ['198.18.0.0', 15],
  ['198.51.100.0', 24],
  ['203.0.113.0', 24],
  ['224.0.0.0', 4],
  ['240.0.0.0', 4],
]

function ipv4ToInt(address: string): number {
  return address.split('.').reduce((acc, part) => (acc << 8) + Number(part), 0) >>> 0
}

function isBlockedIpv4(address: string): boolean {
  const value = ipv4ToInt(address)
  return BLOCKED_IPV4_RANGES.some(([network, prefix]) => {
    const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0
    return (value & mask) === (ipv4ToInt(network) & mask)
  })
}

function intToIpv4(value: number): string {
  return `${(value >>> 24) & 0xff}.${(value >>> 16) & 0xff}.${(value >>> 8) & 0xff}.${value & 0xff}`
}

function extractEmbeddedIpv4(address: string): string | null {
  if (address.startsWith('::ffff:')) {
    const tail = address.slice('::ffff:'.length)
    if (isIP(tail) === 4) return tail
    const [hi, lo] = tail.split(':')
    if (hi && lo) return intToIpv4((parseInt(hi, 16) << 16) + parseInt(lo, 16))
    return null
  }

  const groups = address.split(':')
  if (groups.length !== 8) return null
  const mapped = groups.slice(0, 5).every((group) => parseInt(group, 16) === 0)
  if (!mapped || groups[5] !== 'ffff') return null
  return intToIpv4((parseInt(groups[6], 16) << 16) + parseInt(groups[7], 16))
}

function isBlockedIpv6(address: string): boolean {
  if (address === '::' || address === '::1') return true

  const embedded = extractEmbeddedIpv4(address)
  if (embedded) return isBlockedIpv4(embedded)

  return (
    address.startsWith('fe8') ||
    address.startsWith('fe9') ||
    address.startsWith('fea') ||
    address.startsWith('feb') ||
    address.startsWith('fc') ||
    address.startsWith('fd') ||
    address.startsWith('ff') ||
    address.startsWith('2001:db8') ||
    address.startsWith('2002') ||
    address.startsWith('64:ff9b')
  )
}

export function isBlockedAddress(address: string): boolean {
  const version = isIP(address)
  if (version === 4) return isBlockedIpv4(address)
  if (version === 6) return isBlockedIpv6(address.toLowerCase())
  return true
}

function parseHttpUrl(raw: string): URL {
  let url: URL
  try {
    url = new URL(raw)
  } catch {
    throw new BadRequestException('Invalid image URL')
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new BadRequestException('Only http(s) image URLs are allowed')
  }
  if (url.username || url.password) {
    throw new BadRequestException('Image URL must not contain credentials')
  }

  return url
}

export async function assertPublicHttpUrl(
  raw: string,
  lookupHost: LookupHost = defaultLookup,
): Promise<URL> {
  const url = parseHttpUrl(raw)
  const hostname = url.hostname.replace(/^\[|\]$/g, '')

  if (isIP(hostname)) {
    if (isBlockedAddress(hostname)) {
      throw new BadRequestException('Image URL points to a private address')
    }
    return url
  }

  let addresses: { address: string }[]
  try {
    addresses = await lookupHost(hostname)
  } catch {
    throw new BadRequestException('Failed to resolve image host')
  }

  if (addresses.length === 0 || addresses.some((entry) => isBlockedAddress(entry.address))) {
    throw new BadRequestException('Image URL points to a private address')
  }

  return url
}

export async function fetchPublicImage(
  raw: string,
  init: RequestInit = {},
  lookupHost: LookupHost = defaultLookup,
): Promise<Response> {
  let url = await assertPublicHttpUrl(raw, lookupHost)

  for (let redirect = 0; redirect <= MAX_REDIRECTS; redirect++) {
    const response = await fetch(url, {
      ...init,
      redirect: 'manual',
      signal: AbortSignal.timeout(IMAGE_FETCH_TIMEOUT_MS),
    })

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location')
      if (!location) throw new BadRequestException('Image redirect without location')
      url = await assertPublicHttpUrl(new URL(location, url).toString(), lookupHost)
      continue
    }

    return response
  }

  throw new BadRequestException('Too many image redirects')
}
