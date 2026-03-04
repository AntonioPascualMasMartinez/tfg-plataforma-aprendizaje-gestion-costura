export type Role = 'User' | 'Admin';

// Creamos un tipo específico para restringir los valores permitidos del nivel de costura
export type SewingLevel = 'Principiante' | 'Intermedio' | 'Experto';

export interface User {
  _id: string; // Mongoose usa _id por defecto
  email: string;
  displayName: string;
  avatar: string | null;
  role: Role;

  // --- NUEVOS CAMPOS ---
  sewingLevel?: SewingLevel | null;
  interests?: string[];
  googleId?: string | null;
  // ---------------------

  createdAt: string;
  updatedAt: string;
}

export interface UpdateProfilePayload {
  displayName?: string;
  avatar?: string | null;

  // Añadimos los campos que el usuario tiene permitido modificar desde su perfil
  sewingLevel?: SewingLevel | null;
  interests?: string[];
}
