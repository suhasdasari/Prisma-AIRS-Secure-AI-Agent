# Prisma-AIRS-Secure-AI-Agent

**Production-ready serverless voice AI agent secured with Palo Alto Networks Prisma AIRS**

Built a fully functional voice agent called **"Tyler"** with dual-layer runtime security (prompt + response scanning) using Prisma AIRS.

### Key Results
- **87% reduction** in LLM calls on malicious traffic (294 out of 338 adversarial prompts blocked)
- Overall refusal rate improved from **92.3% → 96.4%**
- Full dual-layer protection architecture

### Repository Contents
- `code/lambda/` — Complete AWS Lambda function (protected + unprotected versions)
- `testing/` — 338 adversarial test prompts + evaluation scripts
- `docs/` — Setup & deployment guide
- `paper/` — Final research paper (LaTeX + PDF)
- `results/` — Prisma AIRS dashboard screenshots

### Research Paper
**Title:** A Practical Architecture for Securing Voice and Text-Based AI Agents Using Palo Alto Networks Prisma AIRS: Implementation and Evaluation

**Authors:** Suhas Dasari, Susmitha Gurram  
**arXiv:** (coming soon)

[Download PDF](./paper/Prisma-AIRS-Paper.pdf)

### Tech Stack
- Palo Alto Networks **Prisma AIRS**
- AWS Lambda + API Gateway
- Amazon Bedrock (Nova Lite)
- ElevenLabs TTS

### Links
- GitHub: [https://github.com/suhasdasari/Prisma-AIRS-Secure-AI-Agent](https://github.com/suhasdasari/Prisma-AIRS-Secure-AI-Agent)
- Research Paper: (will be updated after arXiv submission)

Made with ❤️ by **Remo AI**
