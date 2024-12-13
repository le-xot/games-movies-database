import TableColPerson from '@/components/table/table-col/table-col-person.vue'
import TableColSelect from '@/components/table/table-col/table-col-select.vue'
import TableColTitle from '@/components/table/table-col/table-col-title.vue'
import TableHeaderButton from '@/components/table/table-header/table-header-button.vue'
import TableHeaderButtonConfirm from '@/components/table/table-header/table-header-button-confirm.vue'
import { useUser } from '@/composables/use-user'
import { VideoEntity } from '@/lib/api.ts'
import { ColumnDef } from '@tanstack/vue-table'
import { CirclePlus, Eraser } from 'lucide-vue-next'
import { acceptHMRUpdate, defineStore, storeToRefs } from 'pinia'
import { computed, h } from 'vue'
import { useVideos } from './use-videos'

export const useVideosTable = defineStore('videos/use-videos-table', () => {
  const { isAdmin } = storeToRefs(useUser())
  const videos = useVideos()
  const tableColumns = computed(() => {
    const columns: ColumnDef<VideoEntity>[] = [
      {
        accessorKey: 'title',
        header: 'Название',
        cell: ({ row }) => {
          return h(TableColTitle, {
            key: `title-${row.original.id}`,
            title: row.original.title,
            onUpdate: (title) => videos.updateVideo({
              id: row.original.id,
              data: { title },
            }),
          })
        },
      },
      {
        accessorKey: 'genre',
        header: 'Жанр',
        cell: ({ row }) => {
          return h(TableColSelect, {
            key: `genre-${row.original.id}`,
            value: row.original.genre,
            kind: 'genre',
            onUpdate: (value) => {
              videos.updateVideo({
                id: row.original.id,
                data: { genre: value },
              })
            },
          })
        },
      },
      {
        accessorKey: 'person',
        header: 'Заказчик',
        cell: ({ row }) => {
          return h(TableColPerson, {
            key: `person-${row.original.id}`,
            personId: row.original.person?.id,
            onUpdate: (personId) => videos.updateVideo({
              id: row.original.id,
              data: { personId },
            }),
          })
        },
      },
      {
        accessorKey: 'status',
        header: 'Статус',
        cell: ({ row }) => {
          return h(TableColSelect, {
            key: `status-${row.original.id}`,
            value: row.original.status,
            kind: 'status',
            onUpdate: (value) => {
              videos.updateVideo({
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
        cell: ({ row }) => {
          return h(TableColSelect, {
            key: `grade-${row.original.id}`,
            value: row.original.grade,
            kind: 'grade',
            onUpdate: (value) => {
              videos.updateVideo({
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
        header: () => {
          return h(TableHeaderButton, {
            icon: CirclePlus,
            onClick: () => videos.createVideo(),
          })
        },
        cell: ({ row }) => {
          return h(TableHeaderButtonConfirm, {
            key: `id-${row.original.id}`,
            icon: Eraser,
            onClick: () => videos.deleteVideo(row.original.id),
          })
        },
      })
    }
    return columns
  })
  return {
    tableColumns,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useVideosTable, import.meta.hot))
}
