import { Router } from 'express';
import userRoute from './user.routes';
import { cardRoute } from './card.routes';
import { cardExpensesRoute } from './card-expenses.routes';
import { extractRoute } from './extract.routes';
import { expensessRoute } from './expensess.routes';
import { revenuesRoute } from './revenues.routes';
import { categoriesRoute } from './categories.routes';
import { pluggyRoute } from './pluggy.routes';
import { imovelRoute } from './imovel.routes';
import { indiceRoute } from './indice.routes';

const api = Router();

api.use('/api/revenues', revenuesRoute);
api.use('/api/user', userRoute);
api.use('/api/card', cardRoute);
api.use('/api/card-expenses', cardExpensesRoute);
api.use('/api/expensses', expensessRoute);
api.use('/api/extract', extractRoute);
api.use('/api/categories', categoriesRoute);
api.use('/api/pluggy', pluggyRoute);
api.use('/api/imoveis', imovelRoute);
api.use('/api/indices', indiceRoute);

export default Router().use('', api);