
export type Purpose = 'Reading Books' | 'Research in Thesis' | 'Use of Computer' | 'Doing Assignments';

export type UserRole = 'visitor' | 'admin';

export interface UserProfile {
  id: string;
  schoolId: string;
  email: string;
  name: string;
  college: string;
  office?: string;
  role: UserRole;
  isBlocked: boolean;
}

export interface VisitRecord {
  id: string;
  userId: string;
  userName: string;
  college: string;
  purpose: Purpose;
  timestamp: string;
}

export const VISIT_PURPOSES: Purpose[] = [
  'Reading Books',
  'Research in Thesis',
  'Use of Computer',
  'Doing Assignments'
];
