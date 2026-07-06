const http = require('http');
const https = require('https');
const fs = require('fs');

// Simple parser for .env file since this is a Vanilla Node.js project without dotenv
try {
    if (fs.existsSync('.env')) {
        const envConfig = fs.readFileSync('.env', 'utf-8').split('\n');
        envConfig.forEach(line => {
            const parts = line.split('=');
            if (parts.length >= 2) {
                const key = parts[0].trim();
                const value = parts.slice(1).join('=').trim().replace(/['"]/g, '');
                if (key && value) {
                    process.env[key] = value;
                }
            }
        });
    }
} catch (error) {
    console.warn("Could not read .env file. Ensure your environment variables are set manually.");
}

// Your Notion Internal Integration Token is now securely fetched from .env
const NOTION_TOKEN = process.env.NOTION_TOKEN;

// ⚠️ IMPORTANT: YOU MUST ADD YOUR DATABASE IDs HERE OR IN .ENV!
const RESOURCES_DATABASE_ID = process.env.RESOURCES_DATABASE_ID || 'YOUR_RESOURCES_DATABASE_ID_HERE';
const COLLEGES_DATABASE_ID = process.env.COLLEGES_DATABASE_ID || 'YOUR_COLLEGES_DATABASE_ID_HERE';

const PORT = 3000;

const server = http.createServer((req, res) => {
    // Add CORS headers so the frontend can fetch from this proxy
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    if (req.url === '/api/resources' && req.method === 'GET') {
        if (!RESOURCES_DATABASE_ID || RESOURCES_DATABASE_ID === 'YOUR_RESOURCES_DATABASE_ID_HERE') {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Please set your RESOURCES_DATABASE_ID in .env' }));
            return;
        }
        fetchFromNotion(RESOURCES_DATABASE_ID, res, formatResourceData);
    } 
    else if (req.url === '/api/colleges' && req.method === 'GET') {
        if (!COLLEGES_DATABASE_ID || COLLEGES_DATABASE_ID === 'YOUR_COLLEGES_DATABASE_ID_HERE') {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Please set your COLLEGES_DATABASE_ID in .env' }));
            return;
        }
        fetchFromNotion(COLLEGES_DATABASE_ID, res, formatCollegeData);
    } 
    else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Endpoint Not Found' }));
    }
});

// Helper function to fetch from Notion
function fetchFromNotion(dbId, res, formatterFunction) {
    const options = {
        hostname: 'api.notion.com',
        port: 443,
        path: `/v1/databases/${dbId}/query`,
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${NOTION_TOKEN}`,
            'Notion-Version': '2022-06-28',
            'Content-Type': 'application/json'
        }
    };

    const proxyReq = https.request(options, (proxyRes) => {
        let data = '';
        proxyRes.on('data', (chunk) => { data += chunk; });
        proxyRes.on('end', () => {
            if (proxyRes.statusCode !== 200) {
                console.error("Notion API Error:", data);
                res.writeHead(proxyRes.statusCode, { 'Content-Type': 'application/json' });
                res.end(data);
                return;
            }
            try {
                const notionData = JSON.parse(data);
                const formattedData = formatterFunction(notionData.results, dbId);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(formattedData));
            } catch (e) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Error parsing Notion response' }));
            }
        });
    });

    proxyReq.on('error', (e) => {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
    });
    proxyReq.write(JSON.stringify({}));
    proxyReq.end();
}

function formatResourceData(results, dbId) {
    return results.map(page => {
        const props = page.properties;
        return {
            id: page.id.substring(0, 8),
            dbId: dbId,
            name: props['Name (Title)']?.title?.[0]?.plain_text || props['Name']?.title?.[0]?.plain_text || 'Unnamed Resource',
            category: props['Category']?.select?.name || 'Unknown',
            subject: props['Subject']?.select?.name || 'Unknown',
            semester: props['Semester']?.select?.name || 'Unknown',
            fileLink: props['File Link']?.url || '#',
            addedDate: props['Added Date']?.date?.start || page.created_time
        };
    });
}

function formatCollegeData(results, dbId) {
    return results.map(page => {
        const props = page.properties;
        return {
            id: page.id, // Full ID needed for details page mapping
            dbId: dbId,
            name: props['Name']?.title?.[0]?.plain_text || 'Unnamed College',
            location: props['Location']?.rich_text?.[0]?.plain_text || 'Unknown',
            rating: props['Rating']?.number || 0,
            imageUrl: props['Image URL']?.url || 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=800',
            ranking: props['Ranking']?.number || 'N/A',
            students: props['Total Students']?.number || 0,
            faculty: props['Faculty Members']?.number || 0,
            phdFaculty: props['PhD Faculty %']?.number || 0,
            ugFees: props['UG Fees']?.rich_text?.[0]?.plain_text || props['UG Fees']?.number || 'N/A',
            pgFees: props['PG Fees']?.rich_text?.[0]?.plain_text || props['PG Fees']?.number || 'N/A',
            placementRate: props['Placement Rate']?.number || 0,
            courses: props['Courses']?.multi_select?.map(c => c.name) || []
        };
    });
}

server.listen(PORT, () => {
    console.log(`\n========================================`);
    console.log(`✅ Notion Proxy Server running on port ${PORT}`);
    console.log(`📡 URL 1: http://localhost:${PORT}/api/resources`);
    console.log(`📡 URL 2: http://localhost:${PORT}/api/colleges`);
    console.log(`========================================\n`);
    
    if (RESOURCES_DATABASE_ID === 'YOUR_RESOURCES_DATABASE_ID_HERE') {
        console.log(`⚠️ ACTION REQUIRED: Set RESOURCES_DATABASE_ID in .env`);
    }
    if (COLLEGES_DATABASE_ID === 'YOUR_COLLEGES_DATABASE_ID_HERE') {
        console.log(`⚠️ ACTION REQUIRED: Set COLLEGES_DATABASE_ID in .env`);
    }
});
