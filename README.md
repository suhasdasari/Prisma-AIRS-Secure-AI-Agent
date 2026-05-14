# Prisma-AIRS-Secure-AI-Agent

<image-card alt="License" src="https://img.shields.io/badge/License-MIT-yellow.svg" ></image-card>
<image-card alt="AWS" src="https://img.shields.io/badge/AWS-%23FF9900.svg" ></image-card>
<image-card alt="Prisma AIRS" src="https://img.shields.io/badge/Prisma%20AIRS-Protected-blue" ></image-card>

**Secure Voice & Text AI Agents with Palo Alto Networks Prisma AIRS**

We built a production-ready serverless AI agent called **Tyler** — a professional personal assistant for Remo AI — and protected it using **Prisma AIRS** as a real-time security layer (scanning both user prompts and LLM responses).

### Key Results
- **73% block rate** (294 out of 338 adversarial prompts blocked)
- Dual-layer protection (prompt + response scanning)
- Fully serverless architecture

### Repository Contents
- `code/lambda/index.js` — Complete Lambda function with Prisma AIRS integration
- `testing/` — Python evaluation script + 338 test prompts
- `results/` — Prisma AIRS dashboard screenshots
- `docs/` — Setup guide

### Tech Stack
- AWS Lambda + API Gateway
- Amazon Bedrock (Nova Lite)
- ElevenLabs (Text-to-Speech)
- Palo Alto Networks Prisma AIRS (v1)

### Why Open Source?
We wanted to share a practical, real-world implementation of Prisma AIRS for securing AI agents — especially voice-enabled ones.

Feel free to use, modify, or build upon this work.

**Made by Suhas Dasari & Susmitha Gurram at Remo AI**
