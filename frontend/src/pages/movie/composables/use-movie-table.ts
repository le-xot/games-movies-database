import { useDialog } from '@/components/dialog/composables/use-dialog'
import DialogButton from '@/components/dialog/dialog-button.vue'
import TableColSelect from '@/components/table/table-col/table-col-select.vue'
import TableColTitle from '@/components/table/table-col/table-col-title.vue'
import TableColUser from '@/components/table/table-col/table-col-user.vue'
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
import { Eraser } from 'lucide-vue-next'
import { acceptHMRUpdate, defineStore, storeToRefs } from 'pinia'
import { computed, h } from 'vue'
import { useMovie } from './use-movie.ts'
import { useMovieParams } from './use-movie-params.ts'

export const useMovieTable = defineStore('movies/use-movies-table', () => {
  const { isAdmin } = storeToRefs(useUser())
  const moviesStore = useMovie()
  const moviesParams = useMovieParams()
  const { columnVisibility, pagination } = storeToRefs(moviesParams)
  const { videos, totalPages } = storeToRefs(moviesStore)
  const dialog = useDialog()

  const tableColumns = computed(() => {
    const columns: ColumnDef<RecordEntity>[] = [
      {
        accessorKey: 'title',
        header: 'Название',
        size: isAdmin.value ? 55 : 60,
        minSize: isAdmin.value ? 55 : 60,
        maxSize: isAdmin.value ? 55 : 60,
        enableResizing: false,
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
            onUpdate: (userId) => moviesStore.updateVideo({
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
                moviesParams.setStatusFilter(value)
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
              moviesStore.updateVideo({
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
                moviesParams.setGradeFilter(value)
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
              moviesStore.updateVideo({
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
          return h('div', {}, {
            default: () => [
              h(DialogButton, {
                key: `id-${row.original.id}`,
                icon: Eraser,
                onClick: () => dialog.openDialog({
                  title: `Удалить кинчик?`,
                  content: '',
                  description: `Вы уверены, что хотите удалить ${row.original.title ? `"${row.original.title}"` : 'эту запись'}?`,
                  onSubmit: () => moviesStore.deleteVideo(row.original.id),
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
  import.meta.hot.accept(acceptHMRUpdate(useMovieTable, import.meta.hot))
}
