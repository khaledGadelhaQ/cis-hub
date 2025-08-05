import { Post } from '@prisma/client';

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface UserVisibilityContext {
  userId: string;
  role: string;
  departmentId: string | null;
  currentYear: number | null;
  canSeeAllDepartments: boolean; // Only true for admins
  canCreateForAnyDepartment: boolean; // True for professors and admins
}

export interface PostWithRelations extends Post {
  author: {
    id: string;
    firstName: string;
    lastName: string;
  };
  department?: {
    id: string;
    name: string;
    code: string;
  } | null;
  attachments: {
    id: string;
    originalName: string;
    filePath: string;
    fileSize: number;
    mimeType: string;
  }[];
}
