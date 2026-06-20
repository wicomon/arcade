"use client"

import Nav from "@/components/nav"
import { useAuth } from "@/hooks/use-auth"

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth()

  return (
    <>
      <Nav user={user} onSignOut={signOut} />
      <main className="av-main">{children}</main>
      <footer
        style={{
          borderTop: "1px solid var(--line)",
          padding: "20px 32px",
          textAlign: "center",
          color: "var(--ink-faint)",
          fontFamily: "var(--mono)",
          fontSize: 11,
          letterSpacing: "0.16em",
        }}
      >
        © 2026 ARCADE VAULT · HECHO CON PIXELES Y NEÓN · v2.6.0
      </footer>
    </>
  )
}
