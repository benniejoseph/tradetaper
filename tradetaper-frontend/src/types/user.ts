import { PlanDetails } from './pricing';

export interface UserResponseDto {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    username?: string;
    role?: string;
    createdAt?: string;
    updatedAt?: string;
    subscription?: {
        plan: string;
        status: string;
        planDetails?: PlanDetails;
    };
}
