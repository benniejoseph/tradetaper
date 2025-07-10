import { Repository } from 'typeorm';
import { Account } from './entities/account.entity';
import { CreateAccountDto, UpdateAccountDto, AccountResponseDto } from './dto/account.dto';
import { UserResponseDto } from './dto/user-response.dto';
export declare class AccountsService {
    private readonly accountRepository;
    private readonly logger;
    constructor(accountRepository: Repository<Account>);
    create(createAccountDto: CreateAccountDto, user: UserResponseDto): Promise<AccountResponseDto>;
    findAllByUser(userId: string): Promise<AccountResponseDto[]>;
    findOne(id: string): Promise<Account | null>;
    update(id: string, updateAccountDto: UpdateAccountDto): Promise<AccountResponseDto>;
    remove(id: string): Promise<void>;
    mapToResponseDto(account: Account): AccountResponseDto;
}
