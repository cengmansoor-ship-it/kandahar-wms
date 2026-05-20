"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkDbConnection = void 0;
const promise_1 = __importDefault(require("mysql2/promise"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const pool = promise_1.default.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'kandahar_wms_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});
const checkDbConnection = async () => {
    try {
        const connection = await pool.getConnection();
        console.log('Successfully connected to the MySQL Database.');
        connection.release();
    }
    catch (err) {
        console.error('Failed to connect to the MySQL Database:', err);
    }
};
exports.checkDbConnection = checkDbConnection;
exports.default = pool;
//# sourceMappingURL=db.js.map