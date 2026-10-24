import { createTestGateway } from '@/__tests__/helpers/gateway-stub'
import { readGatewayDocument } from '@/gateway/openapi'

const doc = (await readGatewayDocument(createTestGateway())) as any

const record = doc.components?.schemas?.RecordEntity?.properties
console.log('episode', JSON.stringify(record?.episode))
console.log('likes', JSON.stringify(record?.likes))
console.log('extra', JSON.stringify(record?.extra))

const friends = doc.components?.schemas?.FriendsMemberEntity?.properties
console.log('counts', JSON.stringify(friends?.counts))
