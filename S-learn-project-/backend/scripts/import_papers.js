import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

const docsDir = path.resolve('..', 'documents');

async function importPapers() {
    // Load .env BEFORE anything else
    dotenv.config({ path: path.resolve('backend', '.env') });
    console.log(`🔑 Database URL loaded: ${!!process.env.DATABASE_URL}`);

    // Dynamic import to ensure pool is created AFTER dotenv.config
    const { pool } = await import('../src/config/db.js');

    console.log(`📂 Scanning directory: ${docsDir}`);
    const files = fs.readdirSync(docsDir).filter(f => f.endsWith('.pdf'));
    console.log(`📄 Found ${files.length} PDF files.`);

    for (const file of files) {
        let level = 'Other';
        if (file.includes('AL') || file.includes('Advanced')) level = 'Advanced Level';
        if (file.includes('OL') || file.includes('Ordinary')) level = 'Ordinary Level';

        let yearMatch = file.match(/\d{4}/);
        let year = yearMatch ? yearMatch[0] : 'Unknown';

        let subject = 'General';
        if (file.toUpperCase().includes('CHEMISTRY')) subject = 'Chemistry';
        if (file.toUpperCase().includes('PMATHS')) subject = 'Pure Mathematics';

        let paperName = 'Paper 1';
        if (file.includes('2') || file.includes('P2')) paperName = 'Paper 2';
        if (file.includes('Mock')) paperName = 'Mock Exam';

        const link = `file:///c:/Users/Anos%20Voaldigoad/Desktop/project/s-learn%202.1/documents/${encodeURIComponent(file)}`;

        try {
            await pool.query(`
                INSERT INTO papers (level, specialty, subject, paper_name, year, link)
                VALUES ($1, $2, $3, $4, $5, $6)
                ON CONFLICT DO NOTHING
            `, [level, '', subject, paperName, year, link]);
            console.log(`✅ Imported: ${file}`);
        } catch (err) {
            console.error(`❌ Failed to import ${file}:`, err.message);
        }
    }
    
    console.log('🏁 Import complete!');
    process.exit();
}

importPapers();
