# Prisma-AIRS-Secure-AI-Agent

**Secure Voice & Text AI Agents with Palo Alto Networks Prisma AIRS**

We built a production-ready serverless AI agent called **Tyler** an helpful personal assistant for Remo AI and protected it using **Prisma AIRS** as a real-time security layer.

### What We Achieved
- **73% block rate** (294 out of 338 adversarial prompts blocked)
- Dual-layer protection (scans both user prompts **and** LLM responses)
- Fully serverless architecture (AWS Lambda + Bedrock + ElevenLabs)

### Repository Contents

- `code/lambda/index.js` — Complete Lambda function with Prisma AIRS integration
- `code/testing/` — Python script + all 338 test prompts used in our evaluation
- `paper/` — Full research paper (LaTeX source + PDF)
- `results/` — Screenshots from Prisma AIRS dashboard
- `docs/` — Setup and deployment guide

### Tech Stack
- **AWS Lambda** + **API Gateway**
- **Amazon Bedrock** (Nova Lite)
- **ElevenLabs** (Text-to-Speech)
- **Palo Alto Networks Prisma AIRS** (v1)

### Why We Open-Sourced This
We wanted to share a practical, real-world example of how to properly integrate Prisma AIRS for securing AI agents — especially voice-enabled ones. Whether you're a researcher, developer, or security engineer, feel free to use, modify, or build upon this work.

### Paper
The full research paper is available in the [`paper/`](paper/) folder.

### License
MIT License — feel free to use it in your projects.

---

**Made by Suhas Dasari & Susmitha Gurram at Remo AI**
