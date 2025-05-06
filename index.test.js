import { default as mod } from './index.js';
import opportunities from './testOpportunities.json';

const fetch = (req, opps = opportunities) => mod.fetch(req, opps);

test('fetch / returns hello world', async () => {
    const req = new Request('http://x/');
    const resp = await fetch(req);
    expect(resp.status).toBe(200);
    const json = await resp.json();
    expect(json.hello).toBe('world');
});

test('fetch /get_website_page_opportunities returns all accepted for valid pageUrl', async () => {
    const req = new Request('http://x/get_website_page_opportunities?pageUrl=https://blog.linkody.com/seo/seo-growth-hacks');
    const resp = await fetch(req);
    expect(resp.status).toBe(200);
    const json = await resp.json();
    // Only accepted and matching Source Page URL
    expect(json.length).toBe(4);
    json.forEach(o => {
        expect(o.target).toBeDefined();
        expect(o.anchor).toBeDefined();
        expect(o.matchedSentence).toBeDefined();
        expect(o.accepted).toBe('accepted');
    });
});

test('fetch /get_website_page_opportunities returns empty for non-matching pageUrl', async () => {
    const req = new Request('http://x/get_website_page_opportunities?pageUrl=https://not-in-list.com/');
    const resp = await fetch(req);
    expect(resp.status).toBe(200);
    const json = await resp.json();
    expect(json.length).toBe(0);
});

test('fetch /get_website_page_opportunities handles empty anchor', async () => {
    const req = new Request('http://x/get_website_page_opportunities?pageUrl=https://blog.linkody.com/seo/seo-growth-hacks');
    const resp = await fetch(req);
    const json = await resp.json();
    expect(json.find(o => o.target.includes('empty-anchor')).anchor).toBe('');
});

test('fetch /get_website_page_opportunities handles custom type and id', async () => {
    const req = new Request('http://x/get_website_page_opportunities?pageUrl=https://blog.linkody.com/seo/seo-growth-hacks');
    const resp = await fetch(req);
    const json = await resp.json();
    const custom = json.find(o => o.type === 'custom');
    expect(custom).toBeDefined();
    expect(custom.id).toBe('custom-1');
});

test('fetch /get_website_page_opportunities ignores opportunities for other URLs', async () => {
    const req = new Request('http://x/get_website_page_opportunities?pageUrl=https://blog.linkody.com/seo/seo-growth-hacks');
    const resp = await fetch(req);
    const json = await resp.json();
    expect(json.find(o => o.target.includes('non-matching'))).toBeUndefined();
});

test('fetch /get_website_page_opportunities returns 400 for missing url param', async () => {
    const req = new Request('http://x/get_website_page_opportunities');
    const resp = await fetch(req);
    expect(resp.status).toBe(400);
});