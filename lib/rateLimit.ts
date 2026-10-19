import { headers } from 'next/headers';

type RateLimitRecord = {
  count: number;
  resetTime: number;
};

// Almacenamiento en memoria para tracking de peticiones por IP
const rateLimitMap = new Map<string, RateLimitRecord>();

/**
 * Limpia registros expirados para evitar acumulacion de memoria
 */
function cleanupExpiredRecords(now: number) {
  if (rateLimitMap.size > 1000) {
    rateLimitMap.forEach((record, key) => {
      if (now > record.resetTime) {
        rateLimitMap.delete(key);
      }
    });
  }
}

/**
 * Obtiene la direccion IP del cliente desde los encabezados de la peticion
 */
export function getClientIp(): string {
  const headersList = headers();
  const forwarded = headersList.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIp = headersList.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }
  return '127.0.0.1';
}

/**
 * Verifica si la IP actual ha superado el limite de solicitudes permitidas
 * @param action Identificador de la accion (ej. 'addPlant', 'getPlants')
 * @param limit Cantidad maxima de solicitudes en la ventana
 * @param windowMs Duracion de la ventana en milisegundos (ej. 60000 para 1 minuto)
 */
export function checkRateLimit(
  action: string,
  limit: number,
  windowMs: number
): { success: boolean; remaining: number } {
  const ip = getClientIp();
  const now = Date.now();
  cleanupExpiredRecords(now);

  const key = `${action}:${ip}`;
  const record = rateLimitMap.get(key);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return { success: true, remaining: limit - 1 };
  }

  if (record.count >= limit) {
    return { success: false, remaining: 0 };
  }

  record.count += 1;
  return { success: true, remaining: limit - record.count };
}
