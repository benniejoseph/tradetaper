export declare class CreateAccountDto {
    name: string;
    balance?: number;
    currency?: string;
    description?: string;
    target?: number;
    isActive?: boolean;
}
export declare class UpdateAccountDto {
    name?: string;
    balance?: number;
    currency?: string;
    description?: string;
    isActive?: boolean;
    target?: number;
}
export declare class AccountResponseDto {
    id: string;
    name: string;
    balance: number;
    currency: string;
    description: string;
    isActive: boolean;
    target: number;
    userId: string;
    createdAt: Date;
    updatedAt: Date;
}
