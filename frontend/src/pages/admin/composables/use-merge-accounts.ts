import { computed, ref } from 'vue'
import { toast } from 'vue-sonner'
import { useDialog } from '@/components/dialog/composables/use-dialog'
import { useApi } from '@/stores/use-api'
import type { MergeUsersResultEntity, UserEntity } from '@/lib/api'
import type { UserAccount } from '@/pages/admin/composables/use-admin-users'

export function useMergeAccounts(options: {
  users: () => UserEntity[]
  accounts: () => Record<string, UserAccount[]>
}) {
  const api = useApi()
  const dialog = useDialog()

  const targetId = ref<string | null>(null)
  const sourceId = ref<string | null>(null)
  const targetQuery = ref('')
  const sourceQuery = ref('')
  const isMerging = ref(false)

  const targetUser = computed(
    () => options.users().find((user) => user.id === targetId.value) ?? null,
  )
  const sourceUser = computed(
    () => options.users().find((user) => user.id === sourceId.value) ?? null,
  )

  function matches(user: UserEntity, query: string): boolean {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return true
    if (user.login.toLowerCase().includes(normalized)) return true
    if (user.id.toLowerCase().includes(normalized)) return true
    return (options.accounts()[user.id] ?? []).some((account) =>
      account.platformLogin.toLowerCase().includes(normalized),
    )
  }

  function search(excludeId: string | null, query: string): UserEntity[] {
    return options.users().filter((user) => user.id !== excludeId && matches(user, query))
  }

  const targetResults = computed(() => search(sourceId.value, targetQuery.value))
  const sourceResults = computed(() => search(targetId.value, sourceQuery.value))

  const targetAccounts = computed(() =>
    targetId.value ? (options.accounts()[targetId.value] ?? []) : [],
  )
  const sourceAccounts = computed(() =>
    sourceId.value ? (options.accounts()[sourceId.value] ?? []) : [],
  )

  const conflictingAccounts = computed(() => {
    const targetPlatforms = new Set(targetAccounts.value.map((account) => account.platform))
    return sourceAccounts.value.filter((account) => targetPlatforms.has(account.platform))
  })

  const canMerge = computed(
    () =>
      !!targetUser.value &&
      !!sourceUser.value &&
      targetId.value !== sourceId.value &&
      !isMerging.value,
  )

  function selectTarget(id: string) {
    targetId.value = id
    targetQuery.value = ''
  }

  function selectSource(id: string) {
    sourceId.value = id
    sourceQuery.value = ''
  }

  function clearTarget() {
    targetId.value = null
  }

  function clearSource() {
    sourceId.value = null
  }

  async function merge(): Promise<MergeUsersResultEntity | null> {
    const target = targetUser.value
    const source = sourceUser.value
    if (!target || !source || target.id === source.id) return null

    isMerging.value = true
    try {
      const { data } = await api.users.userControllerMergeUsers(target.id, {
        sourceUserId: source.id,
      })

      const droppedTotal = data.accountsDropped + data.likesDropped + data.wordleGamesDropped
      const droppedText = droppedTotal
        ? ` Отброшено дублей: привязок ${data.accountsDropped}, лайков ${data.likesDropped}, игр Wordle ${data.wordleGamesDropped}.`
        : ''
      toast.success('Аккаунты объединены', {
        description: `Перенесено: привязок ${data.accountsMoved}, лайков ${data.likesMoved}, предложек ${data.suggestionsMoved}, игр Wordle ${data.wordleGamesMoved}.${droppedText}`,
      })

      clearTarget()
      clearSource()
      return data
    } catch (error) {
      console.error('Failed to merge users:', error)
      toast.error('Не удалось объединить аккаунты')
      return null
    } finally {
      isMerging.value = false
    }
  }

  function confirmMerge(onSuccess?: () => void) {
    const target = targetUser.value
    const source = sourceUser.value
    if (!target || !source) return

    const conflicts = conflictingAccounts.value
      .map((account) => `${account.platform} (@${account.platformLogin})`)
      .join(', ')
    const conflictsNote = conflicts
      ? `<br><br>У поглощаемого будут отброшены привязки: ${conflicts} — у основного уже есть эти платформы.`
      : ''

    dialog.openDialog({
      title: 'Объединить аккаунты?',
      description: `«${source.login}» будет удалён, его привязки и данные перейдут к «${target.login}».<br><br>Отменить это действие нельзя.${conflictsNote}`,
      onSubmit: async () => {
        const result = await merge()
        if (result) onSuccess?.()
      },
    })
  }

  return {
    targetId,
    sourceId,
    targetQuery,
    sourceQuery,
    isMerging,
    targetUser,
    sourceUser,
    targetResults,
    sourceResults,
    targetAccounts,
    sourceAccounts,
    conflictingAccounts,
    canMerge,
    selectTarget,
    selectSource,
    clearTarget,
    clearSource,
    confirmMerge,
  }
}
