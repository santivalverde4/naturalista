'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { loginAction, type AuthState } from '@/app/authActions';

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full bg-green-600 text-white font-medium py-3 rounded-full text-sm hover:bg-green-700 active:scale-95 transition-all disabled:opacity-60 shadow-sm"
    >
      {pending ? 'Ingresando...' : 'Iniciar sesion'}
    </button>
  );
}

export default function LoginPage() {
  const initialState: AuthState = {};
  const [state, formAction] = useFormState(loginAction, initialState);

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm bg-white rounded-3xl p-8 border border-green-100 shadow-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-green-800">Naturalista</h1>
          <p className="text-sm text-green-600 mt-1">Acceso a mi coleccion</p>
        </div>

        {state?.error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl p-3 mb-5">
            {state.error}
          </div>
        )}

        <form action={formAction} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">
              Usuario
            </label>
            <input
              type="text"
              name="username"
              required
              autoCapitalize="none"
              autoCorrect="off"
              autoFocus
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
              placeholder="Nombre de usuario"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">
              Contraseña
            </label>
            <input
              type="password"
              name="password"
              required
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
              placeholder="Contraseña"
            />
          </div>

          <div className="pt-2">
            <SubmitButton />
          </div>
        </form>
      </div>
    </main>
  );
}
