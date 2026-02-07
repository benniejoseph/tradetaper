import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { RegisterUserDto } from '../auth/dto/register-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
interface CreateGoogleUserDto {
    email: string;
    firstName: string;
    lastName: string;
    referralCode?: string;
}
export declare class UsersService {
    private usersRepository;
    constructor(usersRepository: Repository<User>);
    create(registerUserDto: RegisterUserDto): Promise<UserResponseDto>;
    createGoogleUser(googleUserDto: CreateGoogleUserDto): Promise<User>;
    findOneByEmail(email: string): Promise<User | undefined>;
    findOneById(id: string): Promise<UserResponseDto | undefined>;
    updateLastLogin(userId: string): Promise<void>;
}
export {};
