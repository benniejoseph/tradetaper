import { AccountsService } from './accounts.service';
import { CreateAccountDto, UpdateAccountDto, AccountResponseDto } from './dto/account.dto';
export declare class AccountsController {
    private readonly accountsService;
    constructor(accountsService: AccountsService);
    create(req: any, createAccountDto: CreateAccountDto): Promise<AccountResponseDto>;
    findAll(req: any): Promise<AccountResponseDto[]>;
    findOne(req: any, id: string): Promise<AccountResponseDto>;
    update(req: any, id: string, updateAccountDto: UpdateAccountDto): Promise<AccountResponseDto>;
    remove(req: any, id: string): Promise<void>;
}
