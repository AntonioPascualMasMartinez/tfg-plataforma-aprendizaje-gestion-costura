# Needly - Aplicación Web (Frontend)

**Plataforma para Aprendizaje y Gestión de Proyectos de Costura**

![Angular](https://img.shields.io/badge/Angular-21-DD0031?style=flat-square\&logo=angular)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=flat-square\&logo=typescript)
![RxJS](https://img.shields.io/badge/RxJS-Reactive-B7178C?style=flat-square\&logo=reactivex)
![Sass](https://img.shields.io/badge/Tailwind-Styling-CC6699?style=flat-square\&logo=tailwindcss)

---

## Contexto y Descripción del Proyecto

Este repositorio contiene el código fuente correspondiente al cliente web (Frontend) desarrollado por **Antonio Pascual Mas Martínez** como parte de la implementación del Trabajo de Fin de Grado (TFG) en Ingeniería Multimedia por la Universidad de Alicante (UA).

La aplicación web, concebida como una *Single Page Application* (SPA), materializa la interfaz de usuario de la plataforma **Needly**. Proporciona una experiencia fluida e interactiva orientada a la comunidad de creadores textiles (DIY), permitiendo la gestión integral de proyectos, el seguimiento de tutoriales interactivos y la interacción social (foros, valoraciones y moderación).

---

## Arquitectura y Stack Tecnológico

El diseño del frontend adopta las últimas especificaciones del framework Angular, prescindiendo del paradigma tradicional de módulos (NgModules) en favor de una arquitectura basada en **Standalone Components**. Se aplican estrictamente patrones de diseño que aseguran la mantenibilidad, escalabilidad y un alto rendimiento en el navegador.

### Tecnologías Core y Patrones

* **Framework Principal**: Angular (v21)
* **Programación Reactiva**: Uso intensivo de **RxJS** para la gestión de flujos de datos asíncronos, implementación de operadores como `switchMap`, `debounceTime` y `distinctUntilChanged`.
* **Arquitectura de Componentes**: Separación entre *Smart Components* (lógicos) y *Dumb Components* (presentacionales), con flujo de datos unidireccional (@Input/@Output).
* **Gestión de Estado Ligero**: Uso de **Angular Signals** para control reactivo de la UI (ej. sistema de notificaciones tipo *Toast*).

### Interacción y Seguridad

* **Autenticación Híbrida**: Soporte para login tradicional y OAuth2 (Google).
* **Gestión de Sesión**:

  * Interceptores HTTP para inyección de JWT.
  * Uso de cookies `HttpOnly` para refresh tokens.
* **Optimización Multimedia**:

  * Subida directa a Cloudinary mediante firma criptográfica.
  * Reducción de carga en backend.

---

## Estructura de Directorios

```text
frontend/
├── angular.json
├── package.json
├── tsconfig.json
├── src/
│    ├── app/
│    │    ├── core/        # Servicios singleton, interceptores y guards
│    │    ├── shared/      # Componentes reutilizables, modelos
│    │    └── features/    # Vistas principales
│    ├── assets/           # Recursos estáticos
│    └── environments/     # Configuración por entorno
```

---

## Instalación y Despliegue Local

### 1. Requisitos Previos

* Node.js (v18 o superior)
* Angular CLI:

```bash
npm install -g @angular/cli
```

---

### 2. Clonar el repositorio

```bash
git clone <url-del-repositorio>
cd frontend
npm install
```

---

### 3. Configuración del entorno

Configura la URL del backend en:

```ts
src/environments/environment.development.ts
```

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api/v1'
};
```

---

### 4. Ejecución en desarrollo

```bash
ng serve
```

Aplicación disponible en:

```
http://localhost:4200
```

---

## Generación para Producción

```bash
ng build --configuration production
```

Los archivos generados estarán en:

```
dist/
```

Listos para desplegar en:

* Vercel

---

## Buenas Prácticas Aplicadas

* Arquitectura escalable basada en features
* Separación de responsabilidades (Smart vs Dumb)
* Programación reactiva (RxJS)
* Estado ligero con Signals
* Seguridad desacoplada (interceptores + backend)
* Código tipado (TypeScript)

---

## Licencia

Este proyecto se desarrolla con fines académicos (TFG).
