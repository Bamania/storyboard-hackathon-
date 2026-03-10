import { Button, Input, Typography } from 'antd'
import { SettingOutlined, UserOutlined } from '@ant-design/icons'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import type { SceneContext } from '../types'
import '../App.css'

const { Title, Text } = Typography

const API_BASE = import.meta.env.DEV ? 'http://localhost:3001' : ''

export default function StoryInput() {
  const [script, setScript] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  const handleGenerate = async () => {
    if (!script.trim() || loading) return
    setError(null)
    setLoading(true)
    try {
      const { data } = await axios.post<{ script: string; scenes: SceneContext[] }>(
        `${API_BASE}/api/generate-and-parse`,
        { prompt: script.trim() }
      )
      navigate('/script', { state: { scenes: data.scenes, generatedScript: data.script } })
    } catch (err) {
      setError(axios.isAxiosError(err) ? err.response?.data?.error ?? err.message : 'Failed to generate script')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="director-page">
      <div className="ambient-glow ambient-glow-left" aria-hidden="true" />
      <div className="ambient-glow ambient-glow-right" aria-hidden="true" />

      <header className="top-bar">
        <div className="brand">
          <span className="brand-mark" />
          <Text className="brand-name">Storyboard Suite</Text>
        </div>
        <div className="top-actions">
          <button className="icon-shell" aria-label="Settings">
            <SettingOutlined />
          </button>
          <button className="icon-shell" aria-label="Profile">
            <UserOutlined />
          </button>
        </div>
      </header>

      <section className="prompt-stage">
        <span className="pre-production-badge">PRE-PRODUCTION</span>
        <Title level={1} className="title-main">
          What&apos;s your story?
        </Title>
        <Text className="subtitle">
          Paste a script, describe your vision, or drop a treatment. Your production crew will bring it to life.
        </Text>

        <div className="prompt-card">
          <Input.TextArea
            value={script}
            onChange={(e) => setScript(e.target.value)}
            disabled={loading}
            autoSize={{ minRows: 8, maxRows: 12 }}
            placeholder="A dog walking on water with a cat. A noir detective in a rain-soaked city. Describe your vision..."
            className="prompt-textarea"
          />

          <div className="crew-badges">
            <span className="crew-pill" style={{ borderColor: '#C4724B' }}>Director</span>
            <span className="crew-pill" style={{ borderColor: '#6B8CA6' }}>Cinematographer</span>
            <span className="crew-pill" style={{ borderColor: '#7A8B6F' }}>Editor</span>
            <span className="crew-pill" style={{ borderColor: '#C4A04B' }}>Production Designer</span>
          </div>
          <Text className="standby-text">Your crew is standing by</Text>

          <Button
            type="primary"
            size="large"
            className="generate-button"
            onClick={handleGenerate}
            loading={loading}
            disabled={!script.trim() || loading}
          >
            {loading ? 'Generating screenplay...' : 'Generate Screenplay →'}
          </Button>

          {error && (
            <div className="debate-error">
              <Text type="danger">{error}</Text>
            </div>
          )}
        </div>
      </section>

      <footer className="status-rail">
        <Text>Cinematography Engine v2.4</Text>
        <Text>Neural Framer Active</Text>
        <Text>Direct Export Ready</Text>
      </footer>
    </main>
  )
}
