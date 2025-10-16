import { NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const body = await request.json() as {
      name?: string
      email?: string
      password?: string
    }

    const { name, email, password } = body

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 })
    }

    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      return NextResponse.json({ error: 'A user with this email already exists.' }, { status: 409 })
    }

    const passwordHash = await hash(password, 10)

    await prisma.user.create({
      data: {
        email,
        name: name?.trim() || null,
        passwordHash,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Registration error', error)
    return NextResponse.json({ error: 'Failed to register user.' }, { status: 500 })
  }
}
