import { UserDto } from "../../../../domain/users/dto/user.dto";

export interface UserRepositoryInterface {
    create(user: UserDto): Promise<void>
    findByEmail(email: string): Promise<UserDto | undefined>
    findAll(): Promise<UserDto[]>
}