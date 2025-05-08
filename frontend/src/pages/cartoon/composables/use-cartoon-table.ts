import { useDialog } from '@/components/dialog/composables/use-dialog'
import DialogButton from '@/components/dialog/dialog-button.vue'
import TableColEpisode from '@/components/table/table-col/table-col-episode.vue'
import TableColPerson from '@/components/table/table-col/table-col-person.vue'
import TableColSelect from '@/components/table/table-col/table-col-select.vue'
import TableColTitle from '@/components/table/table-col/table-col-title.vue'
import TableFilterGrade from '@/components/table/table-filter-grade.vue'
import TableFilterStatus from '@/components/table/table-filter-status.vue'
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
import { useCartoon } from './use-cartoon.ts'
import { useCartoonParams } from './use-cartoon-params.ts'

export const useCartoonTable = defineStore('cartoon/use-cartoon-table', () => {
  const { isAdmin } = storeToRefs(useUser())
  const cartoonStore = useCartoon()
  const cartoonParams = useCartoonParams()
  const { columnVisibility, pagination } = storeToRefs(cartoonParams)
  const { videos, totalPages } = storeToRefs(cartoonStore)
  const dialog = useDialog()

  const tableColumns = computed(() => {
    const columns: ColumnDef<VideoEntity>[] = [
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
            onUpdate: (title) => cartoonStore.updateVideo({
              id: row.original.id,
              data: { title },
            }),
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
            onUpdate: (episode) => cartoonStore.updateVideo({
              id: row.original.id,
              data: { episode },
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
            onUpdate: (personId) => cartoonStore.updateVideo({
              id: row.original.id,
              data: { personId },
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
                cartoonParams.setStatusFilter(value)
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
            value: row.original.status,
            kind: 'status',
            onUpdate: (value) => {
              cartoonStore.updateVideo({
                id: row.original.id,
                data: { status: value },
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
                cartoonParams.setGradeFilter(value)
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
            value: row.original.grade,
            kind: 'grade',
            onUpdate: (value) => {
              cartoonStore.updateVideo({
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
              title: `Создать мультик?`,
              content: '',
              description: '',
              onSubmit: () => cartoonStore.createVideo(),
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
                  title: `Удалить мультик?`,
                  content: '',
                  description: `Вы уверены, что хотите удалить ${row.original.title ? `"${row.original.title}"` : 'эту запись'}?`,
                  onSubmit: () => cartoonStore.deleteVideo(row.original.id),
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
  import.meta.hot.accept(acceptHMRUpdate(useCartoonTable, import.meta.hot))
}
