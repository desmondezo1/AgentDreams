"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const index_1 = __importDefault(require("./index"));
async function migrate() {
    const client = await index_1.default.connect();
    try {
        const schemaPath = path_1.default.join(__dirname, 'schema.sql');
        const schemaSql = fs_1.default.readFileSync(schemaPath, 'utf8');
        console.log('Running migration...');
        await client.query('BEGIN');
        await client.query(schemaSql);
        await client.query('COMMIT');
        console.log('Migration completed successfully.');
    }
    catch (error) {
        await client.query('ROLLBACK');
        console.error('Migration failed:', error);
        process.exit(1);
    }
    finally {
        client.release();
        await index_1.default.end();
    }
}
migrate();
