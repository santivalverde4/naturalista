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

// Nombres de las hojas/pestañas en el Spreadsheet
export const TABS = {
  coleccion: 'Coleccion',
  muertas: 'Muertas',
  wishlist: 'Wishlist',
} as const;

export type TabName = keyof typeof TABS;
