export declare class User {
    id: string;
    email: string;
    password?: string;
    firstName?: string;
    lastName?: string;
    lastLoginAt?: Date;
    createdAt: Date;
    updatedAt: Date;
    hashPassword(): Promise<void>;
    validatePassword(password: string): Promise<boolean>;
}
