import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { checkDbConnection } from './config/db';
import inventoryRoutes from './routes/inventory.routes';
import requestRoutes from './routes/request.routes';
import procurementRoutes from './routes/procurement.routes';
import receivingRoutes from './routes/receiving.routes';
import deliveryRoutes from './routes/delivery.routes';

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Check DB Connection
checkDbConnection();

// Register Routes
app.use('/api/inventory', inventoryRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/procurement', procurementRoutes);
app.use('/api/receiving', receivingRoutes);
app.use('/api/delivery', deliveryRoutes);

// Simple API Route
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'Kandahar WMS Backend' });
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
