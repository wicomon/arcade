"use client"

import { useState, useEffect } from "react"
import type { User } from "@/lib/data"
import { getUser, setUser as persistUser, clearUser } from "@/lib/storage"

export function useAuth() {
  const [user, setUser] = useState<User>(null)

  useEffect(() => {
    setUser(getUser())
  }, [])

  const login = (u: User) => {
    persistUser(u)
    setUser(u)
  }

  const signOut = () => {
    clearUser()
    setUser(null)
  }

  return { user, login, signOut }
}
