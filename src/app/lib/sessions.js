import 'server-only'
import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import {cache} from 'react';
import { redirect } from 'next/navigation';

 
const secretKey = process.env.SESSION_SECRET
const encodedKey = new TextEncoder().encode(secretKey)
 
export async function encrypt(payload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(encodedKey)
}
 
export async function decrypt(session) {
  try {
    const { payload } = await jwtVerify(session, encodedKey, {
      algorithms: ['HS256'],
    })
    return payload
  } catch (error) {
    console.log('Failed to verify session')
  }
}

export async function createSession(userId, playerId=null, list_manager_id=null, token, expiry) {
  const expiresAt = new Date(expiry)
  const session = await encrypt({ userId, playerId, list_manager_id, token, expiresAt })
  const cookieStore = await cookies()
 
  cookieStore.set('session', session, {
    httpOnly: true,
    secure: true,
    expires: expiresAt,
    sameSite: 'lax',
    path: '/',
  })
}

export const verifySession = cache(async () => {
  const cookie = (await cookies()).get('session')?.value
  const session = await decrypt(cookie)
 
  if (!session?.userId || new Date(session?.expiresAt) < new Date()) {
    // redirect('/login')
    return { isAuth: false };
  }
 
  return { isAuth: true, userId: session.userId, playerId: session.playerId, list_manager_id: session.list_manager_id, token: session.token }
})

export async function deleteSession() {
  const cookieStore = await cookies()
  cookieStore.delete('session')
}