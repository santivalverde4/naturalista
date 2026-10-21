'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

const TABS = [
  { key: 'coleccion', label: 'Colección' },
  { key: 'muertas', label: 'Muertas' },
  { key: 'wishlist', label: 'Wishlist' },
  { key: 'porIdentificar', label: 'Por Identificar' },
] as const;

export default function TabNav({ activeTab }: { activeTab: string }) {
  const searchParams = useSearchParams();

  function buildHref(tabKey: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tabKey);
    // Resetea la búsqueda al cambiar de pestaña
    params.delete('q');
    return `/?${params.toString()}`;
  }

  return (
    <nav className="flex gap-2 mb-4 overflow-x-auto pb-1">
      {TABS.map(({ key, label }) => (
        <Link
          key={key}
          href={buildHref(key)}
          className={`
            whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium
            transition-colors flex-shrink-0
            ${
              activeTab === key
                ? 'bg-green-600 text-white shadow-sm'
                : 'bg-white text-green-800 border border-green-200 hover:bg-green-50'
            }
          `}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}
