import type { Table } from "@tanstack/vue-table"
import type { InjectionKey } from "vue"

type TableContext = Table<any>

export const tableInjectionKey = Symbol("table") as InjectionKey<TableContext>
