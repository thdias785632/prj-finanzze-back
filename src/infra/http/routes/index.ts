import { Router } from 'express';
import userRoute from './user.routes';
import { cardRoute } from './card.routes';
import { cardExpensesRoute } from './card-expenses.routes';
import { extractRoute } from './extract.routes';
import { expensessRoute } from './expensess.routes';
import { revenuesRoute } from './revenues.routes';
import { categoriesRoute } from './categories.routes';
import { categoriaInvestimentoRoute } from './categoria-investimento.routes';
import { investimentoRoute } from './investimento.routes';
import { pluggyRoute } from './pluggy.routes';

const api = Router();

api.use('/api/revenues', revenuesRoute);
api.use('/api/user', userRoute);
api.use('/api/card', cardRoute);
api.use('/api/card-expenses', cardExpensesRoute);
api.use('/api/expensses', expensessRoute);
api.use('/api/extract', extractRoute);
api.use('/api/categories', categoriesRoute);
api.use('/api/categoria-investimento', categoriaInvestimentoRoute);
api.use('/api/investimento', investimentoRoute);
api.use('/api/pluggy', pluggyRoute);

export default Router().use('', api);