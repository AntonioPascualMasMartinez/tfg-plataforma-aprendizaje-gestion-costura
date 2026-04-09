/**
 * @file main.server.ts
 * @description Punto de entrada principal para el Server-Side Rendering (SSR).
 * Proporciona el contexto y la configuración necesarios para renderizar
 * la aplicación Angular en el entorno de Node.js antes de enviarla al cliente.
 */

import { BootstrapContext, bootstrapApplication } from '@angular/platform-browser';
import { App } from './app/app';
import { config } from './app/app.config.server';

const bootstrap = (context: BootstrapContext) => bootstrapApplication(App, config, context);

export default bootstrap;
