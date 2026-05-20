import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { checkDbConnection } from './config/db';
import inventoryRoutes from './routes/inventory.routes';
import requestRoutes from './routes/request.routes';
import procurementRoutes from './routes/procurement.routes';
import receivingRoutes from './routes/receiving.routes';
import deliveryRoutes from './routes/delivery.routes';
import reportsRoutes from './routes/reports.routes';
import lookupRoutes from './routes/lookup.routes';
import emailRoutes from './routes/email.routes';
import traceabilityRoutes from './routes/traceability.routes';
import managementRoutes from './routes/management.routes';
import { TraceabilityService } from './services/traceability.service';
import { ManagementService } from './services/management.service';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ limit: '20mb', extended: true }));

checkDbConnection();
TraceabilityService.runMigrations().then(() => console.log('[WMS] Traceability migrations complete.')).catch(e => console.warn('[WMS] Traceability migrations warning:', e.message));
ManagementService.runMigrations().then(() => console.log('[WMS] Management migrations complete.')).catch(e => console.warn('[WMS] Management migrations warning:', e.message));

app.use('/api/inventory', inventoryRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/procurement', procurementRoutes);
app.use('/api/receiving', receivingRoutes);
app.use('/api/delivery', deliveryRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/lookup', lookupRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/traceability', traceabilityRoutes);
app.use('/api/management', managementRoutes);

app.get('/api/health', (req: Request, res: Response) => {
  res.json({ success: true, status: 'ok', service: 'Kandahar WMS Backend', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
