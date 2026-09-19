import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const DATA_DIR = fileURLToPath(new URL('../data/', import.meta.url))
const ANSWERS_SOURCE_PATH = `${DATA_DIR}answers-source.txt`
const ANSWERS_PATH = `${DATA_DIR}answers.txt`
const WORDS_PATH = `${DATA_DIR}words.txt`
const BLACKLIST_PATH = `${DATA_DIR}blacklist.txt`
const SOURCES_PATH = `${DATA_DIR}sources.json`

const DANAKT_URL = 'https://raw.githubusercontent.com/danakt/russian-words/master/russian.txt'
const NOUNS_URL =
  'https://raw.githubusercontent.com/Harrix/Russian-Nouns/main/dist/russian_nouns.txt'
const SHUFFLE_SALT = 'wordle-gmd-v1'
const WORD_PATTERN = /^[а-я]{5}$/

function normalizeWord(word: string): string {
  return word.trim().toLowerCase().replace(/ё/g, 'е')
}

function sha256(input: string | Uint8Array): string {
  return createHash('sha256').update(input).digest('hex')
}

function parseWords(content: string): string[] {
  return content
    .split('\n')
    .map((line) => normalizeWord(line))
    .filter((word) => WORD_PATTERN.test(word))
}

function unique(words: string[]): string[] {
  return [...new Set(words)]
}

function deterministicShuffle(words: string[]): string[] {
  return [...words].sort((a, b) => sha256(a + SHUFFLE_SALT).localeCompare(sha256(b + SHUFFLE_SALT)))
}

function writeIfChanged(path: string, content: string): boolean {
  let current: string | null = null
  try {
    current = readFileSync(path, 'utf-8')
  } catch {
    current = null
  }
  if (current === content) return false
  writeFileSync(path, content)
  return true
}

async function download(url: string, encoding: 'utf-8' | 'windows-1251') {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Не удалось скачать ${url}: ${response.status}`)
  const buffer = new Uint8Array(await response.arrayBuffer())
  return { text: new TextDecoder(encoding).decode(buffer), sha256: sha256(buffer) }
}

async function printCandidates() {
  const nouns = await download(NOUNS_URL, 'utf-8')
  const candidates = unique(parseWords(nouns.text)).sort()
  console.log(candidates.join('\n'))
}

async function build() {
  const [danakt, nouns] = await Promise.all([
    download(DANAKT_URL, 'windows-1251'),
    download(NOUNS_URL, 'utf-8'),
  ])

  const blacklist = new Set(parseWords(readFileSync(BLACKLIST_PATH, 'utf-8')))
  const answersSource = unique(parseWords(readFileSync(ANSWERS_SOURCE_PATH, 'utf-8')))

  if (answersSource.length === 0) {
    throw new Error('Список ответов пуст: заполни data/answers-source.txt')
  }

  const blacklistedAnswers = answersSource.filter((word) => blacklist.has(word))
  if (blacklistedAnswers.length > 0) {
    throw new Error(`Ответы попали в блэклист: ${blacklistedAnswers.join(', ')}`)
  }

  const answers = deterministicShuffle(answersSource)
  const words = unique([...parseWords(danakt.text), ...answers])
    .filter((word) => !blacklist.has(word))
    .sort()

  const answersContent = `${answers.join('\n')}\n`
  const wordsContent = `${words.join('\n')}\n`

  const answersChanged = writeIfChanged(ANSWERS_PATH, answersContent)
  const wordsChanged = writeIfChanged(WORDS_PATH, wordsContent)
  writeIfChanged(
    SOURCES_PATH,
    `${JSON.stringify(
      {
        salt: SHUFFLE_SALT,
        sources: [
          {
            name: 'danakt/russian-words',
            url: DANAKT_URL,
            license: 'MIT',
            sha256: danakt.sha256,
            usedFor: 'words',
          },
          {
            name: 'Harrix/Russian-Nouns',
            url: NOUNS_URL,
            license: 'MIT',
            sha256: nouns.sha256,
            usedFor: 'answers-candidates',
          },
        ],
        outputs: {
          'answers.txt': { count: answers.length, sha256: sha256(answersContent) },
          'words.txt': { count: words.length, sha256: sha256(wordsContent) },
        },
      },
      null,
      2,
    )}\n`,
  )

  console.log(`answers: ${answers.length}, words: ${words.length}`)
  console.log(`answers.txt: ${answersChanged ? 'обновлён' : 'без изменений'}`)
  console.log(`words.txt: ${wordsChanged ? 'обновлён' : 'без изменений'}`)
}

if (process.argv[2] === '--candidates') {
  await printCandidates()
} else {
  await build()
}
