import { describe, expect, it, mock } from 'bun:test'
import { isIP } from 'node:net'
import { BadRequestException } from '@nestjs/common'
import {
  assertPublicHttpUrl,
  fetchPublicImage,
  isBlockedAddress,
  type LookupHost,
} from '../img-url-safety'

const fakeLookup =
  (...addresses: string[]): LookupHost =>
  () =>
    Promise.resolve(addresses.map((address) => ({ address, family: isIP(address) })))

describe('isBlockedAddress', () => {
  it.each([
    '127.0.0.1',
    '10.0.0.1',
    '169.254.169.254',
    '192.168.1.1',
    '172.16.0.1',
    '100.64.0.1',
    '0.0.0.0',
    '224.0.0.1',
    '::1',
    'fe80::1',
    'fd00::1',
    '::ffff:127.0.0.1',
    '::ffff:7f00:1',
  ])('blocks %s', (address) => {
    expect(isBlockedAddress(address)).toBe(true)
  })

  it.each(['93.184.216.34', '8.8.8.8', '2606:4700:4700::1111'])('allows %s', (address) => {
    expect(isBlockedAddress(address)).toBe(false)
  })

  it('blocks unknown input', () => {
    expect(isBlockedAddress('not-an-ip')).toBe(true)
  })
})

describe('assertPublicHttpUrl', () => {
  it('rejects non-http schemes', async () => {
    await expect(assertPublicHttpUrl('file:///etc/passwd')).rejects.toThrow(BadRequestException)
    await expect(assertPublicHttpUrl('ftp://example.com/a.png')).rejects.toThrow(
      BadRequestException,
    )
  })

  it('rejects URLs with credentials', async () => {
    await expect(assertPublicHttpUrl('http://user:pass@example.com/a.png')).rejects.toThrow(
      BadRequestException,
    )
  })

  it('rejects literal private hosts', async () => {
    await expect(assertPublicHttpUrl('http://127.0.0.1/a.png')).rejects.toThrow(BadRequestException)
    await expect(assertPublicHttpUrl('http://[::1]/a.png')).rejects.toThrow(BadRequestException)
  })

  it('rejects hostnames resolving to private addresses', async () => {
    await expect(
      assertPublicHttpUrl('https://internal.example/a.png', fakeLookup('10.0.0.5')),
    ).rejects.toThrow(BadRequestException)
  })

  it('rejects hostnames with mixed public and private resolutions', async () => {
    await expect(
      assertPublicHttpUrl('https://rebind.example/a.png', fakeLookup('93.184.216.34', '127.0.0.1')),
    ).rejects.toThrow(BadRequestException)
  })

  it('rejects hostnames that fail to resolve', async () => {
    const failingLookup: LookupHost = () => Promise.reject(new Error('ENOTFOUND'))

    await expect(
      assertPublicHttpUrl('https://missing.example/a.png', failingLookup),
    ).rejects.toThrow(BadRequestException)
  })

  it('allows public literal IP and public resolution', async () => {
    await expect(assertPublicHttpUrl('https://93.184.216.34/a.png')).resolves.toBeInstanceOf(URL)
    await expect(
      assertPublicHttpUrl('https://cdn.example/a.png', fakeLookup('93.184.216.34')),
    ).resolves.toBeInstanceOf(URL)
  })
})

describe('fetchPublicImage', () => {
  it('rejects a redirect to a private address', async () => {
    const originalFetch = globalThis.fetch
    globalThis.fetch = mock(() =>
      Promise.resolve({
        status: 302,
        headers: {
          get: (name: string) => (name === 'location' ? 'http://127.0.0.1/secret' : null),
        },
      } as any),
    ) as any

    try {
      await expect(
        fetchPublicImage('https://cdn.example/a.png', {}, fakeLookup('93.184.216.34')),
      ).rejects.toThrow(BadRequestException)
    } finally {
      globalThis.fetch = originalFetch
    }
  })

  it('follows a redirect to another public host', async () => {
    const originalFetch = globalThis.fetch
    let calls = 0
    globalThis.fetch = mock(() => {
      calls++
      return Promise.resolve(
        calls === 1
          ? {
              status: 301,
              headers: {
                get: (name: string) => (name === 'location' ? 'https://cdn2.example/b.png' : null),
              },
            }
          : {
              status: 200,
              headers: { get: () => null },
              arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
            },
      )
    }) as any

    try {
      const response = await fetchPublicImage(
        'https://cdn.example/a.png',
        {},
        fakeLookup('93.184.216.34'),
      )
      expect(response.status).toBe(200)
      expect(calls).toBe(2)
    } finally {
      globalThis.fetch = originalFetch
    }
  })
})
