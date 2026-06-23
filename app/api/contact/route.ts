import { Resend } from "resend"
import { NextResponse } from "next/server"

type ContactPayload = {
  name: string
  email: string
  msg: string
}

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  const body: ContactPayload = await req.json()

  if (!body.name?.trim() || !body.email?.trim() || !body.msg?.trim()) {
    return NextResponse.json({ ok: false }, { status: 400 })
  }

  try {
    // TODO: modify sender and recipient as needed
    await resend.emails.send({
      from: "onboarding@resend.dev",
      to: "wcv.dev94@gmail.com",
      subject: `Nuevo mensaje de ${body.name}`,
      text: `Nombre: ${body.name}\nEmail: ${body.email}\n\nMensaje:\n${body.msg}`,
    })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
