# Needly - API REST (Backend)

**Plataforma para Aprendizaje y Gestión de Proyectos de Costura**

![Node.js](https://img.shields.io/badge/Node.js-22.19-green?style=flat-square\&logo=node.js)
![Express.js](https://img.shields.io/badge/Express.js-5.2-lightgrey?style=flat-square\&logo=express)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat-square\&logo=mongodb)
![Jest](https://img.shields.io/badge/Testing-Jest-C21325?style=flat-square\&logo=jest)

## Contexto y Descripción del Proyecto

Este repositorio contiene el código fuente correspondiente al Backend (API REST) desarrollado por **Antonio Pascual Mas Martínez** como parte de la implementación del Trabajo de Fin de Grado (TFG) en Ingeniería Multimedia por la Universidad de Alicante (UA).

La plataforma proporciona una solución tecnológica integral diseñada para solventar la fragmentación digital existente en el ecosistema del aprendizaje textil y el movimiento *Do It Yourself* (DIY). Ofrece una infraestructura robusta que unifica:

* **Planificación Documental**: Organización de proyectos textiles personales mediante un sistema estructurado de pasos secuenciales y control de materiales.
* **Rutas de Aprendizaje Guiado**: Asimilación de conocimientos a través de tutoriales interactivos con registro persistente de progreso.
* **Dimensión Social**: Participación en una comunidad colaborativa estructurada para el intercambio de resultados y la mentoría.

---

## Arquitectura y Stack Tecnológico

El diseño del backend abandona las arquitecturas monolíticas horizontales en favor de un enfoque modular basado en el diseño orientado a dominios (**Vertical Slicing**), garantizando un bajo acoplamiento y alta mantenibilidad.

### Tecnologías Core

* **Motor de Ejecución**: Node.js (v18 LTS) apoyado en el framework Express.js.
* **Persistencia de Datos**: MongoDB (NoSQL Documental) gestionado mediante Mongoose ODM.
* **Distribución Multimedia**: Externalización de la carga binaria hacia Cloudinary mediante un patrón de subida directa firmada criptográficamente (Signed Direct Upload).

### Seguridad y Estabilidad

* **Autenticación y Sesiones**:

  * Access Tokens (JWT) de corta vida integrados en cabeceras HTTP.
  * Refresh Tokens transmitidos de forma segura vía cookies `httpOnly` y `sameSite`.
  * Integración con OAuth2 (Google Identity).
* **Autorización**: Middleware RBAC (Role-Based Access Control) para rutas administrativas.
* **Protección de Infraestructura**: Sanitización de entradas (Joi), protección de cabeceras (Helmet) y Rate Limiting global/estricto para mitigar vectores de ataque (Fuerza bruta, DoS).
* **Observabilidad**: Sistema centralizado de logging con Winston e interceptor global de excepciones que asegura un contrato de respuesta estandarizado.

---

## Estructura de Directorios

```text
backend/
├── .env.example
├── package.json
├── jest.config.js
├── src/
│    ├── config/
│    ├── middlewares/
│    ├── utils/
│    ├── modules/
│    │    ├── auth/
│    │    ├── users/
│    │    ├── projects/
│    │    ├── tutorials/
│    │    ├── community/
│    │    └── uploads/
│    ├── app.js
│    └── server.js
└── tests/
     ├── unit/
     └── integration/
```

---

## Instalación y Despliegue Local

### 1. Requisitos Previos

* Node.js (v18 o superior)
* MongoDB (Atlas o local)
* Cloudinary
* Google Cloud Console (OAuth)

### 2. Clonar el repositorio

```bash
git clone <url-del-repositorio>
cd backend
npm install
```

### 3. Configuración del entorno

```bash
cp .env.example .env
```

Rellena las variables con tus credenciales.

### 4. Ejecución

Modo desarrollo:

```bash
npm run dev
```

Modo producción:

```bash
npm start
```

Servidor disponible en:

```
http://localhost:3000
```

---

## Testing

* Ejecutar todo:

```bash
npm run test
```

* Unit tests:

```bash
npm run test:unit
```

* Integration tests:

```bash
npm run test:integration
```

* Coverage:

```bash
npm run test:coverage
```

---

## Documentación API

Swagger disponible en:

👉 http://localhost:3000/api-docs

**Uso:**

1. Haz login
2. Copia el `accessToken`
3. Pulsa "Authorize" en Swagger
4. Pega el token

---

## Licencia

Este proyecto se desarrolla con fines académicos (TFG).
