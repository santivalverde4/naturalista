'use server';

import {
  getSheetsClient,
  getSheetId,
  TABS,
  TabName,
  resolveSheetInfo,
  escapeSheetRange,
} from '@/lib/sheets';
import { checkRateLimit } from '@/lib/rateLimit';
import { revalidatePath } from 'next/cache';

export type { TabName };

export type Plant = {
  id: string;
  familia: string;
  genero: string;
  especie: string;
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
 * Salta la fila 1 (encabezados).
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
  const spreadsheetId = getSheetId();
  const sheetInfo = await resolveSheetInfo(sheets, spreadsheetId, tab);

  const range = escapeSheetRange(sheetInfo.title, 'A2:D');
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range,
  });

  const rows = res.data.values ?? [];
  return rows
    .filter((row) => row && row[0]) // filtra filas vacías
    .map(([id, familia, genero, especie]) => ({
      id: id ?? '',
      familia: familia ?? '',
      genero: genero ?? '',
      especie: especie ?? '',
    }));
}

/**
 * Agrega una planta nueva al final de una pestaña.
 * Genera un UUID para el id y guarda solo id, familia, genero y especie.
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
  const spreadsheetId = getSheetId();
  const sheetInfo = await resolveSheetInfo(sheets, spreadsheetId, tab);

  // Asegura encabezados si la hoja está totalmente vacía
  const headerRange = escapeSheetRange(sheetInfo.title, 'A1:D1');
  try {
    const headerRes = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: headerRange,
    });
    if (
      !headerRes.data.values ||
      headerRes.data.values.length === 0 ||
      !headerRes.data.values[0] ||
      headerRes.data.values[0].length === 0
    ) {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: headerRange,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [['id', 'Familia', 'Genero', 'Especie']],
        },
      });
    }
  } catch {
    // Si falla la verificación de encabezados, continúa con el append
  }

  const id = crypto.randomUUID();

  const safeFamilia = sanitizeCell(data.familia);
  const safeGenero = sanitizeCell(data.genero);
  const safeEspecie = sanitizeCell(data.especie);

  const appendRange = escapeSheetRange(sheetInfo.title, 'A:D');
  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: appendRange,
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    requestBody: {
      values: [[id, safeFamilia, safeGenero, safeEspecie]],
    },
  });

  revalidatePath('/');
}

/**
 * Actualiza una planta existente buscando su fila por ID.
 */
export async function updatePlant(
  tab: TabName,
  plantId: string,
  data: { familia: string; genero: string; especie: string }
) {
  if (!TABS[tab] || !plantId || typeof plantId !== 'string') {
    return;
  }

  const familia = sanitizeCell(data.familia);
  if (!familia) {
    throw new Error('La familia es obligatoria.');
  }

  const rateLimit = checkRateLimit('updatePlant', 20, 60000);
  if (!rateLimit.success) {
    throw new Error('Limite de solicitudes excedido: espera un momento antes de editar nuevamente.');
  }

  const sheets = getSheetsClient();
  const spreadsheetId = getSheetId();
  const sheetInfo = await resolveSheetInfo(sheets, spreadsheetId, tab);
  const idsRange = escapeSheetRange(sheetInfo.title, 'A2:A');
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: idsRange,
  });

  const ids = res.data.values ?? [];
  const rowIndex = ids.findIndex((row) => row && row[0] === plantId);
  if (rowIndex === -1) {
    throw new Error('No se encontro la planta. Actualiza la pagina e intenta de nuevo.');
  }

  const sheetRow = rowIndex + 2;
  const range = escapeSheetRange(sheetInfo.title, `B${sheetRow}:D${sheetRow}`);
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[familia, sanitizeCell(data.genero), sanitizeCell(data.especie)]],
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
  const spreadsheetId = getSheetId();
  const sheetInfo = await resolveSheetInfo(sheets, spreadsheetId, tab);

  // Obtenemos todos los IDs para encontrar el índice de fila
  const range = escapeSheetRange(sheetInfo.title, 'A2:A');
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range,
  });

  const ids = res.data.values ?? [];
  const rowIndex = ids.findIndex((row) => row && row[0] === plantId);

  if (rowIndex === -1) return; // No encontrada

  const sheetId = sheetInfo.sheetId;
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

