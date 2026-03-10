import { Button, Typography } from 'antd'
import { SettingOutlined, UserOutlined } from '@ant-design/icons'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import type { SceneContext } from '../types'
import { useTypewriter } from '../hooks/useTypewriter'
import '../App.css'

const { Title, Text } = Typography

function TypedDebateText({ message, streaming }: { message: string; streaming?: boolean }) {
  const displayed = useTypewriter(message, true)
  return (
    <>
      {displayed}
      {streaming && <span className="debate-cursor" />}
    </>
  )
}

const AGENT_COLORS: Record<string, string> = {
  Director: '#C4724B',
  Cinematographer: '#6B8CA6',
  Editor: '#7A8B6F',
  ProductionDesigner: '#C4A04B',
}

const AGENT_ROLES = [
  { name: 'Director', color: '#C4724B', subtitle: 'Story, emotion, framing' },
  { name: 'Cinematographer', color: '#6B8CA6', subtitle: 'Camera, lens, lighting' },
  { name: 'Editor', color: '#7A8B6F', subtitle: 'Pacing, rhythm, movement' },
  { name: 'ProductionDesigner', color: '#C4A04B', subtitle: 'World, color, era' },
]

interface DebateMessage {
  agent: string
  message: string
  streaming?: boolean
}

interface SceneComplete {
  scene_index: number
  shot_parameters: Record<string, unknown>
}

const API_BASE = import.meta.env.DEV ? 'http://localhost:3001' : ''

export default function ShotDesign() {
  const location = useLocation()
  const navigate = useNavigate()
  const scenes = (location.state as { scenes?: SceneContext[] })?.scenes ?? []
  const [isStreaming, setIsStreaming] = useState(false)
  const [debateMessages, setDebateMessages] = useState<DebateMessage[]>([])
  const [currentScene, setCurrentScene] = useState<{ index: number; slug: string; total: number } | null>(null)
  const [sceneParams, setSceneParams] = useState<Record<number, Record<string, unknown>>>({})
  const [isDone, setIsDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeSpeaker, setActiveSpeaker] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const transcriptEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = useCallback(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    if (debateMessages.length > 0) scrollToBottom()
  }, [debateMessages, scrollToBottom])

  const startDebate = useCallback(async () => {
    if (scenes.length === 0 || isStreaming) return

    setError(null)
    setIsDone(false)
    setDebateMessages([])
    setCurrentScene(null)
    setSceneParams({})
    setActiveSpeaker(null)
    setIsStreaming(true)
    abortRef.current = new AbortController()

    try {
      const res = await fetch(`${API_BASE}/api/debate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenes }),
        signal: abortRef.current.signal,
      })
      if (!res.ok || !res.body) throw new Error(res.statusText || 'Request failed')
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6)) as Record<string, unknown>
              const type = data.type as string
              if (type === 'debate_chunk') {
                const agent = data.agent as string
                setActiveSpeaker(agent)
                const chunk = data.chunk as string
                const doneChunk = data.done as boolean
                setDebateMessages((prev) => {
                  const last = prev[prev.length - 1]
                  if (last?.agent === agent && last?.streaming) {
                    let newMessage: string
                    if (chunk === last.message) {
                      newMessage = last.message
                    } else if (chunk.startsWith(last.message)) {
                      newMessage = chunk
                    } else if (chunk.length > 5 && last.message.endsWith(chunk)) {
                      newMessage = last.message
                    } else {
                      newMessage = last.message + chunk
                    }
                    return [
                      ...prev.slice(0, -1),
                      { agent, message: newMessage, streaming: !doneChunk },
                    ]
                  }
                  return [...prev, { agent, message: chunk, streaming: !doneChunk }]
                })
                if (doneChunk) setActiveSpeaker(null)
              } else if (type === 'debate_message') {
                const agent = data.agent as string
                const message = data.message as string
                setDebateMessages((prev) => {
                  const last = prev[prev.length - 1]
                  if (last?.agent === agent && last?.streaming) {
                    return [...prev.slice(0, -1), { agent, message }]
                  }
                  return [...prev, { agent, message }]
                })
                setActiveSpeaker(null)
              } else if (type === 'scene_start') {
                setCurrentScene({
                  index: data.scene_index as number,
                  slug: (data.scene_slug as string) ?? 'Scene',
                  total: (data.total_scenes as number) ?? 1,
                })
              } else if (type === 'scene_complete') {
                const payload = data as unknown as SceneComplete
                setSceneParams((prev) => ({ ...prev, [payload.scene_index]: payload.shot_parameters }))
              } else if (type === 'done') {
                setIsDone(true)
              } else if (type === 'error') {
                setError(data.message as string)
              }
            } catch {
              // ignore parse errors
            }
          }
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return
      setError(err instanceof Error ? err.message : 'Request failed')
    } finally {
      setIsStreaming(false)
      setActiveSpeaker(null)
      abortRef.current = null
    }
  }, [scenes, isStreaming])

  const allParams = Object.entries(sceneParams)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([idx, params]) => ({ sceneIndex: Number(idx), params }))

  const truncateSlug = (slug: string) => {
    const match = slug.match(/^(?:EXT\.|INT\.)\s+(.+?)(?:\s+—|$)/i)
    return match ? match[1].replace(/\s*\/\s*.*$/, '').trim() : slug.slice(0, 20)
  }

  if (scenes.length === 0) {
    return (
      <main className="director-page">
        <header className="top-bar">
          <div className="brand">
            <span className="brand-mark" />
            <Text className="brand-name">Storyboard Suite</Text>
          </div>
        </header>
        <section className="prompt-stage">
          <Title level={3}>No scenes to debate</Title>
          <Text>Go back and approve a script first.</Text>
          <Button type="primary" onClick={() => navigate('/script')} style={{ marginTop: 16 }}>
            Back to Script
          </Button>
        </section>
      </main>
    )
  }

  return (
    <main className="director-page shot-design-page">
      <div className="ambient-glow ambient-glow-left" aria-hidden="true" />
      <div className="ambient-glow ambient-glow-right" aria-hidden="true" />

      <header className="top-bar">
        <div className="brand">
          <span className="brand-mark" />
          <Text className="brand-name">Storyboard Suite</Text>
        </div>
        <div className="top-actions">
          <button className="icon-shell" onClick={() => navigate('/script', { state: { scenes } })} aria-label="Back">
            Back
          </button>
          <button className="icon-shell" aria-label="Settings">
            <SettingOutlined />
          </button>
          <button className="icon-shell" aria-label="Profile">
            <UserOutlined />
          </button>
        </div>
      </header>

      <div className="shot-design-layout">
        <aside className="shot-design-sidebar">
          <div className="sidebar-header">
            <Title level={4}>Shot Design</Title>
            <Text className="sidebar-subtitle">Crew debates per sequence</Text>
          </div>
          <div className="crew-roster">
            {AGENT_ROLES.map((a) => (
              <div
                key={a.name}
                className={`crew-roster-item ${activeSpeaker === a.name ? 'crew-roster-active' : ''}`}
                style={{ ['--agent-color' as string]: a.color }}
              >
                <span className="crew-dot" />
                <div>
                  <Text strong={activeSpeaker === a.name}>{a.name}</Text>
                  <Text className="crew-subtitle">{a.subtitle}</Text>
                </div>
              </div>
            ))}
          </div>
          <div className="scene-progress-list">
            {scenes.map((s, i) => {
              const completed = sceneParams[i] !== undefined || (isDone && i < scenes.length)
              const active = currentScene?.index === i
              return (
                <div
                  key={i}
                  className={`scene-progress-item ${active ? 'scene-progress-active' : ''} ${completed ? 'scene-progress-done' : ''}`}
                >
                  <span className="scene-progress-icon">
                    {completed ? '✓' : active ? '●' : '○'}
                  </span>
                  <Text className="scene-progress-label">{truncateSlug(s.slug)}</Text>
                </div>
              )
            })}
          </div>
          <div className="sidebar-footer">
            {!isDone ? (
              <Text className="progress-count">
                {currentScene ? currentScene.index + 1 : 0} of {scenes.length} sequences
              </Text>
            ) : (
              <Button type="primary" block className="generate-button" disabled>
                View Storyboard →
              </Button>
            )}
          </div>
        </aside>

        <div className="shot-design-main">
          <div className="shot-design-topbar">
            <Text className="shot-design-scene-slug">
              {currentScene?.slug ?? (scenes[0]?.slug ?? 'Select scene')}
            </Text>
            <Text className="shot-design-scene-counter">
              {currentScene ? `Sequence ${currentScene.index + 1} / ${currentScene.total}` : '—'}
            </Text>
          </div>

          {!isStreaming && debateMessages.length === 0 && (
            <div className="shot-design-empty">
              <Text className="shot-design-empty-text">Ready to begin debate</Text>
              <Button
                type="primary"
                size="large"
                className="generate-button"
                onClick={startDebate}
              >
                Begin Debate
              </Button>
            </div>
          )}

          {(isStreaming || debateMessages.length > 0) && (
            <div className="debate-panel shot-design-debate">
              {!isStreaming && debateMessages.length === 0 && currentScene && (
                <Button
                  type="primary"
                  size="large"
                  className="generate-button"
                  onClick={startDebate}
                >
                  Begin Debate
                </Button>
              )}
              <div className="debate-transcript">
                {debateMessages.map((m, i) => (
                  <div
                    key={i}
                    className="debate-message"
                    style={{ borderLeftColor: AGENT_COLORS[m.agent] ?? '#6B8CA6' }}
                  >
                    <Text
                      strong
                      className="debate-agent"
                      style={{ color: AGENT_COLORS[m.agent] ?? '#6B8CA6' }}
                    >
                      {m.agent}
                      {m.streaming && <span className="debate-streaming-badge"> typing...</span>}
                    </Text>
                    <Text className="debate-text">
                      <TypedDebateText message={m.message} streaming={m.streaming} />
                    </Text>
                  </div>
                ))}
                <div ref={transcriptEndRef} />
              </div>
            </div>
          )}

          {allParams.length > 0 && (
            <div className="params-panel">
              <Title level={4} className="params-title">
                Shot Parameters (Crew Decisions)
              </Title>
              <Text className="params-panel-hint">
                Final parameters per sequence — for future image generation prompts
              </Text>
              {allParams.map(({ sceneIndex, params }) => (
                <div key={sceneIndex} className="params-scene">
                  <Text className="params-scene-label">Sequence {sceneIndex + 1}</Text>
                  <pre className="params-json">{JSON.stringify(params, null, 2)}</pre>
                </div>
              ))}
            </div>
          )}

          {error && (
            <div className="debate-error">
              <Text type="danger">{error}</Text>
            </div>
          )}
        </div>
      </div>

      <footer className="status-rail">
        <Text>Cinematography Engine v2.4</Text>
        <Text>Neural Framer Active</Text>
        <Text>Direct Export Ready</Text>
      </footer>
    </main>
  )
}
