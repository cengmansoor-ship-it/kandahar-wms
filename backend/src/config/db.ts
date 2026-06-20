import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';

// Load backend/.env first, then fall back to root .env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'kandahar_wms_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export const checkDbConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('Successfully connected to the MySQL Database.');
    connection.release();
  } catch (err) {
    console.error('Failed to connect to the MySQL Database:', err);
  }
};

export default pool;
