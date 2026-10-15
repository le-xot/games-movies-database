import { describe, expect, it } from 'bun:test'
import { createLatestGuard, filterCommands } from './use-command-palette-search'

const commands = [
  { name: 'Советы', path: '/db/suggestion' },
  { name: 'Игры', path: '/db/games' },
  { name: 'Аниме', path: '/db/anime' },
  { name: 'Статистика', path: '/db/stats' },
]

describe('filterCommands', () => {
  it('returns all commands for an empty query', () => {
    expect(filterCommands(commands, '')).toEqual(commands)
  })

  it('returns all commands for a whitespace-only query', () => {
    expect(filterCommands(commands, '   ')).toEqual(commands)
  })

  it('matches case-insensitively on a substring', () => {
    expect(filterCommands(commands, 'СТАТ')).toEqual([commands[3]])
  })

  it('trims the query before matching', () => {
    expect(filterCommands(commands, '  ани ')).toEqual([commands[2]])
  })

  it('returns nothing when no command matches', () => {
    expect(filterCommands(commands, 'слово')).toEqual([])
  })
})

describe('createLatestGuard', () => {
  it('supersedes older requests and keeps only the newest as latest', () => {
    const guard = createLatestGuard()
    const first = guard.next()
    const second = guard.next()

    expect(guard.isLatest(first)).toBe(false)
    expect(guard.isLatest(second)).toBe(true)
  })
})
