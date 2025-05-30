// src/users/dto/user-response.dto.ts
export class UserResponseDto {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  createdAt: Date;
  updatedAt: Date;
  // Add other fields you want to expose, e.g., subscription status later
}