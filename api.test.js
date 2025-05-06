const request = require('supertest');
const fastify = require('./index'); // Import your Fastify app instance

describe('API Tests', () => {
    let server;

    beforeAll(async () => {
        server = await fastify.listen(); // Start the server
    });

    afterAll(async () => {
        await server.close(); // Close the server
    });

    it('should return "hello world" for the root path', async () => {
        const response = await request(server).get('/');
        expect(response.status).toBe(200);
        expect(response.body).toEqual({ hello: 'world' });
    });

    it('should retrieve opportunities for a valid websiteId and pageUrl', async () => {
        const response = await request(server)
            .get('/get_website_page_opportunities?websiteId=1&pageUrl=https://blog.linkody.com/seo/seo-growth-hacks');

        expect(response.status).toBe(200);
        expect(response.body).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    target: 'https://blog.linkody.com/link-building/nofollow-links-affect-your-website-seo',
                    accepted: 'accepted',
                    anchor: 'Nofollow links',
                }),
                expect.objectContaining({
                    target: 'https://blog.linkody.com/seo/seo-growth-hacks',
                    accepted: 'accepted',
                    anchor: 'SEO Growth Hacks'
                })
            ])
        );
    });

    it('should return an empty array for a non-existent pageUrl', async () => {
        const response = await request(server)
            .get('/get_website_page_opportunities?websiteId=1&pageUrl=https://nonexistent.com');
        expect(response.status).toBe(200);
        expect(response.body).toEqual([]);
    });

    it('should return an error for invalid websiteId', async () => {
        const response = await request(server)
            .get('/get_website_page_opportunities?websiteId=abc&pageUrl=https://blog.linkody.com/seo/seo-growth-hacks');
        expect(response.status).toBe(200);
        expect(response.body).toEqual({ error: 'Invalid rootSiteId' });
    });

    it('should return an error for invalid pageUrl', async () => {
        const response = await request(server)
            .get('/get_website_page_opportunities?websiteId=1&pageUrl=');
        expect(response.status).toBe(200);
        expect(response.body).toEqual({ error: 'Invalid pageUrl' });
    });
});