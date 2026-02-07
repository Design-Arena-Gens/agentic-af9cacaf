'use client'

import { useState, useRef, useEffect } from 'react'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export default function Home() {
  const [file, setFile] = useState<File | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [bookContent, setBookContent] = useState('')
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    setFile(selectedFile)
    setUploading(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Failed to process file')
      }

      const data = await response.json()
      setBookContent(data.content)
      setMessages([])
    } catch (err) {
      setError('Failed to upload and process the file. Please try again.')
      setFile(null)
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveFile = () => {
    setFile(null)
    setBookContent('')
    setMessages([])
    setError('')
  }

  const handleSendMessage = async () => {
    if (!input.trim() || !bookContent || loading) return

    const userMessage: Message = { role: 'user', content: input }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: input,
          bookContent: bookContent,
          history: messages,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to get response')
      }

      const data = await response.json()
      const assistantMessage: Message = { role: 'assistant', content: data.response }
      setMessages(prev => [...prev, assistantMessage])
    } catch (err) {
      setError('Failed to get response. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="container">
      <div className="header">
        <h1>📚 Book Q&A AI Agent</h1>
        <p>Upload any book and ask questions - your AI assistant will help you understand it</p>
      </div>

      <div className="main-content">
        <div className="card upload-section">
          <h2>Upload Your Book</h2>

          {!file ? (
            <label htmlFor="file-upload" className="upload-area">
              <div className="upload-icon">📖</div>
              <div className="upload-text">Click to upload or drag & drop</div>
              <div className="upload-subtext">PDF, TXT, DOC, DOCX (Max 10MB)</div>
              <input
                id="file-upload"
                type="file"
                accept=".pdf,.txt,.doc,.docx"
                onChange={handleFileUpload}
              />
            </label>
          ) : (
            <div className="file-info">
              <span className="file-name">📄 {file.name}</span>
              <button onClick={handleRemoveFile} className="remove-btn">
                Remove
              </button>
            </div>
          )}

          {uploading && <div className="loading">Processing your book...</div>}
          {error && <div className="error">{error}</div>}
        </div>

        <div className="card chat-section">
          <h2>Ask Questions</h2>

          <div className="chat-container">
            {messages.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">💬</div>
                <p>{bookContent ? 'Ask any question about your book!' : 'Upload a book to start asking questions'}</p>
              </div>
            ) : (
              <>
                {messages.map((msg, idx) => (
                  <div key={idx} className={`chat-message message-${msg.role}`}>
                    <div className="message-label">
                      {msg.role === 'user' ? 'You' : 'AI Agent'}
                    </div>
                    <div className="message-bubble">{msg.content}</div>
                  </div>
                ))}
                {loading && <div className="loading">AI is thinking...</div>}
                <div ref={chatEndRef} />
              </>
            )}
          </div>

          <div className="input-container">
            <input
              type="text"
              placeholder={bookContent ? "Ask a question about your book..." : "Upload a book first..."}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={!bookContent || loading}
            />
            <button
              onClick={handleSendMessage}
              className="send-btn"
              disabled={!bookContent || loading || !input.trim()}
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
