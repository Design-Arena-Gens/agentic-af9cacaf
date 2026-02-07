import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    let content = ''

    // Handle different file types
    if (file.name.endsWith('.txt')) {
      content = buffer.toString('utf-8')
    } else if (file.name.endsWith('.pdf')) {
      // For PDF, we'll use a simple text extraction approach
      // In production, you'd use pdf-parse, but for simplicity we'll handle it differently
      try {
        const pdfParse = require('pdf-parse')
        const data = await pdfParse(buffer)
        content = data.text
      } catch (err) {
        // Fallback: simple text extraction
        content = buffer.toString('utf-8').replace(/[^\x20-\x7E\n]/g, ' ')
      }
    } else if (file.name.endsWith('.doc') || file.name.endsWith('.docx')) {
      // For DOCX files
      try {
        const mammoth = require('mammoth')
        const result = await mammoth.extractRawText({ buffer })
        content = result.value
      } catch (err) {
        content = buffer.toString('utf-8').replace(/[^\x20-\x7E\n]/g, ' ')
      }
    } else {
      // Try to read as text
      content = buffer.toString('utf-8')
    }

    if (!content || content.trim().length < 10) {
      return NextResponse.json(
        { error: 'Could not extract text from file' },
        { status: 400 }
      )
    }

    return NextResponse.json({ content: content.slice(0, 100000) }) // Limit to 100k chars
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Failed to process file' },
      { status: 500 }
    )
  }
}

export const maxDuration = 60
