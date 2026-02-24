export const DEMO_START_HOUR = 14
export const DEMO_TOTAL_SLOTS = 12 // 14:00–20:00, 6h × 2 half-hour slots
export const DEMO_DAYS = ['Wed', 'Thu', 'Sat'] as const

export const DEMO_ROOM_NAME = "Dragon's Lair"
export const DEMO_PASSWORD = 'fireball'

function makeDay(trueRanges: [number, number][]): boolean[] {
  const arr = new Array(DEMO_TOTAL_SLOTS).fill(false) as boolean[]
  for (const [start, end] of trueRanges) {
    for (let i = start; i <= end; i++) arr[i] = true
  }
  return arr
}

// Slot index = (hour - 14) * 2 + (minute === 30 ? 1 : 0)
// slot 0 = 14:00, slot 2 = 15:00, slot 7 = 17:30, slot 8 = 18:00, slot 11 = 19:30

// "You": Wed 18:00–19:30, Thu 18:00–19:30, Sat 15:00–18:30
export const DEMO_YOU: boolean[][] = [
  makeDay([[8, 11]]),  // Wed
  makeDay([[8, 11]]),  // Thu
  makeDay([[2, 9]]),   // Sat
]

// Alice: Wed 18:00–19:30, Sat 15:00–18:30
export const ALICE: boolean[][] = [
  makeDay([[8, 11]]),  // Wed
  makeDay([]),         // Thu
  makeDay([[2, 9]]),   // Sat
]

// John: Thu 18:00–19:30, Sat 14:00–17:30
// Sat overlap with You+Alice = slots 2–7 (15:00–17:30) = 6 slots ≥ 4 (2h) → viable
export const JOHN: boolean[][] = [
  makeDay([]),         // Wed
  makeDay([[8, 11]]),  // Thu
  makeDay([[0, 7]]),   // Sat
]
