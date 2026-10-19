'use client';

import { useState, useTransition } from 'react';
import { addPlant, type TabName } from '@/app/actions';

const TAB_LABELS: Record<TabName, string> = {
  coleccion: 'Colección',
  muertas: 'Muertas',
  wishlist: 'Wishlist',
};

export default function AddPlantModal({ tab }: { tab: TabName }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  function openModal() {
    setError('');
    setOpen(true);
  }

  function closeModal() {
    if (!isPending) setOpen(false);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    const fd = new FormData(e.currentTarget);
    const familia = (fd.get('familia') as string).trim();
    const genero = (fd.get('genero') as string).trim();
    const especie = (fd.get('especie') as string).trim();

    startTransition(async () => {
      try {
        await addPlant(tab, { familia, genero, especie });
        setOpen(false);
      } catch (err: any) {
        setError(err?.message || 'Error al guardar. Revisa tu conexion e intenta de nuevo.');
      }
    });
  }

  return (
    <>
      {/* Botón flotante de agregar */}
      <button
        onClick={openModal}
        className="bg-green-600 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-green-700 active:scale-95 transition-all shadow-sm"
      >
        + Agregar
      </button>

      {/* Overlay + Bottom Sheet modal */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end"
          role="dialog"
          aria-modal="true"
          aria-label="Agregar planta"
        >
          {/* Fondo oscuro */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={closeModal}
          />

          {/* Panel inferior estilo iOS */}
          <div className="relative w-full bg-white rounded-t-3xl px-6 pt-4 pb-10 shadow-2xl animate-slide-up">
            {/* Handle visual (barra gris arriba del modal) */}
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />

            <h2 className="text-lg font-bold text-green-900 mb-1">
              Agregar a {TAB_LABELS[tab]}
            </h2>
            <p className="text-xs text-gray-400 mb-5">
              Solo Familia es obligatorio
            </p>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">
                  Familia *
                </label>
                <input
                  name="familia"
                  placeholder="ej: Araceae"
                  required
                  autoFocus
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">
                  Género
                </label>
                <input
                  name="genero"
                  placeholder="ej: Monstera"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">
                  Especie
                </label>
                <input
                  name="especie"
                  placeholder="ej: deliciosa"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                />
              </div>

              {error && (
                <p className="text-red-500 text-xs">{error}</p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={isPending}
                  className="flex-1 border border-gray-200 rounded-full py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 bg-green-600 text-white rounded-full py-3 text-sm font-medium hover:bg-green-700 active:scale-95 transition-all disabled:opacity-60"
                >
                  {isPending ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
