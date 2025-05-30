// src/types/user.ts
export interface UserResponseDto {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  createdAt: Date; // Consider storing as string if serializing/deserializing dates is an issue
  updatedAt: Date; // Same as above
}