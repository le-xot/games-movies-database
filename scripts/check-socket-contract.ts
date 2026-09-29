const backendSource = await Bun.file(
  new URL('../backend/src/modules/websocket/websocket.events.ts', import.meta.url),
).text()
const frontendSource = await Bun.file(
  new URL('../frontend/src/types/socket-events.ts', import.meta.url),
).text()

function extractEvents(source: string): Record<string, string> {
  const start = source.indexOf('export const WsEvents')
  const end = source.indexOf('} as const', start)
  const block = source.slice(start, end)
  const events: Record<string, string> = {}
  for (const match of block.matchAll(/(\w+):\s*'([^']+)'/g)) {
    const key = match[1]
    const value = match[2]
    if (key && value) events[key] = value
  }
  return events
}

function extractPayloadNames(source: string): string[] {
  return [...source.matchAll(/export interface (Update\w+Payload)/g)]
    .map((match) => match[1])
    .filter((name): name is string => Boolean(name))
    .sort()
}

const backendEvents = extractEvents(backendSource)
const frontendEvents = extractEvents(frontendSource)
const problems: string[] = []

for (const key of new Set([...Object.keys(backendEvents), ...Object.keys(frontendEvents)])) {
  if (backendEvents[key] !== frontendEvents[key]) {
    problems.push(
      `событие ${key}: backend=${backendEvents[key] ?? '—'}, frontend=${frontendEvents[key] ?? '—'}`,
    )
  }
}

const backendPayloads = extractPayloadNames(backendSource)
const frontendPayloads = extractPayloadNames(frontendSource)
if (backendPayloads.join(',') !== frontendPayloads.join(',')) {
  problems.push(`payload-интерфейсы: backend=[${backendPayloads}], frontend=[${frontendPayloads}]`)
}

if (problems.length > 0) {
  console.error('❌ Socket-контракт рассинхронизирован:')
  for (const problem of problems) console.error(`  - ${problem}`)
  process.exit(1)
}

console.log(`✅ Socket-контракт синхронен (${Object.keys(backendEvents).length} событий)`)
