import { db } from "@/API/base44Client";

export function invokeLlm({ prompt, responseJsonSchema }) {
  return db.integrations.Core.InvokeLLM({
    prompt,
    response_json_schema: responseJsonSchema,
  });
}
