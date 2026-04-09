/**
 * @file main.ts
 * @description Punto de entrada principal de la aplicación cliente. 
 * Se encarga de inicializar (bootstrap) el componente raíz de Angular utilizando 
 * la configuración definida para el entorno del navegador.
 */

import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

bootstrapApplication(App, appConfig)
  .catch((err) => console.error('Error durante la inicialización de la aplicación:', err));