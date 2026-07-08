# Digital Ally

Digital Ally (formerly BizBoost) is an advanced AI-powered platform designed to instantly generate professional websites, business newsletters, and analytical dashboards. Built with React, TypeScript, and powered by Google's Gemini 2.5 Flash model, it bridges the gap between business ideas and digital presence.

## 🚀 Features

- **AI Website Generation**: Transform text descriptions into fully responsive, modern landing pages using Tailwind CSS.
- **Dynamic Content Creation**: Automatically generates business newsletters and marketing copy customized for your brand.
- **Smart Dashboard & Analytics**: Get AI-driven insights and translations for business performance metrics.
- **Voice Interaction**:
  - **Speech-to-Text**: Dictate your website requirements and prompts.
  - **Text-to-Speech**: Listen to generated content and insights.
- **Customization**: Choose from curated color palettes and modify generated designs with follow-up prompts.
- **Multi-Language Support**: Interactive interface supporting multiple languages.
- **Live Preview & Code Export**: View changes in real-time and export clean, deployment-ready HTML/CSS code.
- **Lazy Image Loading**: Images load on demand via Intersection Observer with placeholders and fallbacks for faster page loads.
- **Privacy Controls**: Versioned consent before remote AI processing, local-only generation, and one-click data deletion.
- **Backend AI Gateway**: All remote AI requests route through a secured Express API with server-managed secrets, quotas, and audit logging.

## 🛠️ Tech Stack

- **Frontend Framework**: [React 19](https://react.dev/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **AI Model**: [Google Gemini 2.5 Flash](https://deepmind.google/technologies/gemini/) via `@google/genai` SDK
- **Environment**: Node.js

## 📦 Installation

### Clone the Repository

```bash
git clone <repository-url>
cd digital-ally
```

### Install Dependencies

```bash
npm install
```

### Configure Environment Variables

**Client** (`.env` in project root):

```bash
cp .env.example .env
```

```env
# Gateway token — same value as SERVER_CLIENT_TOKEN in server/.env (NOT the Gemini key)
VITE_SERVER_CLIENT_TOKEN=replace_with_secure_random_token
```

**Server** (`server/.env` — holds all secrets):

```bash
cp server/.env.example server/.env
```

```env
GEMINI_API_KEY=your_gemini_api_key
SERVER_CLIENT_TOKEN=replace_with_secure_random_token
GEMINI_MODEL=gemini-2.5-flash
AI_CONSENT_VERSION=2026-06-21
ADMIN_TOKEN=replace_with_admin_token

# Optional Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
PORT=5174
DAILY_QUOTA=100
MONTHLY_QUOTA=1000
```

> **Important:** The Gemini API key lives only in `server/.env`. The browser uses `VITE_SERVER_CLIENT_TOKEN` to authenticate with the backend gateway — never embed API keys in the frontend.

---

## Running the Application

### Start Frontend

```bash
npm run dev
```

Default Vite URL:

```text
http://localhost:5173
```

### Start Backend

```bash
npm run start:server
```

Default API URL:

```text
http://localhost:5174
```

## 🩺 Server Health Check

The backend now exposes a health endpoint at `/api/health` that verifies the Gemini API key is present and that the Gemini API can be reached before generation requests are allowed. The frontend checks this endpoint on startup, displays a warning if the server is misconfigured, and disables the generation buttons until the health check passes.

## 📜 Available Scripts

| Script | Description |
|----------|-------------|
| npm run dev | Start Vite development server |
| npm run build | Validate translations and create production build |
| npm run check:translations | Verify translation coverage |
| npm run lint:structure | Verify the expected folder layout and file locations |
| npm run lint:architecture | Alias for the structure and naming check |
| npm run preview | Preview production build locally |
| npm run start:server | Start Express AI proxy server |
| npm test | Run unit tests (including lazy-loading) |
| npm run test:watch | Run tests in watch mode |

## 🖼️ Lazy Image Loading

Digital Ally defers image downloads until they are near the viewport to improve initial page load performance.

- **`LazyImage` component** (`src/components/LazyImage.tsx`): Wraps `react-lazy-load-image-component` with blur placeholders, `loading="lazy"`, and automatic fallback to `/images/fallback.svg` on error.
- **HTML preview enhancement** (`src/lib/lazy-loading/`): Generated website previews automatically receive `loading="lazy"`, `decoding="async"`, and skeleton styles.
- **Assets**: Placeholder and fallback SVGs live in `public/images/`.

See [docs/LAZY_LOADING.md](docs/LAZY_LOADING.md) for usage examples and implementation details.

## 🛡️ Privacy

No business details or generated content are persisted by Digital Ally. Users
must choose remote AI processing or local-only templates before using
generation features. See [PRIVACY.md](PRIVACY.md) for the data-flow, retention,
deletion, logging, and deployment policy.

## 📂 Project Structure

```text
digital-ally/
│
├── public/
│   └── privacy.html
│
├── scripts/
│   └── check-translations.mjs
│
├── server/
│   ├── index.js
│   └── ...
│
├── src/
│   ├── app/
│   │   ├── App.tsx
│   │   ├── context/
│   │   │   └── AppContext.tsx
│   │   └── styles.css
│   ├── components/
│   │   └── IconSet.tsx
│   ├── hooks/
│   ├── pages/
│   ├── features/
│   │   └── generation/
│   │       └── geminiService.ts
│   └── shared/
│       ├── constants.ts
│       ├── privacy.ts
│       └── types.ts
│
├── .env.example
├── package.json
├── vite.config.ts
├── tsconfig.json
├── README.md
└── src/main.tsx
```

## 🧩 Architectural diagram
<img width="8192" height="1783" alt="arch" src="https://github.com/user-attachments/assets/39777d99-e887-4785-9cd3-036b48e1dbea" />

## 🔀 Data flow diagram
<img width="6818" height="8192" alt="DFD-2026-06-06-051046" src="https://github.com/user-attachments/assets/8834b79b-d627-4a70-9c19-5efe69f842e2" />

## 💡 Usage

1.  **Enter Business Details**: Provide your name, business name, and contact info.
2.  **Describe Your Vision**: Use the text area or microphone to describe the website you want (e.g., "A modern coffee shop website with a menu section").
3.  **Select Style**: Choose a color palette that fits your brand identity.
4.  **Generate**: Click "Generate Website" to watch the AI build your site in seconds.
5.  **Refine**: Use the modification prompt to ask for changes (e.g., "Make the hero section darker").

---

## 🐛 Troubleshooting

### Missing GEMINI_API_KEY

Error:

```text
GEMINI_API_KEY not set in server environment
```

Solution:

- Verify `.env` exists.
- Verify `GEMINI_API_KEY` is populated.
- Restart the server.

---

### Redis Connection Errors

Error:

```text
Redis connection error
```

Solution:

- Start Redis locally.
- Verify `REDIS_HOST` and `REDIS_PORT`.
- The application will continue running with reduced quota functionality.

---

### Build Failures

Run:

```bash
npm run check:translations
```

Fix missing translation keys before rebuilding.

---

### Port Already In Use

Change:

```env
PORT=5174
```

or stop the process using the port.

---

## 🚧 Known Limitations

- Requires a valid Gemini API key.
- Voice features depend on browser support.
- Generated content quality depends on prompt quality.
- Redis quota tracking is unavailable when Redis is offline.
- AI features require internet connectivity.
- Browser speech APIs may behave differently across platforms.

---

[![Classify Issues by Difficulty](https://github.com/vallabhatech/Digital-Ally/actions/workflows/classify-difficulty.yml/badge.svg)](https://github.com/vallabhatech/Digital-Ally/actions/workflows/classify-difficulty.yml)

## 🤝 Contributing

We welcome ELUSOC contributors. Please read the contribution guide before opening
issues or pull requests:

- [CONTRIBUTING.md](CONTRIBUTING.md)

## 🔐 Security

Please review the security policy for reporting vulnerabilities:

- [SECURITY.md](SECURITY.md)

## 📄 License

This project is licensed under the MIT License.

## Organization Notes

- `src/app` contains the application shell and context providers.

- `src/shared` contains cross-cutting constants, types, and privacy helpers.
- `src/features` contains feature-specific services and workflows.
- React components use `PascalCase`.
- Shared utilities and services use `camelCase`.
- Shared barrel modules may use descriptive names like `IconSet.tsx` when they re-export a group of helpers.
- The Vite entrypoint is [`src/main.tsx`](/src/main.tsx).
- The `@/` alias points at `src/` for cleaner imports.
