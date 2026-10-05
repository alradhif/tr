import { Table } from 'antd'
import type { TableProps } from 'antd'
import { EmptyState } from '../EmptyState'

export type DataTableProps<T extends object> = TableProps<T>

export function DataTable<T extends object>(props: DataTableProps<T>) {
  return (
    <Table<T>
      pagination={false}
      className="sa-table"
      {...props}
      locale={{
        emptyText: <EmptyState />,
        ...props.locale,
      }}
    />
  )
}
