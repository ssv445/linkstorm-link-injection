import Fastify from 'fastify';
import cors from '@fastify/cors';
import { parse } from 'csv-parse';
import { createHash } from 'crypto';

const fastify = Fastify({
    logger: true,
});

await fastify.register(cors, {
    origin: "*",
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    maxAge: 60 * 60 * 24 * 30,
    cacheControl: 60 * 60 * 24 * 30,
});

fastify.get('/', async function handler(request, reply) {
    return { hello: 'world' };
});

fastify.get('/get_website_page_opportunities', async function (req, reply) {
    const rootSiteId = req.query.websiteId;
    const pageUrl = req.query.pageUrl;

    if (!rootSiteId || isNaN(rootSiteId)) {
        return { error: 'Invalid rootSiteId' };
    }

    if (!pageUrl || typeof pageUrl !== 'string') {
        return { error: 'Invalid pageUrl' };
    }

    try {
        const opportunities = await readOpportunitiesFromCSV(rootSiteId, pageUrl);
        return opportunities;
    } catch (error) {
        console.error("Error in /get_website_page_opportunities:", error);
        reply.status(500).send({ error: 'Internal server error' });
    }
});

const readOpportunitiesFromCSV = async (rootSiteId, pageUrl) => {
    const opportunities = [];
    return new Promise((resolve, reject) => {
        //  Replace with the actual URL of your CSV file.  This could be a raw URL from GitHub, or a URL from a dedicated file hosting service.
        const csvUrl = 'https://your-repo.com/opportunities.csv'; // <--- IMPORTANT:  Replace this URL
        fetch(csvUrl)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Failed to fetch CSV: ${response.status} ${response.statusText}`);
                }
                return response.text();
            })
            .then(csvText => {
                parse(csvText, {
                    headers: true,
                    skipEmptyLines: true,
                }, (err, records) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    let parsedCount = 0;
                    let matchedCount = 0;
                    records.forEach(row => {
                        parsedCount++;
                        if (parseInt(row['rootSiteId']) === parseInt(rootSiteId) && row['Source Page URL'] === pageUrl && row['Status'] === 'accepted') {
                            matchedCount++;
                            const processed = processOpportunity(row);
                            if (processed) {
                                opportunities.push(processed);
                            }
                        }
                    });
                    console.log(`Parsed ${parsedCount} rows, matched ${matchedCount} rows for rootSiteId: ${rootSiteId} and pageUrl: ${pageUrl}`);
                    resolve(opportunities);
                });
            })
            .catch(error => reject(error));
    });
};

const processOpportunity = (opportunity) => {
    const text = opportunity['Matching Text'];
    const start = text.indexOf('<em>');
    const end = text.indexOf('</em>');
    let anchor = (start !== -1 && end !== -1) ? text.substring(start + 4, end) : '';
    anchor = stripTags(anchor);
    let matchedSentence = prepareLimitedSnippet(text, 40 + anchor.length);
    matchedSentence = stripTags(matchedSentence);

    return {
        target: opportunity['Target Page URL'],
        accepted: opportunity['Status'],
        anchor: opportunity['Anchor'] ? opportunity['Anchor'] : anchor,
        matchedSentence: matchedSentence,
        status: opportunity['injectionStatus'] || '',
        type: opportunity['type'] || 'dynamic',
        id: opportunity['id'] || generateMD5Hash(opportunity['Source Page URL'] + opportunity['Target Page URL'] + opportunity['Anchor']),
    };
};

const stripTags = (input) => input.replace(/<\/?[^>]+(>|$)/g, "");

const prepareLimitedSnippet = (text, limit = 100) => {
    const emStart = text.toLowerCase().indexOf('<em>');
    const emEnd = text.toLowerCase().indexOf('</em>', emStart) + 5;

    if (emStart === -1 || emEnd === -1) {
        return text;
    }

    let sentenceStart = text.lastIndexOf('.', emStart);
    sentenceStart = sentenceStart === -1 ? 0 : sentenceStart + 1;
    let sentenceEnd = text.indexOf('.', emEnd);
    sentenceEnd = sentenceEnd === -1 ? text.length : sentenceEnd + 1;
    let sentence = text.substring(sentenceStart, sentenceEnd);

    let previousSentenceStart = text.lastIndexOf('.', sentenceStart - 2);
    previousSentenceStart = previousSentenceStart === -1 ? 0 : previousSentenceStart + 1;
    const previousSentence = text.substring(previousSentenceStart, sentenceStart);

    let nextSentenceEnd = text.indexOf('.', sentenceEnd);
    nextSentenceEnd = nextSentenceEnd === -1 ? text.length : nextSentenceEnd + 1;
    const nextSentence = text.substring(sentenceEnd, nextSentenceEnd);

    if ((previousSentence + sentence + nextSentence).length <= limit) {
        return (previousSentence + sentence + nextSentence).trim();
    }

    if ((previousSentence + sentence).length <= limit) {
        return (previousSentence + sentence).trim();
    }

    if ((sentence + nextSentence).length <= limit) {
        return (sentence + nextSentence).trim();
    }

    return sentence.trim();
};

function generateMD5Hash(data) {
    return createHash('md5').update(data).digest('hex');
}

// Start the server (this part is important for Cloudflare Pages)
export default {
    async fetch(request, env, ctx) {
        const server = fastify; // Use the fastify instance
        // Cloudflare Pages expects you to return a Response object
        try {
            const url = new URL(request.url);
            // Handle your routes here.  This is a basic example.  You'll need to expand it.
            if (url.pathname === '/') {
                const response = await server.inject({
                    method: 'GET',
                    url: '/',
                });
                return new Response(response.payload, {
                    status: response.statusCode,
                    headers: Object.fromEntries(response.headers)
                });
            } else if (url.pathname === '/get_website_page_opportunities') {
                const websiteId = url.searchParams.get('websiteId');
                const pageUrl = url.searchParams.get('pageUrl');

                const response = await server.inject({
                    method: 'GET',
                    url: `/get_website_page_opportunities?websiteId=${websiteId}&pageUrl=${pageUrl}`,
                });
                return new Response(response.payload, {
                    status: response.statusCode,
                    headers: Object.fromEntries(response.headers)
                });
            }
            // Add more routes as needed for your application
            return new Response("Not Found", { status: 404 });
        } catch (e) {
            console.error(e);
            return new Response("Internal Server Error", { status: 500 })
        }
    },
};