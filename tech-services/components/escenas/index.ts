import type { EscenaServicio } from '@/config/site';
import type { Escena } from './comun';
import { formateo } from './formateo';
import { limpieza } from './limpieza';
import { rescate } from './rescate';
import { armado } from './armado';
import { diagnostico } from './diagnostico';
import { bot } from './bot';
import { web } from './web';
import { n8n } from './n8n';
import { cableado } from './cableado';
import { camaras } from './camaras';
import { wifi } from './wifi';
import { app } from './app';
import { sistema } from './sistema';

export const ESCENAS: Record<EscenaServicio, Escena> = {
  formateo,
  limpieza,
  rescate,
  armado,
  diagnostico,
  bot,
  web,
  n8n,
  cableado,
  camaras,
  wifi,
  app,
  sistema,
};
