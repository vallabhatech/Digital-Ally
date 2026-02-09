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

## 🛠️ Tech Stack

- **Frontend Framework**: [React 19](https://react.dev/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **AI Model**: [Google Gemini 2.5 Flash](https://deepmind.google/technologies/gemini/) via `@google/genai` SDK
- **Environment**: Node.js

## 📦 Installation

1.  **Clone the repository**
    ```bash
    git clone <repository-url>
    cd NAPATA
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Environment Setup**
    Create a `.env` file in the root directory and add your Google Gemini API key:
    ```env
    API_KEY=your_google_gemini_api_key_here
    ```

4.  **Run the development server**
    ```bash
    npm run dev
    ```

## 📜 Scripts

- `npm run dev`: Starts the development server.
- `npm run build`: Builds the application for production.
- `npm run preview`: Locally previews the production build.

## 📂 Project Structure

```
NAPATA/
├── components/          # UI Components (Header, InputPanel, OutputPanel, etc.)
├── hooks/               # Custom hooks (useSpeechToText, useTextToSpeech)
├── services/            # API services (geminiService.ts)
├── App.tsx             # Main application logic and state management
├── constants.ts        # App constants (Languages, Prompts, Color Palettes)
├── index.html          # Entry HTML file
└── vite.config.ts      # Vite configuration
```

## 💡 Usage

1.  **Enter Business Details**: Provide your name, business name, and contact info.
2.  **Describe Your Vision**: Use the text area or microphone to describe the website you want (e.g., "A modern coffee shop website with a menu section").
3.  **Select Style**: Choose a color palette that fits your brand identity.
4.  **Generate**: Click "Generate Website" to watch the AI build your site in seconds.
5.  **Refine**: Use the modification prompt to ask for changes (e.g., "Make the hero section darker").

## 📄 License

This project is licensed under the MIT License.
