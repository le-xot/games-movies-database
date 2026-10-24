import { openapi } from '@elysia/openapi'
import { Elysia, t } from 'elysia'

const app = new Elysia()
  .use(openapi({ provider: null }))
  .get(
    '/redirect-raw',
    () =>
      new Response(null, {
        status: 302,
        headers: { location: 'https://example.com', 'set-cookie': 'a=1; Path=/' },
      }),
    { response: { 200: t.Void() } },
  )
  .get(
    '/redirect-array',
    ({ set }) => {
      set.status = 302
      set.headers['location'] = 'https://example.com'
      set.headers['set-cookie'] = ['a=1; Path=/', 'b=2; Path=/']
      return undefined
    },
    { response: { 200: t.Void() } },
  )
  .get(
    '/redirect-headers',
    ({ set }) => {
      set.status = 302
      set.headers['set-cookie'] = 'a=1; Path=/'
      return undefined
    },
    { response: { 200: t.Void() } },
  )

for (const path of ['/redirect-raw', '/redirect-array', '/redirect-headers']) {
  const res = await app.handle(new Request(`http://localhost${path}`))
  console.log(
    path,
    res.status,
    res.headers.get('location'),
    JSON.stringify(res.headers.getSetCookie()),
  )
}

const doc = await (await app.handle(new Request('http://localhost/openapi/json'))).json()
console.log('contract', JSON.stringify(doc.paths['/redirect-raw'].get.responses))
