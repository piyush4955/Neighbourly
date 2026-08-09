import express from 'express';
import cors from 'cors';
import path from 'path';
import routes from './routes/index.js';
import { errorHandler } from './middlewares/errorHandler.js';

const app = express();

app.use(cors());
app.use(express.json());

// Serve uploaded image files statically at /uploads/<filename>
app.use('/uploads', express.static(path.join(process.cwd(), 'src', 'uploads')));

// Mount central API routes
app.use('/', routes);

// Centralized Error Handling Middleware
app.use(errorHandler);

export default app;
