/**
 * @file server.ts
 * @description Servidor web basado en Express configurado para gestionar el 
 * Server-Side Rendering (SSR) de la aplicación Angular.
 */

import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { join } from 'node:path';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();

/**
 * Middleware para la entrega de archivos estáticos.
 * Se sirven los recursos compilados de la carpeta /browser.
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Interceptor principal de peticiones.
 * Todas las rutas no gestionadas por los recursos estáticos son delegadas 
 * al motor de Angular para su renderizado en el servidor.
 */
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});

/**
 * Inicialización del servidor.
 * Verifica si el módulo se ejecuta como proceso principal o a través de un gestor (ej. PM2).
 * El puerto por defecto es el 4000, sobreescribible mediante variables de entorno.
 */
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }
    console.log(`Servidor Node Express en ejecución: http://localhost:${port}`);
  });
}

/**
 * Exportación del manejador de peticiones para su uso interno por Angular CLI 
 * durante el desarrollo o compilación, así como en despliegues serverless.
 */
export const reqHandler = createNodeRequestHandler(app);