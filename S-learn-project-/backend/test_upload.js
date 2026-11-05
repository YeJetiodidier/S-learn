import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const baseUrl = 'http://localhost:5000';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function runUploadTest() {
    console.log('--- Starting Local Upload Route Tests ---');

    // Create a dummy file to upload
    const dummyFilePath = path.join(__dirname, 'dummy_test_paper.pdf');
    fs.writeFileSync(dummyFilePath, 'dummy PDF content %PDF-1.4');

    try {
        // We will construct a multipart/form-data upload using standard FormData (available in newer node editions)
        const fileContent = fs.readFileSync(dummyFilePath);
        const blob = new Blob([fileContent], { type: 'application/pdf' });
        
        const formData = new FormData();
        formData.append('file', blob, 'dummy_test_paper.pdf');

        const response = await fetch(`${baseUrl}/api/upload?type=paper&year=2023`, {
            method: 'POST',
            body: formData,
        });

        const data = await response.json();
        console.log('Upload Result Status:', response.status);
        console.log('Upload Result Data:', JSON.stringify(data, null, 2));

        if (response.ok && data.url) {
            console.log('✅ File upload successful!');
            console.log('Checking if download URL is accessible...');
            const getRes = await fetch(data.url);
            console.log('GET', data.url, 'status:', getRes.status);
            if (getRes.ok) {
                console.log('✅ File download verification successful!');
            } else {
                console.error('❌ File download verification failed.');
            }
        } else {
            console.error('❌ File upload failed.');
        }
    } catch (err) {
        console.error('❌ Upload test failed hard:', err);
    } finally {
        // Clean up dummy file
        if (fs.existsSync(dummyFilePath)) {
            fs.unlinkSync(dummyFilePath);
        }
    }
}

runUploadTest();
