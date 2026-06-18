import express from 'express';
import tasksRouter from './routes/tasks';
import statsRouter from './routes/stats';
import { requestLogger } from './middleware/requestLogger';

const app = express();
app.use(express.json());
app.use(requestLogger);
app.use('/api/tasks', statsRouter);
app.use('/api/tasks', tasksRouter);

export default app;
