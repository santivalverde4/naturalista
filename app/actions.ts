'use server';

import { getSheetsClient, getSheetId, TABS, TabName } from '@/lib/sheets';
import { checkRateLimit } from '@/lib/rateLimit';
import { revalidatePath } from 'next/cache';

export type { TabName };

export type Plant = {
  id: string;
  familia: string;
  genero: string;
  especie: string;
  fecha: string;
};

/**
 * Sanitiza texto para evitar Formula Injection (CSV injection) en Google Sheets.
 * Si el texto inicia con '=', '+', '-', '@', se antepone un apostrofe para forzarlo a texto literal.
 */
function sanitizeCell(value: string | undefined | null): string {
  const str = (value ?? '').trim();
  if (/^[=+\-@\t\r]/.test(str)) {
    return `'${str}`;
  }
  return str.slice(0, 250);
}

/**
 * Lee todas las plantas de una pestaña del Spreadsheet.
 * Salta la fila 1 (encabezados) y lee hasta la fila 1000.
 */
export async function getPlants(tab: TabName): Promise<Plant[]> {
  if (!TABS[tab]) {
    throw new Error('Pestaña no válida');
  }

  // Limite de 40 lecturas por minuto por direccion IP
  const rateLimit = checkRateLimit('getPlants', 40, 60000);
  if (!rateLimit.success) {
    throw new Error('Demasiadas consultas. Por favor espera un momento antes de recargar.');
  }

  const sheets = getSheetsClient();
  const sheetName = TABS[tab];
  const spreadsheetId = getSheetId();

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${sheetName}!A2:E1000`,
  });

  const rows = res.data.values ?? [];
  return rows
    .filter((row) => row[0]) // filtra filas vacías
    .map(([id, familia, genero, especie, fecha]) => ({
      id: id ?? '',
      familia: familia ?? '',
      genero: genero ?? '',
      especie: especie ?? '',
      fecha: fecha ?? '',
    }));
}

/**
 * Agrega una planta nueva al final de una pestaña.
 * Genera un ID basado en timestamp y guarda la fecha actual.
 */
export async function addPlant(
  tab: TabName,
  data: { familia: string; genero: string; especie: string }
) {
  if (!TABS[tab]) {
    throw new Error('Pestaña no válida');
  }

  // Limite de 10 escrituras por minuto por direccion IP
  const rateLimit = checkRateLimit('addPlant', 10, 60000);
  if (!rateLimit.success) {
    throw new Error('Limite de solicitudes excedido: maximo 10 plantas por minuto.');
  }

  const sheets = getSheetsClient();
  const sheetName = TABS[tab];
  const spreadsheetId = getSheetId();
  const id = Date.now().toString();
  const fecha = new Date().toLocaleDateString('es-CR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const safeFamilia = sanitizeCell(data.familia);
  const safeGenero = sanitizeCell(data.genero);
  const safeEspecie = sanitizeCell(data.especie);

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${sheetName}!A1`,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[id, safeFamilia, safeGenero, safeEspecie, fecha]],
    },
  });

  revalidatePath('/');
}

/**
 * Elimina una planta por ID de una pestaña.
 * Busca la fila con el ID dado y la elimina con batchUpdate.
 */
export async function deletePlant(tab: TabName, plantId: string) {
  if (!TABS[tab] || !plantId || typeof plantId !== 'string') {
    return;
  }

  // Limite de 15 eliminaciones por minuto por direccion IP
  const rateLimit = checkRateLimit('deletePlant', 15, 60000);
  if (!rateLimit.success) {
    throw new Error('Limite de solicitudes excedido: espera un momento antes de eliminar nuevamente.');
  }

  const sheets = getSheetsClient();
  const sheetName = TABS[tab];
  const spreadsheetId = getSheetId();

  // Primero obtenemos todos los IDs para encontrar el índice de fila
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${sheetName}!A2:A1000`,
  });

  const ids = res.data.values ?? [];
  const rowIndex = ids.findIndex((row) => row[0] === plantId);

  if (rowIndex === -1) return; // No encontrada

  // Obtenemos el sheetId (numérico) de la pestaña
  const meta = await sheets.spreadsheets.get({
    spreadsheetId,
  });

  const sheet = meta.data.sheets?.find(
    (s) => s.properties?.title === sheetName
  );
  const sheetId = sheet?.properties?.sheetId;

  if (sheetId === undefined) return;

  // rowIndex + 1 porque empezamos a leer desde A2 (saltamos encabezado)
  const realRowIndex = rowIndex + 1;

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId,
              dimension: 'ROWS',
              startIndex: realRowIndex,
              endIndex: realRowIndex + 1,
            },
          },
        },
      ],
    },
  });

  revalidatePath('/');
}
