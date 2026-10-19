import { getPlants, type Plant, type TabName } from '@/app/actions';
import { logoutAction } from '@/app/authActions';
import TabNav from '@/components/TabNav';
import PlantTable from '@/components/PlantTable';
import SearchBar from '@/components/SearchBar';

interface HomeProps {
  searchParams: Promise<{ tab?: string; q?: string }>;
}

export default async function Home({ searchParams }: HomeProps) {
  const params = await searchParams;
  const tab = (params.tab ?? 'coleccion') as TabName;
  const query = (params.q ?? '').toLowerCase();

  let plants: Plant[] = [];
  let configError = '';

  try {
    plants = await getPlants(tab);
  } catch (error: any) {
    configError = error?.message || 'Error al conectar con Google Sheets.';
  }

  const filtered = query
    ? plants.filter((p) =>
        [p.familia, p.genero, p.especie].some((f) =>
          f?.toLowerCase().includes(query)
        )
      )
    : plants;

  return (
    <main className="max-w-2xl mx-auto px-4 pt-6 pb-24">
      {/* Header */}
      <div className="flex justify-between items-start mb-5">
        <div>
          <h1 className="text-2xl font-bold text-green-800">Naturalista</h1>
          <p className="text-sm text-green-600">Mi colección de plantas</p>
        </div>
        <form action={logoutAction}>
          <button
            type="submit"
            className="text-xs text-gray-500 hover:text-red-600 bg-white border border-gray-200 rounded-full px-3 py-1.5 transition-colors shadow-sm"
          >
            Cerrar sesion
          </button>
        </form>
      </div>

      {configError && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl p-4 mb-5 text-sm">
          <p className="font-semibold mb-1">Aviso de configuracion</p>
          <p className="text-amber-800">{configError}</p>
          <p className="text-xs text-amber-700 mt-2">
            Verifica tus credenciales de Google Cloud y el ID de tu Google Sheet en tu archivo .env o .env.local.
          </p>
        </div>
      )}

      {/* Buscador */}
      <SearchBar defaultValue={params.q ?? ''} />

      {/* Navegación de pestañas */}
      <TabNav activeTab={tab} />

      {/* Tabla de plantas */}
      <PlantTable plants={filtered} tab={tab} />
    </main>
  );
}
