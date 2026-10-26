import type { GatewayDeps } from '@backend/gateway'
import type { Authenticator } from '@backend/gateway/auth'
import type { UserService } from '@backend/modules/user/user.service'

export interface PeopleServices {
  users: UserService
  auth: Authenticator
}

/** Порты пользователей и сессии: домен уже отдаёт то, что объявляет гейтвей. */
export function peoplePorts({
  users,
  auth,
}: PeopleServices): Pick<GatewayDeps, 'users' | 'authSession' | 'auth'> {
  return {
    users: {
      getAll: () => users.getAllUsers(),
      getById: (id) => users.getUserById(id),
      getAccounts: (id) => users.getLinkedAccounts(id),
      remove: (id) => users.deleteUserById(id),
      merge: (targetId, sourceUserId) => users.mergeUsers(targetId, sourceUserId),
    },
    authSession: {
      getAccounts: (userId) => users.getLinkedAccounts(userId),
      unlinkAccount: (userId, platform) => users.unlinkPlatformAccount(userId, platform),
      updateLogin: (userId, login) => users.updateLogin(userId, login),
      getCustomization: (userId) => users.getCustomization(userId),
      updateCustomization: (userId, data) => users.updateCustomization(userId, data),
      deleteUser: (userId) => users.deleteUserById(userId),
      uploadAvatar: (userId, buffer) => users.uploadAvatar(userId, buffer),
      deleteAvatar: (userId) => users.deleteAvatar(userId),
    },
    auth,
  }
}
