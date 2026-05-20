/**
 * OpenRouter AI — bilingual, scenario-aware responses.
 * Model is set via OPENROUTER_MODEL env var. Defaults to Claude Haiku.
 */

import OpenAI from 'openai'
import fs from 'fs'
import path from 'path'

const client = new OpenAI({
  apiKey:      process.env.OPENROUTER_API_KEY ?? 'missing',
  baseURL:     'https://openrouter.ai/api/v1',
  defaultHeaders: {
    'HTTP-Referer': 'https://thewanderlust.app',
    'X-Title':      'WanderAI',
  },
})

const MODEL = process.env.OPENROUTER_MODEL ?? 'anthropic/claude-haiku-4-5'

function loadKnowledgeBase(): string {
  try {
    return fs.readFileSync(
      path.join(process.cwd(), 'data', 'knowledge-base.md'),
      'utf8'
    )
  } catch {
    return 'You are WanderAI, a helpful bilingual AI travel agent. Reply in the same language the customer uses.'
  }
}

export async function getAIResponse(
  history: { role: 'user' | 'assistant'; content: string }[],
  scenarioContext?: string,
  paymentUrl?: string
): Promise<string> {
  const kb = loadKnowledgeBase()

  // Build composite system prompt: knowledge base + live scenario context
  let systemContent = kb
  if (scenarioContext) {
    systemContent += '\n\n══ LIVE CONVERSATION CONTEXT ══\n' + scenarioContext
  }
  if (paymentUrl) {
    systemContent +=
      `\n\nPAYMENT LINK — include this URL verbatim in your reply: ${paymentUrl}\n` +
      'Present it as a clickable-looking link. Tell the customer it is secure and processed by MyFatoorah.'
  }

  const res = await client.chat.completions.create({
    model:      MODEL,
    max_tokens: 700,
    messages: [
      { role: 'system', content: systemContent },
      ...history,
    ],
  })

  return (
    res.choices[0]?.message?.content?.trim() ??
    "Sorry, I couldn't process that. Please try again! / عذراً، حدث خطأ. الرجاء المحاولة مرة أخرى!"
  )
}
