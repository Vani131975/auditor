# 🚀 Deploying to Hugging Face Spaces (16GB RAM)

Since your project uses **Legal-BERT**, the 512MB RAM limit on Render's Free tier is likely too small. **Hugging Face Spaces** provides **16GB of RAM** for free, which is perfect for this application.

## Step 1: Create a New Space
1.  Go to [huggingface.co/new-space](https://huggingface.co/new-space).
2.  **Space Name**: `ai-compliance-auditor` (or your preferred name).
3.  **SDK**: Select **Docker**.
4.  **License**: `apache-2.0` (or your preferred license).
5.  **Visibility**: Public or Private.
6.  **Space Hardware**: Choose **CPU Basic (Free - 16GB RAM)**.

## Step 2: Push Your Code
Once the Space is created, Hugging Face will give you a Git URL. Connect your local repository and push:

```bash
git remote add hf https://huggingface.co/spaces/YOUR_USERNAME/YOUR_SPACE_NAME
git push hf main
```

## Step 3: Configure Environment Variables
1.  In your Hugging Face Space, go to **Settings**.
2.  Scroll down to **Variables and Secrets**.
3.  Add the following **Secrets** (exactly as you did on Render):
    *   `GEMINI_API_KEY`: Your Google Gemini API Key.
    *   `SUPABASE_URL`: Your Supabase Project URL.
    *   `SUPABASE_KEY`: Your Supabase Service Role Key.
    *   `JWT_SECRET`: A random string for authentication.

## Step 4: Access Your App
Your app will be available at:
`https://huggingface.co/spaces/YOUR_USERNAME/YOUR_SPACE_NAME`

---

**Why this works**: Hugging Face Spaces detects your `Dockerfile` and builds it automatically. We have pre-configured the `Dockerfile` to use port **7860**, which is Hugging Face's default requirement.

**Note**: Hugging Face Spaces go to "sleep" after 48 hours of inactivity. They wake up automatically when someone visits the URL.
