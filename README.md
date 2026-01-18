# 🏆 Custom GitHub Profile Trophies

A custom-built engine to generate dynamic GitHub trophies for your profile README. Built with Node.js and Express.

## 🚀 How to Use (For Everyone)

Once this project is deployed (e.g., on Vercel), anyone can use it by adding the following markdown to their GitHub profile `README.md`:

```markdown
[![My Trophies](https://YOUR-VERCEL-APP-URL.vercel.app/api?username=THEIR_USERNAME&theme=onedark)](https://github.com/AmanRai1221/github-trophies-custom)
```

### 🎨 Customization

- **username**: Your GitHub username (Required)
- **theme**: `onedark` (default) or `light`

### Example

If your username is **john_doe**, you would use:
`https://.../api?username=john_doe`

---

## 🛠 Deployment (Self-Hosting)

If you want to host your own instance of this code:

1.  **Clone the repo**:
    ```bash
    git clone https://github.com/AmanRai1221/github-trophies-custom.git
    ```
2.  **Install Dependencies**:
    ```bash
    npm install
    ```
3.  **Setup Environment**:
    - Create a `.env` file.
    - Add `GITHUB_TOKEN=your_token_here`.
4.  **Run Locally**:
    ```bash
    npm start
    ```

## ☁️ Deploy to Vercel

1.  Fork this repository.
2.  Import project to Vercel.
3.  Add `GITHUB_TOKEN` to Vercel Environment Variables.
4.  Your API is live!
