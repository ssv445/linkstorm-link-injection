# Linkstorm Link Injection

Instructions for setting up and deploying the Cloudflare Worker:

1.  **Clone the repository:**

    ```bash
    git clone <repository-url>
    cd linkstorm-link-injection
    ```

    Replace `<repository-url>` with the actual URL of your repository.

2.  **Add opportunities data:**
    Place your `opportunities.csv` file into the `data/` directory within the cloned repository.

3.  **Connect to Cloudflare:**

    - Go to your Cloudflare dashboard.
    - Navigate to Workers & Pages.
    - If you haven't connected your GitHub/GitLab account, do so now.
    - Select "Create application" -> "Pages" -> "Connect to Git".

4.  **Import the repository:**

    - Choose the `linkstorm-link-injection` repository you just cloned and pushed (if you forked it).
    - Select "Begin setup".

5.  **Configure deployment (if necessary):**

    - Cloudflare might autodetect settings. Ensure the framework preset is "None" or configure build commands if needed (though for a simple worker import, this might not be required if it's just deploying the `src/index.js` or similar).
    - Configure environment variables if your worker needs them (e.g., for accessing KV stores, secrets). Refer to `wrangler.jsonc` for potential configurations needed.

6.  **Deploy:**
    - Click "Save and Deploy".
    - Cloudflare will build and deploy your worker. You'll get a unique `*.workers.dev` subdomain, or it will deploy to your configured custom domain.

That's it! Your link injection worker should now be live.
