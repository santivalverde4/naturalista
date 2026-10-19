import { google } from 'googleapis';

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

function formatPrivateKey(raw: string): string {
  let key = raw.trim();
  // Eliminar coma final si fue copiada directamente de un archivo JSON
  if (key.endsWith(',')) {
    key = key.slice(0, -1).trim();
  }
  // Eliminar comillas envolventes si estan presentes
  if (
    (key.startsWith('"') && key.endsWith('"')) ||
    (key.startsWith("'") && key.endsWith("'"))
  ) {
    key = key.slice(1, -1);
  }
  // Convertir saltos de linea escapados a saltos reales
  return key.replace(/\\n/g, '\n').replace(/\r/g, '');
}

export function getAuthClient() {
  const email = process.env.GOOGLE_CLIENT_EMAIL?.trim();
  const privateKey = process.env.GOOGLE_PRIVATE_KEY;

  if (!email || !privateKey) {
    throw new Error('Configuracion incompleta: GOOGLE_CLIENT_EMAIL o GOOGLE_PRIVATE_KEY no definidos.');
  }

  return new google.auth.JWT({
    email,
    key: formatPrivateKey(privateKey),
    scopes: SCOPES,
  });
}

export function getSheetsClient() {
  return google.sheets({ version: 'v4', auth: getAuthClient() });
}

export function getSheetId(): string {
  const sheetId = process.env.GOOGLE_SHEET_ID;
  if (!sheetId) {
    throw new Error('Configuracion incompleta: GOOGLE_SHEET_ID no definido.');
  }
  return sheetId;
}

export const SHEET_ID = process.env.GOOGLE_SHEET_ID || '';

export const TABS = {
  coleccion: 'Coleccion',
  muertas: 'Muertas',
  wishlist: 'Wishlist',
} as const;

export type TabName = keyof typeof TABS;

/**
 * Normaliza una cadena para comparar nombres de pestanas:
 * Quita tildes, convierte a minusculas y elimina espacios en blanco extras.
 */
export function normalizeTabName(name: string): string {
  return (name ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * Formatea el nombre de la hoja entre comillas simples para consultas de rango en la API.
 * Escapa comillas simples internas duplicandolas.
 */
export function escapeSheetRange(sheetTitle: string, range: string): string {
  const escapedTitle = sheetTitle.replace(/'/g, "''");
  return `'${escapedTitle}'!${range}`;
}

export interface SheetInfo {
  title: string;
  sheetId: number;
}

let cachedSheetsMeta: {
  spreadsheetId: string;
  timestamp: number;
  sheets: SheetInfo[];
} | null = null;

export async function getSpreadsheetSheets(
  sheetsClient: ReturnType<typeof getSheetsClient>,
  spreadsheetId: string
): Promise<SheetInfo[]> {
  const now = Date.now();
  if (
    cachedSheetsMeta &&
    cachedSheetsMeta.spreadsheetId === spreadsheetId &&
    now - cachedSheetsMeta.timestamp < 60000
  ) {
    return cachedSheetsMeta.sheets;
  }

  const meta = await sheetsClient.spreadsheets.get({
    spreadsheetId,
    fields: 'sheets.properties(sheetId,title)',
  });

  const sheets: SheetInfo[] = (meta.data.sheets || []).map((s) => ({
    title: s.properties?.title || '',
    sheetId: s.properties?.sheetId ?? 0,
  }));

  cachedSheetsMeta = {
    spreadsheetId,
    timestamp: now,
    sheets,
  };

  return sheets;
}

const TAB_ALIASES: Record<TabName, string[]> = {
  coleccion: ['coleccion', 'colección', 'tengo'],
  muertas: ['muertas', 'muerta'],
  wishlist: ['wishlist', 'deseos', 'deseadas'],
};

export async function resolveSheetInfo(
  sheetsClient: ReturnType<typeof getSheetsClient>,
  spreadsheetId: string,
  tab: TabName
): Promise<SheetInfo> {
  try {
    const sheets = await getSpreadsheetSheets(sheetsClient, spreadsheetId);
    const aliases = TAB_ALIASES[tab].map(normalizeTabName);

    const found = sheets.find((s) => {
      const norm = normalizeTabName(s.title);
      return aliases.some((alias) => norm === alias || norm.startsWith(alias));
    });

    if (found && found.title) {
      return found;
    }
  } catch {
    // Si falla la consulta de metadata, se usa el nombre por defecto
  }

  return { title: TABS[tab], sheetId: 0 };
}

