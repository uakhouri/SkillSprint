import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';

export const app = express();

app.use(helmet());
app.use(cors({origin:true, credentials:true}));
app.use(morgan('dev'));
app.use(express.json());

app.get('/health', (_req, res)=>res.json({ok:true}))