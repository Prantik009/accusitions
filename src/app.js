import express from 'express';
import logger from '#config/logger.js';

//middlwares
import helmet from 'helmet';
import morgan from 'morgan';
import cors from 'cors';
import cookieParser from 'cookie-parser';

//routes
import authRoutes from './routes/auth.routes.js';
import { securityMiddleware } from '#middleware/security.middleware.js';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true}));
app.use(morgan('combined', {stream: {write: (msg) => logger.info(msg.trim()) }}));
app.use(cookieParser());
app.use(securityMiddleware)



app.get('/', (req, res) => {

  logger.info('hellow from accusitions!');
  res.status(200).send('Hello from accusitions');
});

app.get('/health', (req, res)=> {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString(), uptime: process.uptime() });
});

app.get('/api', (req, res)=>{
  res.status(200).json({ message: 'Accusition API is running!'});
});

app.use('/api/auth', authRoutes);

export default app;
