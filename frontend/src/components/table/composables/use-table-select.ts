import { acceptHMRUpdate, defineStore } from 'pinia';
import { RecordGenre, RecordGrade, RecordStatus } from '@/lib/api';

export interface BadgeOptions {
  name: string;
  label?: string;
  description?: string;
  class?: string;
}

export type SelectKind = 'genre' | 'status' | 'grade';

export const statusTags: Record<RecordStatus, BadgeOptions> = {
  [RecordStatus.QUEUE]: {
    name: 'В очереди',
    description: 'заказ ждёт своего часа.',
    class: 'bg-[#333333]',
  },
  [RecordStatus.UNFINISHED]: {
    name: 'Нет концовки',
    description: 'игра не имеет концовки (титров или логического завершения сюжета).',
    class: 'bg-[#28456c]',
  },
  [RecordStatus.DONE]: {
    name: 'Готово',
    description: 'игра выполнена, кинолента посмотрена.',
    class: 'bg-[#2b593f]',
  },
  [RecordStatus.PROGRESS]: {
    name: 'В процессе',
    description: 'заказ находится на стадии выполнения.',
    class: 'bg-[#89632a]',
  },
  [RecordStatus.DROP]: {
    name: 'Дроп',
    description: 'заказ не будет закончен до конца.',
    class: 'bg-[#6e3630]',
  },
  [RecordStatus.NOTINTERESTED]: {
    name: 'Не интересно',
    description: 'заказ не интересен.',
  },
};

export const genreTags: Partial<Record<RecordGenre, BadgeOptions>> = {
  [RecordGenre.MOVIE]: {
    name: 'Фильм',
    class: 'bg-[#2b593f] border text-white/80',
  },
  [RecordGenre.SERIES]: {
    name: 'Сериал',
    class: 'bg-[#28456c] border text-white/80',
  },
  [RecordGenre.ANIME]: {
    name: 'Аниме',
    class: 'bg-[#6e3630] border text-white/80',
  },
  [RecordGenre.CARTOON]: {
    name: 'Мультфильм',
    class: 'bg-[#89632a] border text-white/80',
  },
};

export const gradeTags: Record<RecordGrade, BadgeOptions> = {
  [RecordGrade.RECOMMEND]: {
    name: '🔥',
    label: 'Рекомендую',
    description: 'надеюсь, что это понравится всем. Произведения заслуживающие внимания.',
    class: 'bg-[#28456c] border',
  },
  [RecordGrade.LIKE]: {
    name: '👍',
    label: 'Понравилось',
    description: 'мне, но может не понравится вам. Больше вкусовщина.',
    class: 'bg-[#2b593f] border',
  },
  [RecordGrade.BEER]: {
    name: '🍺',
    label: 'Под пивко',
    description: 'пойдёт. Больше чем на один разочек не тянет, как не старайся.',
    class: 'bg-[#89632a] border',
  },
  [RecordGrade.DISLIKE]: {
    name: '👎',
    label: 'Не рекомендую',
    description: 'и считаю это пустой тратой времени и недостойным проведением досуга.',
    class: 'bg-[#6e3630] border',
  },
};

export const useTableSelect = defineStore('use-table-select', () => {
  const options: Record<SelectKind, { label: string; value: string; class?: string }[]> = {
    status: Object.entries(statusTags).map(([key, value]) => {
      return {
        label: value.name,
        value: key,
        class: value.class,
      };
    }),
    genre: Object.entries(genreTags).map(([key, value]) => {
      return {
        label: value.name,
        value: key,
        class: value.class,
      };
    }),
    grade: Object.entries(gradeTags).map(([key, value]) => {
      return {
        label: `${value.name} ${value.label}`,
        value: key,
        class: value.class,
      };
    }),
  };

  return {
    gradeTags,
    statusTags,
    genreTags,
    options,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useTableSelect, import.meta.hot));
}
