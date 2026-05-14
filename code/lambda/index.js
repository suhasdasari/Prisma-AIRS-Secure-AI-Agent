import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';

const secretsClient = new SecretsManagerClient({});
const bedrockClient = new BedrockRuntimeClient({ region: "us-east-1" });

async function getSecret(secretName) {
    const response = await secretsClient.send(new GetSecretValueCommand({ SecretId: secretName }));
    return JSON.parse(response.SecretString);
}

async function scanWithPrismaAIRS(text, airsSecrets, profileName, stage = "prompt") {
    const airsPayload = {
        contents: [{ prompt: text }],
        ai_profile: { profile_name: profileName }
    };

    const response = await fetch("https://service.api.aisecurity.paloaltonetworks.com/v1/scan/sync/request", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-pan-token": airsSecrets.PRISMA_AIRS_KEY
        },
        body: JSON.stringify(airsPayload)
    });

    const result = await response.json();
    console.log(`Prisma AIRS ${stage} Scan [${profileName}]:`, JSON.stringify(result, null, 2));

    const isBlocked = 
        result.action === "block" || 
        result.category === "malicious" ||
        (result.prompt_detected && Object.values(result.prompt_detected).some(v => v === true));

    return { isBlocked, result };
}

export const handler = async (event) => {
    try {
        const body = JSON.parse(event.body || '{}');
        const userText = body.text || "Hello, how are you today?";

        console.log("=== REQUEST RECEIVED ===");
        console.log("User prompt:", userText);

        const elevenSecrets = await getSecret(process.env.SECRET_NAME);
        const airsSecrets = await getSecret(process.env.PRISMA_AIRS_SECRET_NAME);

        // === 1. Scan User Prompt ===
        const promptScan = await scanWithPrismaAIRS(userText, airsSecrets, "VoiceAgent-Security-Profile", "PROMPT");
        if (promptScan.isBlocked) {
            console.log("✅ BLOCKED by Prisma AIRS (User Prompt)");
            return await returnBlockedAudio(elevenSecrets);
        }

        // === 2. Call LLM (Tyler - Remo Personal Assistant) ===
        console.log("✅ Prompt Safe → Calling Tyler (LLM)");
        const bedrockResponse = await bedrockClient.send(new InvokeModelCommand({
            modelId: "amazon.nova-lite-v1:0",
            contentType: "application/json",
            accept: "application/json",
            body: JSON.stringify({
                messages: [{ 
                    role: "user", 
                    content: [{ text: `You are Tyler, a highly capable and professional personal assistant for Remo AI company. 
You help employees with daily tasks, writing professional emails, summarizing documents, planning meetings, 
writing production-ready code, debugging, deployment scripts, and anything else needed to be efficient at work.
Be helpful, concise, proactive, and always maintain a professional tone.\n\nUser: ${userText}` }] 
                }],
                inferenceConfig: { maxTokens: 500, temperature: 0.7 }
            })
        }));

        const novaResult = JSON.parse(new TextDecoder().decode(bedrockResponse.body));
        const aiText = novaResult.output.message.content[0].text || "Sorry, I couldn't generate a response.";

        // === 3. Scan LLM Response ===
        const responseScan = await scanWithPrismaAIRS(aiText, airsSecrets, "VoiceAgent-Response-Profile", "RESPONSE");
        if (responseScan.isBlocked) {
            console.log("✅ BLOCKED by Prisma AIRS (LLM Response)");
            return await returnBlockedAudio(elevenSecrets);
        }

        console.log("✅ Response Safe → Converting to Speech");

        // === 4. Convert to Speech ===
        const elevenLabs = new ElevenLabsClient({ apiKey: elevenSecrets.ELEVENLABS_API_KEY });
        const audioStream = await elevenLabs.textToSpeech.convert("pNInz6obpgDQGcFmaJgB", {
            text: aiText,
            modelId: "eleven_flash_v2_5",
            voiceSettings: { stability: 0.75, similarityBoost: 0.85 }
        });

        const chunks = [];
        for await (const chunk of audioStream) chunks.push(chunk);
        const buffer = Buffer.concat(chunks);

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'audio/mpeg', 'Access-Control-Allow-Origin': '*' },
            body: buffer.toString('base64'),
            isBase64Encoded: true
        };

    } catch (error) {
        console.error("ERROR:", error);
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
};

async function returnBlockedAudio(elevenSecrets) {
    const blockedText = "I'm sorry, but I cannot assist with that request due to safety and security policies.";

    const elevenLabs = new ElevenLabsClient({ apiKey: elevenSecrets.ELEVENLABS_API_KEY });
    const audioStream = await elevenLabs.textToSpeech.convert("pNInz6obpgDQGcFmaJgB", {
        text: blockedText,
        modelId: "eleven_flash_v2_5",
        voiceSettings: { stability: 0.75, similarityBoost: 0.85 }
    });

    const chunks = [];
    for await (const chunk of audioStream) chunks.push(chunk);
    const buffer = Buffer.concat(chunks);

    return {
        statusCode: 200,
        headers: { 'Content-Type': 'audio/mpeg', 'Access-Control-Allow-Origin': '*' },
        body: buffer.toString('base64'),
        isBase64Encoded: true
    };
}