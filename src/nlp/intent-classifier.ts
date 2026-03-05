/**
 * Intent Classifier
 * 자연어 → 의도 분류
 *
 * Example:
 * "사용자 관리 REST API 만들어"
 * → {intent: "create_api", project_type: "api", confidence: 0.95}
 */

const Anthropic = require("@anthropic-ai/sdk").default;

export interface IntentResult {
  intent: string; // create_api, create_web, create_cli, create_service, add_feature, modify_auth, optimize
  project_type?: "api" | "web" | "cli" | "service"; // 프로젝트 타입
  confidence: number; // 0-1
  reasoning?: string;
}

const VALID_INTENTS = [
  "create_api",
  "create_web",
  "create_cli",
  "create_service",
  "add_feature",
  "modify_auth",
  "optimize",
];

const VALID_PROJECT_TYPES = ["api", "web", "cli", "service"];

export class IntentClassifier {
  private client: any;

  constructor() {
    this.client = new Anthropic({
      apiKey: process.env.CLAUDE_API_KEY,
    });
  }

  async classify(userPrompt: string): Promise<IntentResult> {
    try {
      const message = await this.client.messages.create({
        model: "claude-opus-4-6",
        max_tokens: 1024,
        messages: [
          {
            role: "user",
            content: `You are an expert at understanding development requests. Analyze the following user request and determine the primary intent.

User Request: "${userPrompt}"

Respond in JSON format with the following fields:
- intent: one of [create_api, create_web, create_cli, create_service, add_feature, modify_auth, optimize]
- project_type: one of [api, web, cli, service] (if applicable)
- confidence: 0-1 confidence score
- reasoning: brief explanation

Return ONLY valid JSON, no additional text.`,
          },
        ],
      });

      const content =
        message.content[0].type === "text" ? message.content[0].text : "{}";
      const result = JSON.parse(content);

      // Validate and sanitize
      return {
        intent: VALID_INTENTS.includes(result.intent)
          ? result.intent
          : "create_api",
        project_type: VALID_PROJECT_TYPES.includes(result.project_type)
          ? result.project_type
          : "api",
        confidence: Math.min(1, Math.max(0, result.confidence || 0.8)),
        reasoning: result.reasoning,
      };
    } catch (error) {
      console.error("Intent classification error:", error);
      return {
        intent: "create_api",
        project_type: "api",
        confidence: 0.5,
        reasoning: "Error during classification, using default",
      };
    }
  }
}

// Test
if (require.main === module) {
  (async () => {
    const classifier = new IntentClassifier();
    const result = await classifier.classify(
      "사용자 관리 REST API 만들어 (JWT 인증, PostgreSQL)"
    );
    console.log("Intent Classification Result:", result);
  })();
}
