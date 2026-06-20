import type { User, SavedScore } from "./data"

const isBrowser = typeof window !== "undefined"

export function getUser(): User {
  if (!isBrowser) return null
  try {
    return JSON.parse(localStorage.getItem("av_user") || "null")
  } catch {
    return null
  }
}

export function setUser(user: User): void {
  if (!isBrowser) return
  if (user) {
    localStorage.setItem("av_user", JSON.stringify(user))
  } else {
    localStorage.removeItem("av_user")
  }
}

export function clearUser(): void {
  if (!isBrowser) return
  localStorage.removeItem("av_user")
}

export function getScores(): SavedScore[] {
  if (!isBrowser) return []
  try {
    return JSON.parse(localStorage.getItem("av_scores") || "[]")
  } catch {
    return []
  }
}

export function saveScore(entry: Omit<SavedScore, "at">): void {
  if (!isBrowser) return
  try {
    const all = getScores()
    all.push({ ...entry, at: Date.now() })
    localStorage.setItem("av_scores", JSON.stringify(all))
  } catch {
    // storage lleno o bloqueado
  }
}
