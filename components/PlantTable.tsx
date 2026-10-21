'use client';

import { useTransition } from 'react';
import { deletePlant, type Plant, type TabName } from '@/app/actions';
import AddPlantModal from './AddPlantModal';

export default function PlantTable({
  plants,
  tab,
}: {
  plants: Plant[];
  tab: TabName;
}) {
  const [isPending, startTransition] = useTransition();

  function handleDelete(plantId: string) {
    if (!confirm('¿Eliminar esta planta?')) return;
    startTransition(async () => {
      try {
        await deletePlant(tab, plantId);
      } catch (err: any) {
        alert(err?.message || 'Error al eliminar la planta.');
      }
    });
  }

  return (
    <div>
      {/* Header de la tabla */}
      <div className="flex justify-between items-center mb-3">
        <span className="text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded-full">
          {plants.length} {plants.length === 1 ? 'planta' : 'plantas'}
        </span>
        <AddPlantModal tab={tab} />
      </div>

      {plants.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-sm">No hay plantas aquí todavía</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-green-100 overflow-hidden shadow-sm">
          {/* Encabezados */}
          <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 px-4 py-2 bg-green-50 text-xs font-semibold text-green-700 uppercase tracking-wide">
            <span>Familia</span>
            <span>Género</span>
            <span>Especie</span>
            <span />
          </div>

          {/* Filas */}
          {plants.map((plant, i) => (
            <div
              key={plant.id}
              className={`
                grid grid-cols-[1fr_1fr_1fr_auto] gap-2 px-4 py-3 items-center text-sm
                ${i % 2 === 0 ? 'bg-white' : 'bg-green-50/30'}
                ${isPending ? 'opacity-60' : ''}
              `}
            >
              <span className="font-medium text-gray-800 truncate">
                {plant.familia || '—'}
              </span>
              <span className="text-gray-600 truncate">
                {plant.genero || '—'}
              </span>
              <span className="italic text-gray-500 truncate">
                {plant.especie || '—'}
              </span>
              <div className="flex items-center gap-3">
                <AddPlantModal tab={tab} plant={plant} />
              <button
                onClick={() => handleDelete(plant.id)}
                disabled={isPending}
                className="text-red-300 hover:text-red-500 transition-colors text-lg leading-none disabled:opacity-30"
                title="Eliminar planta"
              >
                ×
              </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
