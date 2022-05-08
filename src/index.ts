import express, { Application } from 'express';
import { errorMiddleware } from './shared/middlewares/errorMiddleware';

import { findCharacterRouter } from './routes/FindCharacterRouter';
import { listCharacterRouter } from './routes/ListCharacterRouter';
import { performBattleRouter } from './routes/PerformBattleRouter';
import { performRoundRouter } from './routes/PerformRoundRouter';
import { createCharacterRouter } from './routes/CreateCharacterRouter';

const app: Application = express();

// TODO: include helmet
app.use(express.json());
app.use(errorMiddleware);

app.use('/', performBattleRouter);
app.use('/', performRoundRouter);
app.use('/', findCharacterRouter);
app.use('/', listCharacterRouter);
app.use('/', createCharacterRouter);

export default app;
