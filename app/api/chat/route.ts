import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
})

export async function POST(request: NextRequest) {
  try {
    const { message, bookContent, history } = await request.json()

    if (!message || !bookContent) {
      return NextResponse.json(
        { error: 'Message and book content are required' },
        { status: 400 }
      )
    }

    // Build conversation history
    const conversationHistory = history?.map((msg: any) => ({
      role: msg.role,
      content: msg.content,
    })) || []

    // Create the prompt with book context
    const systemPrompt = `You are an AI assistant specialized in answering questions about books. You have been provided with the content of a book, and your job is to answer questions about it accurately and helpfully.

Book content:
${bookContent.slice(0, 50000)}

Instructions:
- Answer questions based solely on the provided book content
- Be accurate and cite specific parts of the book when relevant
- If something is not in the book content, say so clearly
- Provide thoughtful, comprehensive answers
- If asked about themes, characters, or plot, reference specific passages`

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2048,
      system: systemPrompt,
      messages: [
        ...conversationHistory,
        {
          role: 'user',
          content: message,
        },
      ],
    })

    const assistantMessage = response.content[0]
    const text = assistantMessage.type === 'text' ? assistantMessage.text : ''

    return NextResponse.json({ response: text })
  } catch (error: any) {
    console.error('Chat error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to process request' },
      { status: 500 }
    )
  }
}
