const baseUrl = 'http://localhost:5000';

async function runTests() {
    console.log('--- Starting Custom Topic Integration Tests ---');

    // 1. Test /api/exam/generate with a completely custom new topic: "Linear Algebra"
    try {
        const genRes = await fetch(`${baseUrl}/api/exam/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ subject: 'Mathematics', topic: 'Linear Algebra', count: 3 })
        });
        const genData = await genRes.json();
        console.log('POST /api/exam/generate (Linear Algebra) response:', JSON.stringify(genData, null, 2));
        if (genData.questions && genData.questions.length === 3) {
            console.log('✅ Custom topic question generation successful!');
        } else {
            console.error('❌ Custom topic question generation failed.');
        }
    } catch (err) {
        console.error('❌ Custom topic generation failed hard:', err);
    }
}

runTests();
