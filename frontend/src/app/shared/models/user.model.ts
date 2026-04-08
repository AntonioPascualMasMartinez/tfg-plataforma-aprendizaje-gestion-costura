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

export interface DashboardStats {
  counts: {
    totalUsers: number;
    totalTutorials: number;
    pendingReports: number;
  };
  charts: {
    userGrowth: { _id: { month: number; year: number }; count: number }[];
    demographics: { _id: string; count: number }[];
    engagement: { _id: string; count: number }[];
  };
}