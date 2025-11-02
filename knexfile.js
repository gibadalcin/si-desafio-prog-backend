import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const development = {
    client: process.env.DATABASE_CLIENT || 'sqlite3',
    connection: process.env.DATABASE_CLIENT === 'sqlite3'
    ? { filename: process.env.DATABASE_FILENAME || path.join(__dirname, 'dev.sqlite3') }
    : process.env.DATABASE_URL,
    useNullAsDefault: true,
    migrations: {
        directory: path.join(__dirname, 'src', 'migrations')
    }
        ,
        seeds: {
            directory: path.join(__dirname, 'src', 'seeds')
        }
};

export default {
    development
};
