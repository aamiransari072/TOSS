const express = require('express');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const PORT = 5000;

// Enable CORS for all routes
app.use(cors());

// Middleware for JSON
app.use(express.json());


// Use CORS middleware
app.use(cors({
    origin: 'http://localhost:3000', // Replace with your frontend's URL
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
}));


// Output directory for Lighthouse reports
const outputDir = path.join(__dirname, 'output');

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

// Serve the output directory
app.use('/output', express.static(outputDir));

// Endpoint to trigger Lighthouse
app.post('/generate-report', (req, res) => {
    const { url } = req.body;

    if (!url) {
        return res.status(400).json({ error: 'URL is required.' });
    }

    const reportName = url.replace(/https?:\/\//, '').replace(/[^\w]/g, '_') + '_report.json';
    const outputPath = path.join(outputDir, reportName);

    // Lighthouse command
    const lighthouseCmd = `"C:\\Users\\amirb\\AppData\\Roaming\\npm\\lighthouse.cmd" ${url} --output=json --output-path="${outputPath}" --chrome-flags="--headless --ignore-certificate-errors"`;

    exec(lighthouseCmd, (err, stdout, stderr) => {
        if (err) {
            console.error('Error generating Lighthouse report:', stderr);
            return res.status(500).json({ error: 'Failed to generate report.' });
        }

        console.log('Lighthouse report generated:', outputPath);
        res.json({ reportFile: reportName });
    });
});

app.get('/get-report/:fileName', (req, res) => {
    const { fileName } = req.params;
    console.log(fileName);
    const filePath = path.join(outputDir, fileName);

    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'Report not found.' });
    }

    fs.readFile(filePath, 'utf-8', (err, data) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to read report.' });
        }

        try {
            const json = JSON.parse(data);

            if (!json.categories) {
                return res.status(400).json({ error: 'Invalid report format. Categories missing.' });
            }

            // Extract overall categories score and key audits with suggestions
            const categories = json.categories;
            const categoryScores = Object.keys(categories).reduce((result, key) => {
                const category = categories[key];
                if (category && category.score !== undefined) {
                    result[key] = {
                        title: category.title || key,
                        score: category.score,
                        description: category.description || 'No description available.',
                    };
                }
                return result;
            }, {});

            // Extract all audits with suggestions
            const auditSuggestions = Object.keys(json.audits).reduce((result, key) => {
                const audit = json.audits[key];
                if (audit && audit.details && audit.details.type === 'opportunity') {
                    result[key] = {
                        title: audit.title,
                        description: audit.description || 'No description available.',
                        displayValue: audit.displayValue || 'No display value available.',
                        details: audit.details
                    };
                }
                return result;
            }, {});

            // Extract specific key metrics from audits
            const importantKeys = [
                'first-contentful-paint',
                'largest-contentful-paint',
                'speed-index',
                'total-blocking-time',
                'interactive',
                'cumulative-layout-shift',
                "server-response-time",
                "bootup-time",
                "mainthread-work-breakdown",
                "diagnostics",
                "resource-summary",
                "long-tasks",
                "color-contrast",
                "aria-allowed-attr",
                "aria-valid-attr",
                "button-name",
                "document-title",
                "html-has-lang",
                "html-lang-valid",
                "image-alt",
                "label",
                "link-name",
                "meta-viewport",
                "valid-lang",
                "video-caption",
                "is-on-https",
                "redirects-http",
                "errors-in-console",
                "valid-source-maps",
                "modern-image-formats",
                "uses-http2",
                "uses-passive-event-listeners",
                "no-document-write",
                "meta-description",
                "http-status-code",
                "font-size",
                "link-text",
                "crawlable-anchors",
                "is-crawlable",
                "robots-txt",
                "hreflang",
                "canonical",
                "structured-data",
                "reduce-unused-javascript",
                "uses-optimized-images",
                "uses-responsive-images",
                "uses-text-compression",
                "render-blocking-resources",
                "unused-css-rules",
                "unused-javascript",
                "efficient-animated-content"
            ];

            const keyMetrics = importantKeys.reduce((result, key) => {
                if (json.audits[key]) {
                    const audit = json.audits[key];
                    result[key] = {
                        title: audit.title,
                        score: audit.score,
                        displayValue: audit.displayValue,
                        description: audit.description
                    };
                }
                return result;
            }, {});

            res.json({
                categoryScores,
                auditSuggestions,
                keyMetrics
            });
        } catch (parseError) {
            console.error('Error parsing JSON:', parseError);
            return res.status(500).json({ error: 'Failed to parse report.' });
        }
    });
});





// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});



