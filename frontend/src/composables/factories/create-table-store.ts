import { useDialog } from '@/components/dialog/composables/use-dialog'
import DialogButton from '@/components/dialog/dialog-button.vue'
import TableColEpisode from '@/components/table/table-col/table-col-episode.vue'
import TableColSelect from '@/components/table/table-col/table-col-select.vue'
import TableColTitle from '@/components/table/table-col/table-col-title.vue'
import TableColUser from '@/components/table/table-col/table-col-user.vue'
import TableFilterGrade from '@/components/table/table-filter-grade.vue'
import TableFilterStatus from '@/components/table/table-filter-status.vue'
import { useUser } from '@/composables/use-user'
import { RecordEntity, RecordGrade, RecordStatus, RecordUpdateDTO } from '@/lib/api'
import {
  ColumnDef,
  getCoreRowModel,
  getPaginationRowModel,
  useVueTable,
} from '@tanstack/vue-table'
import { Eraser } from 'lucide-vue-next'
import { StoreDefinition, defineStore, storeToRefs } from 'pinia'
import { ComputedRef, computed, h } from 'vue'

interface DataStoreReturn {
  videos?: ComputedRef<RecordEntity[]>
  games?: ComputedRef<RecordEntity[]>
  totalPages: ComputedRef<number>
  updateRecord: (payload: { id: number, data: RecordUpdateDTO }) => Promise<any>
  deleteRecord: (id: number) => Promise<any>
}

interface ParamsStoreReturn {
  columnVisibility: Record<string, boolean>
  pagination: { pageIndex: number, pageSize: number }
  setStatusFilter: (value: RecordStatus[] | null) => void
  setGradeFilter: (value: RecordGrade[] | null) => void
}

export interface TableStoreConfig {
  storeId: string
  dataStore: StoreDefinition<any, any, any, any>
  paramsStore: StoreDefinition<any, any, any, any>
  hasEpisodeColumn: boolean
  titleSize: { admin: number, user: number }
  episodeSize?: number
  deleteConfirmTitle: string
  itemsKey: 'videos' | 'games'
}

export function createTableStore(config: TableStoreConfig) {
  return defineStore(config.storeId, () => {
    const { isAdmin } = storeToRefs(useUser())
    const dataStoreInstance = config.dataStore() as unknown as DataStoreReturn
    const paramsStoreInstance = config.paramsStore() as unknown as ParamsStoreReturn
    const dialog = useDialog()

    const items = computed(() => {
      const raw = config.itemsKey === 'games'
        ? dataStoreInstance.games
        : dataStoreInstance.videos
      return raw?.value ?? []
    })

    const totalPages = computed(() => dataStoreInstance.totalPages.value)

    const tableColumns = computed(() => {
      const columns: ColumnDef<RecordEntity>[] = [
        {
          accessorKey: 'title',
          header: 'Название',
          size: isAdmin.value ? config.titleSize.admin : config.titleSize.user,
          minSize: isAdmin.value ? config.titleSize.admin : config.titleSize.user,
          maxSize: isAdmin.value ? config.titleSize.admin : config.titleSize.user,
          enableResizing: false,
          cell: ({ row }) => {
            return h(TableColTitle, {
              key: `title-${row.original.id}`,
              title: row.original.title,
              link: row.original.link,
            })
          },
        },
      ]

      if (config.hasEpisodeColumn) {
        columns.push({
          accessorKey: 'episode',
          header: 'Серии',
          size: config.episodeSize,
          minSize: config.episodeSize,
          maxSize: config.episodeSize,
          enableResizing: false,
          cell: ({ row }) => {
            return h(TableColEpisode, {
              key: `episode-${row.original.id}`,
              episode: row.original.episode,
              onUpdate: (episode: string | undefined) => dataStoreInstance.updateRecord({
                id: row.original.id,
                data: { episode },
              }),
            })
          },
        })
      }

      columns.push(
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
              onUpdate: (userId: string | undefined) => dataStoreInstance.updateRecord({
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
                onUpdate: (value: RecordStatus[] | null) => {
                  paramsStoreInstance.setStatusFilter(value)
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
              onUpdate: (value: string | undefined) => {
                dataStoreInstance.updateRecord({
                  id: row.original.id,
                  data: { status: value as RecordStatus },
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
                onUpdate: (value: RecordGrade[] | null) => {
                  paramsStoreInstance.setGradeFilter(value)
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
              onUpdate: (value: string | undefined) => {
                dataStoreInstance.updateRecord({
                  id: row.original.id,
                  data: { grade: value as RecordGrade },
                })
              },
            })
          },
        },
      )

      if (isAdmin.value) {
        columns.unshift({
          accessorKey: 'id',
          size: 5,
          minSize: 5,
          maxSize: 5,
          enableResizing: false,
          header: '',
          cell: ({ row }) => {
            return h('div', {}, {
              default: () => [
                h(DialogButton, {
                  key: `id-${row.original.id}`,
                  icon: Eraser,
                  onClick: () => dialog.openDialog({
                    title: config.deleteConfirmTitle,
                    content: '',
                    description: `Вы уверены, что хотите удалить ${row.original.title ? `"${row.original.title}"` : 'эту запись'}?`,
                    onSubmit: () => dataStoreInstance.deleteRecord(row.original.id),
                  }),
                }),
              ],
            })
          },
        })
      }

      return columns
    })

    const table = useVueTable({
      get data() {
        return items.value
      },
      get columns() {
        return tableColumns.value
      },
      get pageCount() {
        return totalPages.value
      },
      state: {
        get columnVisibility() {
          return paramsStoreInstance.columnVisibility
        },
        get pagination() {
          return paramsStoreInstance.pagination
        },
      },
      manualPagination: true,
      getCoreRowModel: getCoreRowModel(),
      getPaginationRowModel: getPaginationRowModel(),
    })

    return table
  })
}
