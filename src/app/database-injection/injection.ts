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
import { CategoriaInvestimentoRepositoryInterface } from '../@shared/categoria-investimento/repository/categoria-investimento.repository.interface';
import CategoriaInvestimentoUseCaseInterface from '../@shared/categoria-investimento/usecases/categoria-investimento.usecase.interface';
import { CategoriaInvestimentoUseCase } from '../usecases/categoria-investimento/categoria-investimento.usecase';
import { CategoriaInvestimentoRepository } from '../../infra/api/repositories/categoria-investimento/categoria-investimento.repository';
import { InvestimentoRepositoryInterface } from '../@shared/investimento/repository/investimento.repository.interface';
import InvestimentoUseCaseInterface from '../@shared/investimento/usecases/investimento.usecase.interface';
import { InvestimentoUseCase } from '../usecases/investimento/investimento.usecase';
import { InvestimentoRepository } from '../../infra/api/repositories/investimento/investimento.repository';

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

container.bind<CategoriaInvestimentoRepositoryInterface>('CategoriaInvestimentoRepository').to(CategoriaInvestimentoRepository).inSingletonScope();
container.bind<CategoriaInvestimentoUseCaseInterface>('CategoriaInvestimentoUseCase').to(CategoriaInvestimentoUseCase).inSingletonScope();

container.bind<InvestimentoRepositoryInterface>('InvestimentoRepository').to(InvestimentoRepository).inSingletonScope();
container.bind<InvestimentoUseCaseInterface>('InvestimentoUseCase').to(InvestimentoUseCase).inSingletonScope();

export { container };