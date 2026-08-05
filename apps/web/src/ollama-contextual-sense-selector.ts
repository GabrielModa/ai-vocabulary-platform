import type {
  ContextualSenseSelectorPort,
  ContextualSenseSelectorRequest,
} from "@vocabulary/domain-vocabulary";

export type OllamaContextualSenseFetch = (input: string, init: RequestInit) => Promise<Response>;

export class OllamaContextualSenseSelector implements ContextualSenseSelectorPort {
  constructor(
    private readonly options: {
      readonly baseUrl?: string;
      readonly model?: string;
      readonly fetch?: OllamaContextualSenseFetch;
    } = {},
  ) {}

  async select(request: ContextualSenseSelectorRequest): Promise<unknown> {
    const fetcher = this.options.fetch ?? globalThis.fetch;
    const response = await fetcher(`${this.options.baseUrl ?? "http://127.0.0.1:11434"}/api/chat`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        model: this.options.model ?? "qwen2.5:3b",
        stream: false,
        format: "json",
        options: { temperature: 0 },
        messages: [
          {
            role: "system",
            content:
              "Choose the best English lexical sense for the learner context. " +
              "Return JSON only with selectedSenseId, confidence, and reasonCodes. " +
              "Select exactly one supplied senseId. Never create or rewrite lexical facts.",
          },
          {
            role: "user",
            content: JSON.stringify({
              topic: request.context.topic,
              learnerLevel: request.context.learnerLevel,
              locale: request.context.locale,
              candidate: {
                candidateId: request.candidateId,
                displayForm: request.displayForm,
                normalizedLemma: request.normalizedLemma,
                ...(request.proposedPartOfSpeech
                  ? {
                      proposedPartOfSpeech: request.proposedPartOfSpeech,
                    }
                  : {}),
              },
              allowedSenses: request.allowedSenses,
            }),
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error("Contextual sense selector is unavailable");
    }

    const envelope = (await response.json()) as {
      readonly message?: {
        readonly content?: unknown;
      };
    };
    const content = envelope.message?.content;
    if (typeof content !== "string") {
      throw new Error("Contextual sense selector returned invalid content");
    }

    return JSON.parse(content) as unknown;
  }
}
