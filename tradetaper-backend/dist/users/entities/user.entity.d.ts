import { PsychologicalInsight } from '../../notes/entities/psychological-insight.entity';
export declare class User {
    id: string;
    email: string;
    password?: string;
    firstName?: string;
    lastName?: string;
    username?: string;
    lastLoginAt?: Date;
    createdAt: Date;
    updatedAt: Date;
    psychologicalInsights: PsychologicalInsight[];
    hashPassword(): Promise<void>;
    validatePassword(password: string): Promise<boolean>;
}
