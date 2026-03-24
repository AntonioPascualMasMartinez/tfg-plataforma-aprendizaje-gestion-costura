export type Role = 'User' | 'Admin';
export type SewingLevel = 'Principiante' | 'Intermedio' | 'Experto';

export interface User {
  _id: string;
  email: string;
  displayName: string;
  avatar: string | null;
  role: Role;

  // --- CAMPOS OPCIONALES ---
  sewingLevel?: SewingLevel | null;
  interests?: string[];
  googleId?: string | null;
  // -------------------------

  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

export interface UpdateProfilePayload {
  displayName?: string;
  avatar?: string | null;
  sewingLevel?: SewingLevel | null;
  interests?: string[];
}
