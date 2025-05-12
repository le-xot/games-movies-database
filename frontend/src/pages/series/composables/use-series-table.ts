import { useDialog } from '@/components/dialog/composables/use-dialog'
import DialogButton from '@/components/dialog/dialog-button.vue'
import TableColEpisode from '@/components/table/table-col/table-col-episode.vue'
import TableColSelect from '@/components/table/table-col/table-col-select.vue'
import TableColTitle from '@/components/table/table-col/table-col-title.vue'
import TableColPerson from '@/components/table/table-col/table-col-user.vue'
import TableFilterGrade from '@/components/table/table-filter-grade.vue'
import TableFilterStatus from '@/components/table/table-filter-status.vue'
import { useUser } from '@/composables/use-user'
import { RecordEntity, RecordGrade, RecordStatus } from '@/lib/api.ts'
import {
  ColumnDef,
  getCoreRowModel,
  getPaginationRowModel,
  useVueTable,
} from '@tanstack/vue-table'
import { CirclePlus, Eraser } from 'lucide-vue-next'
import { acceptHMRUpdate, defineStore, storeToRefs } from 'pinia'
import { computed, h } from 'vue'
import { useSeries } from './use-series.ts'
import { useSeriesParams } from './use-series-params.ts'

export const useSeriesTable = defineStore('series/use-series-table', () => {
  const { isAdmin } = storeToRefs(useUser())
  const seriesStore = useSeries()
  const seriesParams = useSeriesParams()
  const { columnVisibility, pagination } = storeToRefs(seriesParams)
  const { videos, totalPages } = storeToRefs(seriesStore)
  const dialog = useDialog()

  const tableColumns = computed(() => {
    const columns: ColumnDef<RecordEntity>[] = [
      {
        accessorKey: 'title',
        header: 'Название',
        size: isAdmin.value ? 40 : 45,
        minSize: isAdmin.value ? 40 : 45,
        maxSize: isAdmin.value ? 40 : 45,
        enableResizing: false,
        cell: ({ row }) => {
          return h(TableColTitle, {
            key: `title-${row.original.id}`,
            title: row.original.title,
          })
        },
      },
      {
        accessorKey: 'episode',
        header: 'Серии',
        size: 5,
        minSize: 5,
        maxSize: 5,
        enableResizing: false,
        cell: ({ row }) => {
          return h(TableColEpisode, {
            key: `episode-${row.original.id}`,
            episode: row.original.episode,
            onUpdate: (episode) => seriesStore.updateVideo({
              id: row.original.id,
              data: { episode },
            }),
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
          return h(TableColPerson, {
            key: `person-${row.original.id}`,
            userId: row.original.userId,
            onUpdate: (userId) => seriesStore.updateVideo({
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
                seriesParams.setStatusFilter(value)
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
              seriesStore.updateVideo({
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
                seriesParams.setGradeFilter(value)
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
              seriesStore.updateVideo({
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
        header: () => {
          return h(DialogButton, {
            icon: CirclePlus,
            onClick: () => dialog.openDialog({
              title: `Создать сирик?`,
              content: '',
              description: '',
              onSubmit: () => seriesStore.createVideo(),
            }),
          })
        },
        cell: ({ row }) => {
          return h('div', {}, {
            default: () => [
              h(DialogButton, {
                key: `id-${row.original.id}`,
                icon: Eraser,
                onClick: () => dialog.openDialog({
                  title: `Удалить сирик?`,
                  content: '',
                  description: `Вы уверены, что хотите удалить ${row.original.title ? `"${row.original.title}"` : 'эту запись'}?`,
                  onSubmit: () => seriesStore.deleteVideo(row.original.id),
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
      return videos.value
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
  import.meta.hot.accept(acceptHMRUpdate(useSeriesTable, import.meta.hot))
}
