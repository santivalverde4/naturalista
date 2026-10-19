'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import {
  AUTH_COOKIE_NAME,
  SESSION_MAX_AGE,
  createSessionToken,
  verifyCredentials,
} from '@/lib/auth';
import { checkRateLimit } from '@/lib/rateLimit';

export type AuthState = {
  error?: string;
};

/**
 * Accion de servidor para iniciar sesion
 */
export async function loginAction(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  // Limite de 5 intentos de inicio de sesion por minuto por IP
  const rateLimit = checkRateLimit('login', 5, 60000);
  if (!rateLimit.success) {
    return {
      error: 'Demasiados intentos fallidos. Espera un minuto antes de reintentar.',
    };
  }

  const user = (formData.get('username') as string) || '';
  const pass = (formData.get('password') as string) || '';

  if (!process.env.AUTH_USER || !process.env.AUTH_PASSWORD) {
    return {
      error: 'Configuracion incompleta: AUTH_USER o AUTH_PASSWORD no estan definidos en .env.local.',
    };
  }

  const isValid = verifyCredentials(user, pass);
  if (!isValid) {
    return {
      error: 'Usuario o contraseña incorrectos.',
    };
  }

  const token = await createSessionToken();
  const cookieStore = cookies();

  cookieStore.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  });

  redirect('/');
}

/**
 * Accion de servidor para cerrar sesion
 */
export async function logoutAction() {
  const cookieStore = cookies();
  cookieStore.delete(AUTH_COOKIE_NAME);
  redirect('/login');
}
