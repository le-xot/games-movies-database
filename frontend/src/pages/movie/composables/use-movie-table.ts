import { useDialog } from '@/components/dialog/composables/use-dialog'
import DialogButton from '@/components/dialog/dialog-button.vue'
import TableColPerson from '@/components/table/table-col/table-col-person.vue'
import TableColSelect from '@/components/table/table-col/table-col-select.vue'
import TableColTitle from '@/components/table/table-col/table-col-title.vue'
import { useUser } from '@/composables/use-user'
import { VideoEntity } from '@/lib/api.ts'
import {
  ColumnDef,
  getCoreRowModel,
  getPaginationRowModel,
  useVueTable,
} from '@tanstack/vue-table'
import { CirclePlus, Eraser } from 'lucide-vue-next'
import { acceptHMRUpdate, defineStore, storeToRefs } from 'pinia'
import { computed, h } from 'vue'
import { useMovie } from './use-movie.ts'
import { useMovieParams } from './use-movie-params.ts'

export const useMovieTable = defineStore('movies/use-movies-table', () => {
  const { isAdmin } = storeToRefs(useUser())
  const videosStore = useMovie()
  const { columnVisibility, pagination } = storeToRefs(useMovieParams())
  const { videos, totalPages } = storeToRefs(videosStore)
  const dialog = useDialog()

  const tableColumns = computed(() => {
    const columns: ColumnDef<VideoEntity>[] = [
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
            onUpdate: (title) => videosStore.updateVideo({
              id: row.original.id,
              data: { title },
            }),
          })
        },
      },
      {
        accessorKey: 'person',
        header: 'Заказчик',
        size: 20,
        minSize: 20,
        maxSize: 20,
        enableResizing: false,
        cell: ({ row }) => {
          return h(TableColPerson, {
            key: `person-${row.original.id}`,
            personId: row.original.person?.id,
            onUpdate: (personId) => videosStore.updateVideo({
              id: row.original.id,
              data: { personId },
            }),
          })
        },
      },
      {
        accessorKey: 'status',
        header: 'Статус',
        size: 10,
        minSize: 10,
        maxSize: 10,
        enableResizing: false,
        cell: ({ row }) => {
          return h(TableColSelect, {
            key: `status-${row.original.id}`,
            value: row.original.status,
            kind: 'status',
            onUpdate: (value) => {
              videosStore.updateVideo({
                id: row.original.id,
                data: { status: value },
              })
            },
          })
        },
      },
      {
        accessorKey: 'grade',
        header: 'Оценка',
        size: 10,
        minSize: 10,
        maxSize: 10,
        enableResizing: false,
        cell: ({ row }) => {
          return h(TableColSelect, {
            key: `grade-${row.original.id}`,
            value: row.original.grade,
            kind: 'grade',
            onUpdate: (value) => {
              videosStore.updateVideo({
                id: row.original.id,
                data: { grade: value },
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
              title: `Создать кинчик?`,
              description: '',
              onSubmit: () => videosStore.createVideo(),
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
                  title: `Удалить кинчик?`,
                  description: `Вы уверены, что хотите удалить ${row.original.title ? `"${row.original.title}"` : 'эту запись'}?`,
                  onSubmit: () => videosStore.deleteVideo(row.original.id),
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
