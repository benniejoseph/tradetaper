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
        currentPeriodStart?: string | Date | null;
        currentPeriodEnd?: string | Date | null;
        cancelAtPeriodEnd?: boolean;
        planDetails?: PlanDetails;
    };
}
