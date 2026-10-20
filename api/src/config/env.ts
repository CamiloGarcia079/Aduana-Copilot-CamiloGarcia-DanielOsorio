import path from 'path';
import dotenv from 'dotenv';

// El .env vive en la raiz del repo, una carpeta arriba de /api.
dotenv.config({ path: path.resolve(__dirname, '..', '..', '..', '.env') });

export const env = {
  port: Number(process.env.PORT ?? 3000),

  /** Motor de calculo en Python. Es quien hace las cuentas. */
  coreUrl: process.env.CORE_URL ?? 'http://127.0.0.1:5000',

  /** Cuanto se espera al motor antes de darlo por caido. */
  coreTimeoutMs: Number(process.env.CORE_TIMEOUT_MS ?? 15_000),
};
