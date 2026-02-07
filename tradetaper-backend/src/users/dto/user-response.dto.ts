// src/users/dto/user-response.dto.ts
export class UserResponseDto {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  createdAt: Date;
  updatedAt: Date;
  subscription?: any; // We'll type this properly if needed, but 'any' is safe for DTO flexibility for now
}
