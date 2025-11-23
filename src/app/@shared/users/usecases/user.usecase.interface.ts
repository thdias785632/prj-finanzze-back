import { UserDto } from "../../../../domain/users/dto/user.dto";

export default interface UserUseCaseInterface {
    create(input: inputCreateUser): Promise<void>
    login(input: inputLogin): Promise<UserDto | Error>
}

export interface inputCreateUser { 
    name: string;
    email: string;
    password: string;
}

export interface inputLogin { 
    email: string;
    password: string;
}