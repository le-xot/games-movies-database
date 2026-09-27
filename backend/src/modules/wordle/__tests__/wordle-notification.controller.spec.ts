import { describe, expect, it, mock } from 'bun:test'
import { createMock } from '@/__tests__/helpers/mock-factory'
import { WordleNotificationController } from '@/modules/wordle/wordle-notification.controller'
import { WordleNotificationService } from '@/modules/wordle/wordle-notification.service'
import type { UserEntity } from '@/modules/user/user.entity'
import type { WordleNotificationsStatusDTO } from '@/modules/wordle/wordle-notification.dto'

const USER = { id: 'user-1' } as UserEntity

function createController() {
  const service = createMock(WordleNotificationService)
  const controller = new WordleNotificationController(service)
  return { controller, service }
}

describe('WordleNotificationController', () => {
  it('delegates status, link, update and delete to the service', async () => {
    const { controller, service } = createController()
    const status: WordleNotificationsStatusDTO = {
      available: true,
      connected: false,
      telegramUsername: null,
      morningEnabled: true,
      eveningEnabled: true,
      morningTime: '12:00',
      eveningTime: '20:00',
    }
    service.getStatus = mock(() => Promise.resolve(status))
    service.createLink = mock(() => Promise.resolve({ url: 'https://t.me/bot?start=x' }))
    service.updateFlags = mock(() => Promise.resolve({ ...status, connected: true }))
    service.disconnect = mock(() => Promise.resolve())

    expect(await controller.getStatus(USER)).toEqual(status)
    expect(await controller.createLink(USER)).toEqual({ url: 'https://t.me/bot?start=x' })
    expect(await controller.update(USER, { morningEnabled: false })).toEqual({
      ...status,
      connected: true,
    })
    expect(await controller.remove(USER)).toEqual({ ok: true })

    expect(service.getStatus).toHaveBeenCalledWith('user-1')
    expect(service.createLink).toHaveBeenCalledWith('user-1')
    expect(service.updateFlags).toHaveBeenCalledWith('user-1', { morningEnabled: false })
    expect(service.disconnect).toHaveBeenCalledWith('user-1')
  })
})
