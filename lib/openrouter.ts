/**
 * OpenRouter AI responses
 *
 * Compatible with any model on openrouter.ai — set OPENROUTER_MODEL in .env.local
 * Defaults to a fast, cheap model good for travel conversations.
 */

import OpenAI from 'openai'
import fs from 'fs'
import path from 'path'

const client = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY ?? 'missing',
  baseURL: 'https://openrouter.ai/api/v1',
  defaultHeaders: {
    'HTTP-Referer': 'https://thewanderlust.app',
    'X-Title': 'WanderAI',
  },
})

const MODEL = process.env.OPENROUTER_MODEL ?? 'anthropic/claude-haiku-4-5'

function loadKnowledgeBase(): string {
  try {
    return fs.readFileSync(path.join(process.cwd(), 'data', 'knowledge-base.md'), 'utf8')
  } catch {
    return 'You are WanderAI, a helpful AI travel agent.'
  }
}

export async function getAIResponse(
  history: { role: 'user' | 'assistant'; content: string }[]
): Promise<string> {
  const kb = loadKnowledgeBase()

  const res = await client.chat.completions.create({
    model: MODEL,
    max_tokens: 600,
    messages: [
      {
        role: 'system',
        content: kb,
      },
      ...history,
    ],
  })

  return res.choices[0]?.message?.content?.trim() ?? "Sorry, I couldn't process that. Please try again!"
}
