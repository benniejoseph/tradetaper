// src/users/dto/user-response.dto.ts
export interface UserSubscriptionSnapshot {
  plan: string;
  status: string;
  planDetails?: unknown;
  [key: string]: unknown;
}

export class UserResponseDto {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  createdAt: Date;
  updatedAt: Date;
  subscription?: UserSubscriptionSnapshot;
}
