import process from 'node:process'

if (process.env.NODE_ENV === 'test') {
  process.env.NODE_ENV = 'development'
}
