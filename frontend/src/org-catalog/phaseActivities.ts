export type PhaseActivity = { name: string; owner: string; startDate: string; endDate: string }

// Phase activities are stored in the phase notes, either as a JSON array (projects created with
// stages in one request) or as one "name | owner | start | end" line per activity (the project form).
export function parsePhaseActivities(notes: unknown): PhaseActivity[] {
  const text = String(notes ?? '').trim()
  if (!text) return []
  if (text.startsWith('[')) {
    try {
      const rows = JSON.parse(text)
      if (Array.isArray(rows)) {
        return rows
          .filter((row) => row && typeof row === 'object')
          .map((row) => ({
            name: String(row.name ?? '').trim(),
            owner: String(row.owner ?? '').trim(),
            startDate: String(row.startDate ?? '').slice(0, 10),
            endDate: String(row.endDate ?? '').slice(0, 10),
          }))
          .filter((row) => row.name)
      }
    } catch {
      // Not JSON after all: fall through to the line format.
    }
  }
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [name = '', owner = '', startDate = '', endDate = ''] = line.split('|').map((part) => part.trim())
      return { name, owner, startDate, endDate }
    })
}
