import { google } from 'googleapis';

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

export function getAuthClient() {
  const email = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY;

  if (!email || !privateKey) {
    throw new Error('Configuracion incompleta: GOOGLE_CLIENT_EMAIL o GOOGLE_PRIVATE_KEY no definidos.');
  }

  return new google.auth.JWT({
    email,
    // Vercel escapa los \n en env vars — los restauramos aquí
    key: privateKey.replace(/\\n/g, '\n'),
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
