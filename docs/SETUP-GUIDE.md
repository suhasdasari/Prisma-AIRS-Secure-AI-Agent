# Setup & Deployment Guide

**Tyler AI Agent — Secured with Prisma AIRS**

This guide walks you through deploying the Tyler AI agent on AWS and connecting it to Palo Alto Networks Prisma AIRS.

---

## Prerequisites

- AWS account with permissions for Lambda, API Gateway, IAM, and Bedrock
- Palo Alto Networks Prisma AIRS account and API key
- ElevenLabs account and API key
- Node.js 18+ (for local testing)
- Python 3.9+ (for running tests)

---

## 1. Enable Amazon Bedrock

1. Open the [Amazon Bedrock console](https://console.aws.amazon.com/bedrock/).
2. Navigate to **Model access** → **Manage model access**.
3. Enable **Amazon Nova Lite** (`amazon.nova-lite-v1:0`).
4. Wait for access to be granted (usually instant).

---

## 2. Configure Prisma AIRS

1. Log in to your [Prisma AIRS portal](https://aisecurity.paloaltonetworks.com).
2. Create a new **AI Security Profile**:
   - Enable **Prompt Injection** detection
   - Enable **Jailbreak** detection
   - Enable **Harmful Content** blocking
   - Enable **PII** detection
   - Enable **Toxic Language** filtering
3. Note your **API Key** and **Endpoint URL**.
4. Set the profile name (default: `default`).

---

## 3. Deploy the Lambda Function

### Option A — AWS Console (Manual)

1. Open the [Lambda console](https://console.aws.amazon.com/lambda/).
2. Click **Create function** → **Author from scratch**.
3. Settings:
   - **Function name**: `tyler-ai-agent`
   - **Runtime**: Node.js 18.x
   - **Architecture**: x86_64
4. Upload `code/lambda/index.js` (zip it first: `zip function.zip index.js`).
5. Set the **Handler** to `index.handler`.
6. Set **Timeout** to 30 seconds and **Memory** to 512 MB.

### Option B — AWS CLI

```bash
# Zip the function
cd code/lambda
zip function.zip index.js

# Create the function
aws lambda create-function \
  --function-name tyler-ai-agent \
  --runtime nodejs18.x \
  --role arn:aws:iam::<ACCOUNT_ID>:role/lambda-bedrock-role \
  --handler index.handler \
  --zip-file fileb://function.zip \
  --timeout 30 \
  --memory-size 512
```

---

## 4. Set Environment Variables

In the Lambda console under **Configuration → Environment variables**, add:

| Key | Value |
|-----|-------|
| `PRISMA_AIRS_API_KEY` | Your Prisma AIRS API key |
| `PRISMA_AIRS_ENDPOINT` | `https://api.aisecurity.paloaltonetworks.com` |
| `PRISMA_AIRS_PROFILE` | Your profile name (e.g. `default`) |
| `ELEVENLABS_API_KEY` | Your ElevenLabs API key |
| `ELEVENLABS_VOICE_ID` | ElevenLabs voice ID (e.g. `21m00Tcm4TlvDq8ikWAM`) |
| `AWS_REGION` | `us-east-1` (or your preferred region) |

---

## 5. Set Up IAM Permissions

The Lambda execution role needs permission to call Bedrock:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel"
      ],
      "Resource": "arn:aws:bedrock:us-east-1::foundation-model/amazon.nova-lite-v1:0"
    }
  ]
}
```

Attach this policy to your Lambda execution role.

---

## 6. Create API Gateway

1. Open [API Gateway console](https://console.aws.amazon.com/apigateway/).
2. Create a **REST API**.
3. Create a resource `/chat` with a **POST** method.
4. Set the integration to **Lambda Function** → `tyler-ai-agent`.
5. Enable **Lambda Proxy Integration**.
6. Deploy to a stage (e.g. `prod`).
7. Note the **Invoke URL** — this is your endpoint.

---

## 7. Run the Test Suite

```bash
# Install dependencies
pip install requests pandas tqdm

# Run all 338 test prompts
python testing/run_tests.py \
  --endpoint https://<API_ID>.execute-api.us-east-1.amazonaws.com/prod/chat \
  --output my_results.csv
```

Expected output:
```
Total prompts tested : 338
Blocked by AIRS      : 294 (73.0%)
Correct predictions  : 310 (91.7%)
Errors               : 0
```

---

## 8. Test Manually

```bash
# Text response
curl -X POST https://<API_ID>.execute-api.us-east-1.amazonaws.com/prod/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello, how are you?"}'

# Audio response
curl -X POST https://<API_ID>.execute-api.us-east-1.amazonaws.com/prod/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Tell me about Remo AI", "audio": true}' \
  --output response.mp3
```

---

## Architecture Diagram

See `architecture-diagram.png` in the repository root for a visual overview.

---

## Troubleshooting

**Prisma AIRS returning 401**: Check that `PRISMA_AIRS_API_KEY` is set correctly and the token has not expired.

**Bedrock returning AccessDeniedException**: Ensure the Lambda IAM role has `bedrock:InvokeModel` permission and Nova Lite is enabled in your region.

**ElevenLabs returning 401**: Verify `ELEVENLABS_API_KEY` is valid and your account has remaining character quota.

**Lambda timeout**: Increase the timeout to 60 seconds if Prisma AIRS + Bedrock + ElevenLabs calls exceed 30s under load.

---

## License

MIT — see `LICENSE` in the repository root.

---

*Made by Suhas Dasari & Susmitha Gurram at Remo AI*
