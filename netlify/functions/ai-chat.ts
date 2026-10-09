import { ServerAIService } from "../../server/aiService";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "Origin, X-Requested-With, Content-Type, Accept, Authorization, x-user-gemini-key, x-goog-api-key",
};

export const handler = async (event: any) => {
  // Handle CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: "",
    };
  }

  if (event.httpMethod === "GET") {
    const rawKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || process.env.API_KEY || "";
    const hasKey = Boolean(rawKey && rawKey.trim().length > 0);
    return {
      statusCode: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({
        status: "ok",
        configured: hasKey,
        service: "Netlify Serverless AI Endpoint",
        timestamp: new Date().toISOString()
      }),
    };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: "Method Not Allowed" }),
    };
  }

  try {
    let payload = {};
    if (event.body) {
      payload = typeof event.body === "string" ? JSON.parse(event.body) : event.body;
    }

    const customKey = event.headers?.["x-user-gemini-key"] || event.headers?.["X-User-Gemini-Key"] || undefined;
    const result = await ServerAIService.generateResponse(payload as any, customKey);

    return {
      statusCode: result.status || (result.success ? 200 : 500),
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      body: JSON.stringify(result),
    };
  } catch (error: any) {
    console.error("[Netlify AI Chat Error]", error);
    return {
      statusCode: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({
        success: false,
        error: error?.message || "Internal Netlify Serverless error during AI chat generation",
      }),
    };
  }
};
