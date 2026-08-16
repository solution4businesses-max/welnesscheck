export function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

// Monday-first week containing `date`, as an array of 7 ISO date strings.
export function currentWeekISO(date = new Date()): string[] {
  const day = (date.getDay() + 6) % 7 // 0 = Monday
  const monday = new Date(date)
  monday.setDate(date.getDate() - day)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d.toISOString().slice(0, 10)
  })
}

export const WEEKDAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
