import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function updateLinks() {
    console.log('🔄 Updating database links...');
    
    // Dynamic import to ensure pool is initialized after dotenv.config()
    const { pool } = await import('../src/config/db.js');
    
    const oldPrefix = 'file:///c:/Users/Anos%20Voaldigoad/Desktop/project/s-learn%202.1/documents/';
    const newPrefix = 'http://localhost:5000/documents/';

    try {
        const result = await pool.query(
            "UPDATE papers SET link = REPLACE(link, $1, $2) WHERE link LIKE $3",
            [oldPrefix, newPrefix, `${oldPrefix}%`]
        );
        console.log(`✅ Successfully updated ${result.rowCount} links.`);
    } catch (err) {
        console.error('❌ Failed to update links:', err.message);
    }
    process.exit();
}

updateLinks();
