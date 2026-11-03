import { Container } from 'inversify';
import { UserRepository } from '../../infra/api/repositories/users/user-repository';
import { UserRepositoryInterface } from '../@shared/users/repository/user-repository.interface';
import UserUseCaseInterface from '../@shared/users/usecases/user.usecase.interface';
import { UserUseCase } from '../usecases/users/user.usecase';
import CardUseCaseInterface from '../@shared/card/usecases/card.usecase.interface';
import { CardUseCase } from '../usecases/card/card.usecase';
import { CardRepositoryInterface } from '../@shared/card/repository/card-repository.interface';
import { CardRepository } from '../../infra/api/repositories/card/card-repository';
import { CardExpensesRepositoryInterface } from '../@shared/card-expenses/repository/card-expenses-repository.interface';
import { CardExpensesRepository } from '../../infra/api/repositories/card-expenses/card-expenses-repository';
import CardExpensesUseCaseInterface from '../@shared/card-expenses/usecase/card-expenses.usecase.interface';
import { CardExpensesUseCase } from '../usecases/card-expenses/card-expenses.usecase';
import { CompleteExtractUseCase } from '../usecases/extract/complete-extract.usecase';
import { ExpensessRepositoryInterface } from '../@shared/expensses/repositories/expensess.repository.interface';
import { CompleteExtractUseCaseInterface } from '../@shared/extract/usecase/complete-extract.usecase.interface';
import { ExpensessRepository } from '../../infra/api/repositories/expensess/expensess.repository';
import ExpensessUseCaseInterface from '../@shared/expensses/usecases/expensess.usecase.interface';
import ExpensessUseCase from '../usecases/expensess/expensess.usecase';
import { RevenuesRepositoryInterface } from '../@shared/revenues/repositories/revenues.repository.interface';
import { RevenuesRepository } from '../../infra/api/repositories/revenues/revenues-repository';
import RevenuesUseCase from '../usecases/revenues/revenues-usecase';
import { CategoriesRepositoryInterface } from '../@shared/categories/repository/categories-repository.interface';
import CategoriesUseCaseInterface from '../@shared/categories/usecases/categories.usecase.interface';
import { CategoriesUseCase } from '../usecases/categories/categories.usecase';
import { CategoriesRepository } from '../../infra/api/repositories/categories/categories-repository';
import { DailyReportService } from '../services/daily-report/daily-report';
import { ImovelRepositoryInterface } from '../@shared/imovel/repository/imovel.repository.interface';
import ImovelUseCaseInterface from '../@shared/imovel/usecases/imovel.usecase.interface';
import { ImovelRepository } from '../../infra/api/repositories/imovel/imovel.repository';
import { ImovelUseCase } from '../usecases/imovel/imovel.usecase';
import { IndiceRepositoryInterface } from '../@shared/indice/repository/indice.repository.interface';
import { IndiceUseCaseInterface } from '../@shared/indice/usecases/indice.usecase.interface';
import { IndiceRepository } from '../../infra/api/repositories/indice/indice.repository';
import { IndiceUseCase } from '../usecases/indice/indice.usecase';
import { PluggyClientInterface } from '../@shared/pluggy/client/pluggy-client.interface';
import { PluggyClient } from '../../infra/api/pluggy/pluggy-client';
import { PluggyConnectionRepositoryInterface } from '../@shared/pluggy/repository/pluggy-connection-repository.interface';
import { PluggyConnectionRepository } from '../../infra/api/repositories/pluggy/pluggy-connection-repository';
import { PluggySyncUseCaseInterface, PluggyConnectionUseCaseInterface } from '../@shared/pluggy/usecase/pluggy.usecase.interface';
import { PluggySyncUseCase } from '../usecases/pluggy/pluggy-sync.usecase';
import { PluggyConnectionUseCase } from '../usecases/pluggy/pluggy-connection.usecase';

const container = new Container();

container.bind<UserRepositoryInterface>('UserRepository').to(UserRepository).inSingletonScope();
container.bind<UserUseCaseInterface>('UserUseCase').to(UserUseCase).inSingletonScope();

container.bind<CardRepositoryInterface>('CardRepository').to(CardRepository).inSingletonScope();
container.bind<CardUseCaseInterface>('CardUseCase').to(CardUseCase).inSingletonScope();

container.bind<CompleteExtractUseCaseInterface>('CompleteExtractUseCase').to(CompleteExtractUseCase).inSingletonScope();

container.bind<CardExpensesRepositoryInterface>('CardExpensesRepository').to(CardExpensesRepository).inSingletonScope();
container.bind<CardExpensesUseCaseInterface>('CardExpensesUseCase').to(CardExpensesUseCase).inSingletonScope();

container.bind<ExpensessRepositoryInterface>('ExpensessRepository').to(ExpensessRepository).inSingletonScope();
container.bind<ExpensessUseCaseInterface>('ExpensessUseCase').to(ExpensessUseCase).inSingletonScope();

container.bind<RevenuesRepositoryInterface>('RevenuesRepository').to(RevenuesRepository).inSingletonScope();
container.bind<RevenuesUseCase>('RevenuesUseCase').to(RevenuesUseCase).inSingletonScope();

container.bind<CategoriesRepositoryInterface>('CategoriesRepository').to(CategoriesRepository).inSingletonScope();
container.bind<CategoriesUseCaseInterface>('CategoriesUseCase').to(CategoriesUseCase).inSingletonScope();

container.bind('DailyReportService').to(DailyReportService).inSingletonScope();



container.bind<IndiceRepositoryInterface>('IndiceRepository').to(IndiceRepository).inSingletonScope();
container.bind<IndiceUseCaseInterface>('IndiceUseCase').to(IndiceUseCase).inSingletonScope();
container.bind<ImovelRepositoryInterface>('ImovelRepository').to(ImovelRepository).inSingletonScope();
container.bind<ImovelUseCaseInterface>('ImovelUseCase').to(ImovelUseCase).inSingletonScope();

container.bind<PluggyClientInterface>('PluggyClient').to(PluggyClient).inSingletonScope();
container.bind<PluggyConnectionRepositoryInterface>('PluggyConnectionRepository').to(PluggyConnectionRepository).inSingletonScope();
container.bind<PluggySyncUseCaseInterface>('PluggySyncUseCase').to(PluggySyncUseCase).inSingletonScope();
container.bind<PluggyConnectionUseCaseInterface>('PluggyConnectionUseCase').to(PluggyConnectionUseCase).inSingletonScope();

export { container };