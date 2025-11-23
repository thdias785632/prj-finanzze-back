import { inject, injectable } from "inversify";
import UserUseCaseInterface, { inputCreateUser, inputLogin } from "../../@shared/users/usecases/user.usecase.interface";
import { UserRepositoryInterface } from "../../@shared/users/repository/user-repository.interface";
import { UserDto } from "../../../domain/users/dto/user.dto";
import { randomUUID } from "crypto";
import bcrypt from 'bcrypt';

@injectable()
export class UserUseCase implements UserUseCaseInterface {
    constructor(
        @inject('UserRepository')
        private userRepository: UserRepositoryInterface
    ) {}
    
    async create(input: inputCreateUser): Promise<void> {
        const hashedPassword = await bcrypt.hash(input.password, 10);

        const user: UserDto = {
            id: randomUUID(),
            name: input.name.toUpperCase(),
            email: input.email,
            password: hashedPassword,
            createdAt: new Date()
        };

        const userExists = await this.userRepository.findByEmail(user.email);

        if(userExists){
            throw new Error('User already exists');
        };

        await this.userRepository.create(user);
    };

    async login(input: inputLogin): Promise<UserDto | Error> {
        const user = await this.userRepository.findByEmail(input.email);

        if(!user){
            throw new Error('User or password incorrect');
        }

        const passwordMatch = await bcrypt.compare(input.password, user.password!);

        if(!passwordMatch){
            throw new Error('User or password incorrect');
        }

        const userResponse = {
            id: user.id,
            name: user.name,
            email: user.email,
        }

        return userResponse;
    };
}