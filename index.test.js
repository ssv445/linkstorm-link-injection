import { default as mod } from './index.js';
import opportunities from './opportunities.json';

const fetch = mod.fetch;

test('fetch / returns hello world', async () => {
    const req = new Request('http://x/');
    const resp = await mod.fetch(req);
    expect(resp.status).toBe(200);
    const json = await resp.json();
    expect(json.hello).toBe('world');
});

test('fetch /get_website_page_opportunities returns opportunities', async () => {
    const req = new Request('http://x/get_website_page_opportunities?pageUrl=https://blog.linkody.com/seo/seo-growth-hacks');
    const resp = await mod.fetch(req);
    expect(resp.status).toBe(200);
    const json = await resp.json();

    const expectedCount = opportunities.filter(row =>
        row['Source Page URL'] === 'https://blog.linkody.com/seo/seo-growth-hacks' &&
        row['Status'] === 'accepted'
    ).length;
    expect(json.length).toBe(expectedCount);

    //check that the opportunities are valid
    json.forEach(opportunity => {
        expect(opportunity.target).toBeDefined();
        expect(opportunity.anchor).toBeDefined();
        expect(opportunity.matchedSentence).toBeDefined();
    });
});

test('fetch /get_website_page_opportunities returns empty array for invalid pageUrl', async () => {
    const req = new Request('http://x/get_website_page_opportunities?pageUrl=invalid');
    const resp = await mod.fetch(req);
    expect(resp.status).toBe(200);
    const json = await resp.json();
    expect(json.length).toBe(0);
});


