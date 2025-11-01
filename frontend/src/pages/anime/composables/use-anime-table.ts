import { useDialog } from '@/components/dialog/composables/use-dialog'
import DialogButton from '@/components/dialog/dialog-button.vue'
import RecordCreateButton from '@/components/dialog/record-create-button.vue'
import TableColEpisode from '@/components/table/table-col/table-col-episode.vue'
import TableColSelect from '@/components/table/table-col/table-col-select.vue'
import TableColTitle from '@/components/table/table-col/table-col-title.vue'
import TableColUser from '@/components/table/table-col/table-col-user.vue'
import TableFilterGrade from '@/components/table/table-filter-grade.vue'
import TableFilterStatus from '@/components/table/table-filter-status.vue'
import { useRecordCreate } from '@/composables/use-record-create.ts'
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
import { useAnime } from './use-anime.ts'
import { useAnimeParams } from './use-anime-params.ts'

export const useAnimeTable = defineStore('anime/use-anime-table', () => {
  const { isAdmin } = storeToRefs(useUser())
  const animeStore = useAnime()
  const animeParams = useAnimeParams()
  const { columnVisibility, pagination } = storeToRefs(animeParams)
  const { videos, totalPages } = storeToRefs(animeStore)
  const dialog = useDialog()

  const { createRecord } = useRecordCreate('cartoon', () => {
    animeStore.refetchVideos()
  })

  const tableColumns = computed(() => {
    const columns: ColumnDef<RecordEntity>[] = [
      {
        accessorKey: 'title',
        header: 'Название',
        size: isAdmin.value ? 47 : 52,
        minSize: isAdmin.value ? 47 : 52,
        maxSize: isAdmin.value ? 47 : 52,
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
        accessorKey: 'episode',
        header: 'Серии',
        size: 8,
        minSize: 8,
        maxSize: 8,
        enableResizing: false,
        cell: ({ row }) => {
          return h(TableColEpisode, {
            key: `episode-${row.original.id}`,
            episode: row.original.episode,
            onUpdate: (episode) => animeStore.updateVideo({
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
          return h(TableColUser, {
            key: `user-${row.original.id}`,
            userId: row.original.userId,
            onUpdate: (userId) => animeStore.updateVideo({
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
                animeParams.setStatusFilter(value)
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
              animeStore.updateVideo({
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
                animeParams.setGradeFilter(value)
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
              animeStore.updateVideo({
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
        header: () => h(RecordCreateButton, {
          title: 'Создать запись',
          placeholder: 'https://shikimori.one/animes/example',
          onSubmit: (link: string) => createRecord(link),
        }),
        cell: ({ row }) => {
          return h('div', {}, {
            default: () => [
              h(DialogButton, {
                key: `id-${row.original.id}`,
                icon: Eraser,
                onClick: () => dialog.openDialog({
                  title: `Удалить анимешку?`,
                  content: '',
                  description: `Вы уверены, что хотите удалить ${row.original.title ? `"${row.original.title}"` : 'эту запись'}?`,
                  onSubmit: () => animeStore.deleteVideo(row.original.id),
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
  import.meta.hot.accept(acceptHMRUpdate(useAnimeTable, import.meta.hot))
}
