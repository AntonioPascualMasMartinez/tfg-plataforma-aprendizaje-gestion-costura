# 🧵 Plataforma para Aprendizaje y Gestión de Proyectos de Costura - API REST (Backend)

## 📌 Contexto y Descripción del Proyecto

Este repositorio contiene el código fuente correspondiente al Backend (API REST) desarrollado como parte de la implementación del Trabajo de Fin de Grado (TFG) en Ingeniería Multimedia por la Universidad de Alicante (UA).

La plataforma proporciona una solución tecnológica integral diseñada para solventar la fragmentación digital existente en el ecosistema del aprendizaje textil y el movimiento Do It Yourself (DIY). Ofrece una infraestructura robusta que unifica:

- **Planificación Documental**: Organización de proyectos textiles personales mediante un sistema estructurado de pasos secuenciales y control de materiales.
- **Rutas de Aprendizaje Guiado**: Asimilación de conocimientos a través de tutoriales interactivos con registro persistente de progreso.
- **Dimensión Social**: Participación en una comunidad colaborativa estructurada para el intercambio de resultados y la mentoría.

## 🏗 Arquitectura y Stack Tecnológico

El diseño del backend abandona las arquitecturas monolíticas horizontales en favor de un enfoque modular basado en el diseño orientado a dominios (Vertical Slicing), garantizando un bajo acoplamiento y alta mantenibilidad.

- **Motor de Ejecución**: Node.js (v18 LTS) apoyado en el framework Express.js.
- **Persistencia de Datos**: MongoDB (NoSQL Documental) gestionado mediante Mongoose ODM, operando sobre clústeres de MongoDB Atlas para asegurar disponibilidad y escalabilidad.
- **Sistema de Seguridad (Auth)**:
  - Tokens de Acceso (JWT) de corta vida integrados en cabeceras de autorización HTTP.
  - Tokens de Refresco (Refresh Tokens) transmitidos de forma segura vía cookies httpOnly.
  - Sanitización de entradas, prevención CSRF y Rate Limiting global para mitigar vectores de ataque.
- **Distribución Multimedia**: Externalización de la carga binaria pesada hacia Cloudinary, utilizando firmas criptográficas generadas desde el servidor para subidas directas del cliente.
- **Control de Calidad**:
  - Análisis estático de código mediante ESLint y Prettier.
  - Testing automatizado estructurado en capas (Unitarias e Integración) empleando Jest y Supertest.

## 📂 Estructura de Directorios (Domain Slicing)

```text
TFG-Costura-Backend/
├── .env.example     # Plantilla anonimizada de configuración de entorno
├── package.json     # Metadatos, manifiesto de dependencias y scripts
├── jest.config.js   # Configuraciones del framework de test automatizado
├── src/
│    ├── config/     # Inicializadores de bases de datos y servicios cloud
│    ├── middlewares/# Filtros de peticiones (Auth, RBAC, RateLimit, Errores)
│    ├── utils/      # Clases abstractas, formateadores y respuestas uniformes
│    ├── modules/    # Segmentación modular de lógica de negocio (Slices)
│    │    ├── auth/       # Gestión del ciclo de vida de tokens y sesiones
│    │    ├── users/      # Operaciones sobre perfiles y gestión administrativa
│    │    ├── projects/   # CRUD de recursos textiles, pasos de trabajo e incidencias
│    │    ├── tutorials/  # Flujos pedagógicos y trazabilidad de progreso formativo
│    │    ├── community/  # Lógica social, sistema de 'Likes' y moderación polimórfica
│    │    └── uploads/    # Generación de firmas de seguridad para Cloudinary
│    ├── app.js      # Declaración centralizada de Express y enrutamiento
│    └── server.js   # Punto de arranque de red y bootstrap de la base de datos
└── tests/
     ├── unit/       # Pruebas aisladas (con mocks) de la lógica de servicios
     └── integration/# Simulaciones HTTP E2E sobre los controladores de la API