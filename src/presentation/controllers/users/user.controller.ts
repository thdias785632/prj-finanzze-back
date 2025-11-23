import { Request, Response } from 'express';
import UserControllerInterface from '../../../app/@shared/users/controller/user-controller.interface';
import UserUseCaseInterface from '../../../app/@shared/users/usecases/user.usecase.interface';

export default class UserController implements UserControllerInterface {
  constructor(
    private useCase: UserUseCaseInterface
  ) {}
  
  async create(req: Request, res: Response): Promise<Response | undefined> {
    try {
      await this.useCase.create(req.body);

      return res.status(201).json({ message: 'User created successfully' });
    } catch (error: any) {
      res.status(error.status ? error.status : 500).json({ message: error.message ? error.message : 'Internal Server Error' });
    }
  };

  async login(req: Request, res: Response): Promise<Response | undefined> {
    try {
      const user = await this.useCase.login(req.body);

      return res.status(201).json(user);
    } catch (error: any) {
      res.status(error.status ? error.status : 500).json({ message: error.message ? error.message : 'Internal Server Error' });
    }
  };
}