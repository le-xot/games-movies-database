import { useDialog } from '@/components/dialog/composables/use-dialog'
import DialogButton from '@/components/dialog/dialog-button.vue'
import TableColSelect from '@/components/table/table-col/table-col-select.vue'
import TableColTitle from '@/components/table/table-col/table-col-title.vue'
import TableColUser from '@/components/table/table-col/table-col-user.vue'
import TableFilterGrade from '@/components/table/table-filter-grade.vue'
import TableFilterStatus from '@/components/table/table-filter-status.vue'
import { useUser } from '@/composables/use-user'
import { RecordEntity, RecordGrade, RecordStatus } from '@/lib/api'
import {
  ColumnDef,
  getCoreRowModel,
  getPaginationRowModel,
  useVueTable,
} from '@tanstack/vue-table'
import { Eraser } from 'lucide-vue-next'
import { acceptHMRUpdate, defineStore, storeToRefs } from 'pinia'
import { computed, h } from 'vue'
import { useGames } from './use-games'
import { useGamesParams } from './use-games-params'

export const useGamesTable = defineStore('games/use-games-table', () => {
  const { isAdmin } = storeToRefs(useUser())
  const gamesStore = useGames()
  const gamesParams = useGamesParams()
  const { columnVisibility, pagination } = storeToRefs(gamesParams)
  const { games, totalPages } = storeToRefs(gamesStore)
  const dialog = useDialog()

  const tableColumns = computed(() => {
    const columns: ColumnDef<RecordEntity>[] = [
      {
        accessorKey: 'title',
        header: 'Название',
        size: isAdmin.value ? 55 : 60,
        minSize: isAdmin.value ? 55 : 60,
        maxSize: isAdmin.value ? 55 : 60,
        cell: ({ row }) => {
          return h(TableColTitle, {
            key: `title-${row.original.id}`,
            title: row.original.title,
            link: row.original.link,
          })
        },
      },
      {
        accessorKey: 'user',
        header: 'Пользователь',
        size: 20,
        minSize: 20,
        maxSize: 20,
        enableResizing: false,
        cell: ({ row }) => {
          return h(TableColUser, {
            key: `user-${row.original.id}`,
            userId: row.original.userId,
            onUpdate: (userId) => gamesStore.updateGame({
              id: row.original.id,
              data: { userId },
            }),
          })
        },
      },
      {
        accessorKey: 'status',
        header: () => {
          return h('div', { class: 'flex justify-between items-center mx-3' }, [
            h('span', {}, 'Статус'),
            h(TableFilterStatus, {
              value: null,
              onUpdate: (value) => {
                gamesParams.setStatusFilter(value)
              },
            }),
          ])
        },
        size: 10,
        minSize: 10,
        maxSize: 10,
        enableResizing: false,
        cell: ({ row }) => {
          return h(TableColSelect, {
            key: `status-${row.original.id}`,
            value: row.original.status as RecordStatus,
            kind: 'status',
            onUpdate: (value) => {
              gamesStore.updateGame({
                id: row.original.id,
                data: {
                  status: value as RecordStatus,
                },
              })
            },
          })
        },
      },
      {
        accessorKey: 'grade',
        header: () => {
          return h('div', { class: 'flex justify-between items-center mx-3' }, [
            h('span', {}, 'Оценка'),
            h(TableFilterGrade, {
              value: null,
              onUpdate: (value) => {
                gamesParams.setGradeFilter(value)
              },
            }),
          ])
        },
        size: 10,
        minSize: 10,
        maxSize: 10,
        enableResizing: false,
        cell: ({ row }) => {
          return h(TableColSelect, {
            key: `grade-${row.original.id}`,
            value: row.original.grade as RecordGrade,
            kind: 'grade',
            onUpdate: (value) => {
              gamesStore.updateGame({
                id: row.original.id,
                data: { grade: value as RecordGrade },
              })
            },
          })
        },
      },
    ]
    if (isAdmin.value) {
      columns.unshift({
        accessorKey: 'id',
        size: 5,
        minSize: 5,
        maxSize: 5,
        enableResizing: false,
        header: '',
        cell: ({ row }) => {
          return h(
            'div',
            {},
            {
              default: () => [
                h(DialogButton, {
                  key: `id-${row.original.id}`,
                  icon: Eraser,
                  onClick: () => dialog.openDialog({
                    title: `Удалить игру?`,
                    content: '',
                    description: `Вы уверены, что хотите удалить ${row.original.title ? `"${row.original.title}"` : 'эту запись'}?`,
                    onSubmit: () => gamesStore.deleteGame(row.original.id),
                  }),
                }),
              ],
            },
          )
        },
      })
    }

    return columns
  })

  const table = useVueTable({
    get data() {
      return games.value
    },
    get columns() {
      return tableColumns.value
    },
    get pageCount() {
      return totalPages.value
    },
    state: {
      get columnVisibility() {
        return columnVisibility.value
      },
      get pagination() {
        return pagination.value
      },
    },
    manualPagination: true,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  return table
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useGamesTable, import.meta.hot))
}
