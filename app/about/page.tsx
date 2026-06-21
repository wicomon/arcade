"use client"

import { useEffect, useRef, useState } from "react"

function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll(".reveal")
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in")
            io.unobserve(e.target)
          }
        })
      },
      { threshold: 0.12 },
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])
}

const HeartIcon = () => (
  <svg viewBox="0 0 32 28" className="hl-icon" aria-hidden="true" fill="currentColor">
    <rect x="4"  y="0"  width="8"  height="4" />
    <rect x="20" y="0"  width="8"  height="4" />
    <rect x="0"  y="4"  width="32" height="8" />
    <rect x="4"  y="12" width="24" height="4" />
    <rect x="8"  y="16" width="16" height="4" />
    <rect x="12" y="20" width="8"  height="4" />
  </svg>
)

const BrowserIcon = () => (
  <svg viewBox="0 0 32 28" className="hl-icon" aria-hidden="true" fill="currentColor">
    <rect x="0"  y="0"  width="32" height="8" />
    <rect x="2"  y="2"  width="4"  height="4" fill="#050507" />
    <rect x="8"  y="2"  width="4"  height="4" fill="#050507" />
    <rect x="14" y="2"  width="4"  height="4" fill="#050507" />
    <rect x="0"  y="0"  width="2"  height="28" />
    <rect x="30" y="0"  width="2"  height="28" />
    <rect x="0"  y="26" width="32" height="2" />
    <rect x="2"  y="12" width="20" height="2" opacity="0.6" />
    <rect x="2"  y="16" width="16" height="2" opacity="0.6" />
    <rect x="2"  y="20" width="22" height="2" opacity="0.6" />
  </svg>
)

const PlantIcon = () => (
  <svg viewBox="0 0 32 32" className="hl-icon" aria-hidden="true" fill="currentColor">
    <rect x="14" y="0"  width="4"  height="4" />
    <rect x="10" y="4"  width="12" height="4" />
    <rect x="0"  y="8"  width="12" height="6" />
    <rect x="14" y="8"  width="4"  height="4" />
    <rect x="20" y="4"  width="12" height="6" />
    <rect x="14" y="12" width="4"  height="12" />
    <rect x="4"  y="26" width="24" height="4" />
    <rect x="8"  y="30" width="16" height="2" />
  </svg>
)

type FormState = "idle" | "shake" | "loading" | "success" | "error"

function ContactForm() {
  const [name, setName]   = useState("")
  const [email, setEmail] = useState("")
  const [msg, setMsg]     = useState("")
  const [state, setState] = useState<FormState>("idle")
  const [termLines, setTermLines] = useState<string[]>([])
  const formRef = useRef<HTMLDivElement>(null)

  const handleSubmit = async () => {
    if (!name.trim() || !email.trim() || !msg.trim()) {
      const el = formRef.current
      if (!el) return
      el.classList.add("shake")
      el.addEventListener("animationend", () => el.classList.remove("shake"), { once: true })
      return
    }

    setState("loading")

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, msg }),
      })
      const data = await res.json()

      if (data.ok) {
        const lines = [
          `CONECTANDO CON ARCADE VAULT...`,
          `MENSAJE RECIBIDO DE ${name.toUpperCase()}`,
          `VERIFICANDO DATOS...`,
          `EMAIL: ${email}`,
          `ESTADO: OK — ENTREGADO`,
          `GRACIAS POR ESCRIBIRNOS.`,
        ]
        setTermLines([])
        setState("success")
        lines.forEach((line, i) => {
          setTimeout(() => setTermLines((prev) => [...prev, line]), i * 280)
        })
      } else {
        setState("error")
      }
    } catch {
      setState("error")
    }
  }

  const reset = () => {
    setName(""); setEmail(""); setMsg("")
    setState("idle"); setTermLines([])
  }

  if (state === "success") {
    return (
      <div className="terminal-success">
        <div className="term-bar">
          <span className="dot r" /><span className="dot y" /><span className="dot g" />
          <span className="term-title">arcade-vault — mensaje</span>
        </div>
        <div className="term-body">
          {termLines.map((line, i) => (
            <div key={i} className="line">
              <span className="prompt">$</span>{line}
            </div>
          ))}
          {termLines.length < 6 && <span className="caret">▌</span>}
          {termLines.length === 6 && (
            <div style={{ marginTop: 20 }}>
              <button className="btn" onClick={reset}>ENVIAR OTRO MENSAJE</button>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="contact-form" ref={formRef}>
      <div className="field">
        <label htmlFor="cf-name">Nombre</label>
        <input
          id="cf-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Tu nombre"
          disabled={state === "loading"}
        />
      </div>
      <div className="field">
        <label htmlFor="cf-email">Email</label>
        <input
          id="cf-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@email.com"
          disabled={state === "loading"}
        />
      </div>
      <div className="field">
        <label htmlFor="cf-msg">Mensaje</label>
        <textarea
          id="cf-msg"
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
          placeholder="¿Qué tienes en mente?"
          disabled={state === "loading"}
        />
      </div>
      <button
        className={"btn" + (state === "loading" ? " ghost" : "")}
        onClick={handleSubmit}
        disabled={state === "loading"}
        style={{ width: "100%", justifyContent: "center" }}
      >
        {state === "loading" ? (
          <><span className="spinner" />ENVIANDO...</>
        ) : (
          "ENVIAR MENSAJE"
        )}
      </button>
      {state === "error" && (
        <p className="form-error">Algo salió mal, inténtalo más tarde.</p>
      )}
    </div>
  )
}

export default function AboutPage() {
  useReveal()

  return (
    <main className="av-main about">
      {/* ── ABOUT HERO ── */}
      <section className="about-hero">
        <p className="pixel kicker neon-yellow">▸ ACERCA DE</p>
        <h1 className="about-title">ACERCA DE ARCADE VAULT</h1>
        <p className="about-mission">
          Arcade Vault nació de una idea simple: los mejores momentos del gaming
          no son los gráficos fotorrealistas ni las historias épicas —son el
          instante en que superas tu propio récord. Aquí reunimos los juegos más
          adictivos de la historia y les damos una tabla de clasificación global
          para que compitas con el mundo entero.
        </p>

        <div className="highlight-row">
          <div className="highlight magenta">
            <HeartIcon />
            <div className="hl-text">
              HECHO CON PASIÓN — Cada juego es elegido a mano por su capacidad de enganchar.
              Si no te quedas &quot;una partida más&quot;, no entra al vault.
            </div>
          </div>

          <div className="highlight cyan">
            <BrowserIcon />
            <div className="hl-text">
              JUEGA EN EL NAVEGADOR — Sin descargas, sin instalaciones.
              Abre el juego y empieza a competir en segundos desde cualquier dispositivo.
            </div>
          </div>

          <div className="highlight green">
            <PlantIcon />
            <div className="hl-text">
              CRECE CON LA COMUNIDAD — Las tablas de puntuación son globales y en tiempo real.
              Tu nombre puede estar en lo más alto del salón de la fama.
            </div>
          </div>
        </div>
      </section>

      {/* ── DIVIDER ── */}
      <div className="reveal about-divider">
        <div className="div-bar" />
        <div className="div-pixels" aria-hidden="true">
          {Array.from({ length: 24 }, (_, i) => (
            <span key={i} style={{ animationDelay: `${(i * 0.1).toFixed(1)}s` }} />
          ))}
        </div>
        <div className="div-bar" />
      </div>

      {/* ── CONTACT SECTION ── */}
      <section className="reveal about-contact">
        <div className="contact-grid">
          <div className="contact-intro">
            <p className="pixel kicker neon-yellow">▸ CONTACTO</p>
            <h2 className="contact-title">ESCRÍBENOS</h2>
            <p className="contact-sub">
              ¿Tienes una idea de juego, encontraste un bug, o simplemente
              quieres decir hola? Nos encanta leer cada mensaje.
            </p>
            <div className="contact-tips">
              <div className="tip">
                <span className="tip-led" />
                Respondemos en menos de 48&nbsp;h en días laborables.
              </div>
              <div className="tip">
                <span className="tip-led m" />
                Si propones un juego, incluye el nombre y por qué mola.
              </div>
              <div className="tip">
                <span className="tip-led y" />
                Los reportes de bugs con pasos para reproducirlos se atienden primero.
              </div>
            </div>
          </div>

          <ContactForm />
        </div>
      </section>
    </main>
  )
}
