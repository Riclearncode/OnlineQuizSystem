import Card from './Card.jsx'
import EmptyState from './EmptyState.jsx'

export default function Table({ columns, emptyText, rows, title }) {
  return (
    <Card className="p-0 overflow-hidden">
      {title && <div className="border-bottom px-4 py-3"><h2 className="h5 mb-0">{title}</h2></div>}
      <div className="table-responsive">
        <table className="table table-hover mb-0 align-middle">
          <thead>
            <tr>
              {columns.map((column) => <th key={column.key || column}>{column.label || column}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.length > 0 ? rows : (
              <tr>
                <td colSpan={columns.length}>
                  <EmptyState compact message={emptyText} />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
