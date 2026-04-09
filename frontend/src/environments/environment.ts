/**
 * @file environment.ts
 * @description Configuración de variables de entorno para el despliegue en producción.
 * Establece los parámetros definitivos para el entorno real, incluyendo la URL del backend alojado de forma remota.
 */
export const environment = {
  production: true,
  apiUrl: 'https://tfg-plataforma-aprendizaje-gestion.vercel.app/api/v1',
};
