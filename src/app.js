import express from 'express';
import cors from 'cors';
import routes from './routes/index.js';
import { errorHandler } from './middlewares/errorHandler.js';

const app = express();

app.use(cors());
app.use(express.json());

// Mount central API routes
app.use('/', routes);

// Centralized Error Handling Middleware
app.use(errorHandler);

export default app;
