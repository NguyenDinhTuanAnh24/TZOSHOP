import { formatModelName } from "./model-display";

export function getAppBaseUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || 
    (process.env.NODE_ENV === "development" ? "http://localhost:3004" : "https://tzoshop.io.vn");
}

export function getApiBaseUrl() {
  return `${getAppBaseUrl()}/api/v1`;
}

export function getChatCompletionsUrl() {
  return `${getApiBaseUrl()}/chat/completions`;
}

interface ConfigParams {
  apiKey: string;
  models: string[];
}

export function generateContinueConfig({ apiKey, models }: ConfigParams) {
  const apiBase = getApiBaseUrl();
  
  const modelLines = models.map(model => {
    return `  - name: ${formatModelName(model)}
    provider: openai
    model: ${model}
    apiBase: ${apiBase}
    apiKey: ${apiKey}
    useResponsesApi: false
    roles:
      - chat
      - edit
      - apply`;
  }).join("\n");

  return `name: TzoShop Models
version: 0.0.1
schema: v1

models:
${modelLines}`;
}

export function generateCodexConfig({ model }: { model: string }) {
  const apiBase = getApiBaseUrl();
  
  return `model = "${model}"
model_provider = "tzoshop"

[model_providers.tzoshop]
name = "TzoShop"
base_url = "${apiBase}"
env_key = "TZOSHOP_API_KEY"
wire_api = "chat"`;
}

export function generatePowerShellExample({ apiKey, model }: { apiKey: string, model: string }) {
  const url = getChatCompletionsUrl();
  return `$headers = @{
  "Authorization" = "Bearer ${apiKey}"
  "Content-Type" = "application/json"
}

$body = @{
  model = "${model}"
  messages = @(
    @{
      role = "user"
      content = "Hello, TzoShop API"
    }
  )
} | ConvertTo-Json -Depth 10

Invoke-RestMethod \`
  -Uri "${url}" \`
  -Method POST \`
  -Headers $headers \`
  -Body $body`;
}

export function generateCurlExample({ apiKey, model }: { apiKey: string, model: string }) {
  const url = getChatCompletionsUrl();
  return `curl -X POST "${url}" \\
  -H "Authorization: Bearer ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "${model}",
    "messages": [
      {
        "role": "user",
        "content": "Hello, TzoShop API"
      }
    ]
  }'`;
}

export function generateJsExample({ apiKey, model }: { apiKey: string, model: string }) {
  const url = getChatCompletionsUrl();
  return `const response = await fetch("${url}", {
  method: "POST",
  headers: {
    "Authorization": "Bearer ${apiKey}",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    model: "${model}",
    messages: [
      {
        role: "user",
        content: "Hello, TzoShop API",
      },
    ],
  }),
});

const data = await response.json();
console.log(data);`;
}

export function generatePythonExample({ apiKey, model }: { apiKey: string, model: string }) {
  const url = getChatCompletionsUrl();
  return `import requests

url = "${url}"

headers = {
    "Authorization": "Bearer ${apiKey}",
    "Content-Type": "application/json",
}

payload = {
    "model": "${model}",
    "messages": [
        {
            "role": "user",
            "content": "Hello, TzoShop API",
        }
    ],
}

response = requests.post(url, headers=headers, json=payload)
print(response.json())`;
}
