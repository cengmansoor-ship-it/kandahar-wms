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
import emailConfigRoutes from './routes/emailConfig.routes';
import traceabilityRoutes from './routes/traceability.routes';
import managementRoutes from './routes/management.routes';
import customRolesRoutes from './routes/customRoles.routes';
import budgetRoutes from './routes/budget.routes';
import trashRoutes from './routes/trash.routes';
import smsRoutes from './routes/sms.routes';
import { BudgetService } from './services/budget.service';
import { TraceabilityService } from './services/traceability.service';
import { ManagementService } from './services/management.service';
import { EmailConfigService } from './services/emailConfig.service';
import { CustomRolesService } from './services/customRoles.service';
import { InventoryService } from './services/inventory.service';
import { RequestService } from './services/request.service';
import { TrashService } from './services/trash.service';
import { SmsService } from './services/sms.service';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ limit: '20mb', extended: true }));

checkDbConnection();
InventoryService.runBarcodeMigrations().catch(e => console.warn('[WMS] Barcode migrations warning:', e.message));
TraceabilityService.runMigrations().then(() => console.log('[WMS] Traceability migrations complete.')).catch(e => console.warn('[WMS] Traceability migrations warning:', e.message));
ManagementService.runMigrations().then(() => console.log('[WMS] Management migrations complete.')).catch(e => console.warn('[WMS] Management migrations warning:', e.message));
EmailConfigService.runMigrations().then(() => console.log('[WMS] Email config migrations complete.')).catch(e => console.warn('[WMS] Email config migrations warning:', e.message));
CustomRolesService.runMigrations().then(() => console.log('[WMS] Custom roles migrations complete.')).catch(e => console.warn('[WMS] Custom roles migrations warning:', e.message));
BudgetService.runMigrations().then(() => console.log('[WMS] Budget migrations complete.')).catch(e => console.warn('[WMS] Budget migrations warning:', e.message));
BudgetService.runCeilingMigration().then(() => console.log('[WMS] Budget ceiling migration complete.')).catch(e => console.warn('[WMS] Budget ceiling migration warning:', e.message));
RequestService.runMigrations().then(() => console.log('[WMS] Request pipeline migrations complete.')).catch(e => console.warn('[WMS] Request pipeline migrations warning:', e.message));
TrashService.runMigrations().then(() => console.log('[WMS] Trash migrations complete.')).catch(e => console.warn('[WMS] Trash migrations warning:', e.message));
TrashService.purgeExpired(30).catch(e => console.warn('[WMS] Trash purge warning:', e.message));
SmsService.runMigrations().then(() => console.log('[WMS] SMS config migrations complete.')).catch(e => console.warn('[WMS] SMS config migrations warning:', e.message));

app.use('/api/inventory', inventoryRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/procurement', procurementRoutes);
app.use('/api/receiving', receivingRoutes);
app.use('/api/delivery', deliveryRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/lookup', lookupRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/email-config', emailConfigRoutes);
app.use('/api/traceability', traceabilityRoutes);
app.use('/api/management', managementRoutes);
app.use('/api/custom-roles', customRolesRoutes);
app.use('/api/budget', budgetRoutes);
app.use('/api/trash', trashRoutes);
app.use('/api/sms', smsRoutes);

app.get('/api/health', (req: Request, res: Response) => {
  res.json({ success: true, status: 'ok', service: 'Kandahar WMS Backend', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
