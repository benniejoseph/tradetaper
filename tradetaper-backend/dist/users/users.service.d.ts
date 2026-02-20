import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { RegisterUserDto } from '../auth/dto/register-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
interface CreateGoogleUserDto {
    email: string;
    firstName: string;
    lastName: string;
}
export declare class UsersService {
    private usersRepository;
    constructor(usersRepository: Repository<User>);
    create(registerUserDto: RegisterUserDto): Promise<UserResponseDto>;
    createGoogleUser(googleUserDto: CreateGoogleUserDto): Promise<User>;
    findOneByEmail(email: string): Promise<User | undefined>;
    findOneById(id: string): Promise<UserResponseDto | undefined>;
    updateUsername(userId: string, username: string): Promise<UserResponseDto>;
    isUsernameAvailable(username: string, excludeUserId?: string): Promise<boolean>;
    updateLastLogin(userId: string): Promise<void>;
    private normalizeUsername;
    private generateUniqueUsername;
}
export {};
