export interface UserDto {
    id: string
    name: string;
    email: string;
    token?: string;
    password?: string;
    createdAt?: Date;
}