import { Button, Input, Typography } from 'antd'
import { CloseOutlined, EditOutlined } from '@ant-design/icons'
import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import type { SceneContext } from '../types'
import '../App.css'

const { Title, Text } = Typography

export default function ScriptSequence() {
  const location = useLocation()
  const navigate = useNavigate()
  const [scenes, setScenes] = useState<SceneContext[]>(
    (location.state as { scenes?: SceneContext[] })?.scenes ?? []
  )
  const [editingIndex, setEditingIndex] = useState<number | null>(null)

  if (scenes.length === 0) {
    return (
      <main className="director-page">
        <div className="ambient-glow ambient-glow-left" aria-hidden="true" />
        <div className="ambient-glow ambient-glow-right" aria-hidden="true" />
        <header className="top-bar">
          <div className="brand">
            <span className="brand-mark" />
            <Text className="brand-name">Storyboard Suite</Text>
          </div>
        </header>
        <section className="prompt-stage">
          <Title level={3}>No scenes yet</Title>
          <Text>Go back and generate a screenplay first.</Text>
          <Button type="primary" onClick={() => navigate('/')} style={{ marginTop: 16 }}>
            Back to Story Input
          </Button>
        </section>
      </main>
    )
  }

  const updateScene = (index: number, updates: Partial<SceneContext>) => {
    setScenes((prev) =>
      prev.map((s, i) => (i === index ? { ...s, ...updates } : s))
    )
  }

  const deleteScene = (index: number) => {
    setScenes((prev) => prev.filter((_, i) => i !== index))
    if (editingIndex === index) setEditingIndex(null)
    else if (editingIndex !== null && editingIndex > index) setEditingIndex(editingIndex - 1)
  }

  const addScene = () => {
    setScenes((prev) => [
      ...prev,
      { slug: 'NEW SCENE', body: '', characters: [], location: 'Unknown', timeOfDay: 'Day' },
    ])
  }

  const handleApprove = () => {
    navigate('/shot-design', { state: { scenes } })
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
          <button className="icon-shell" onClick={() => navigate('/')} aria-label="Back">
            Back
          </button>
        </div>
      </header>

      <section className="script-sequence-stage">
        <div className="script-sequence-header">
          <Title level={3}>Script Sequences</Title>
          <Text className="script-subtitle">{scenes.length} sequences · Review and edit before approving</Text>
          <div className="script-actions">
            <Button type="primary" size="large" className="generate-button" onClick={handleApprove}>
              Approve Script →
            </Button>
          </div>
        </div>

        <div className="scene-cards">
          {scenes.map((scene, i) => (
            <div
              key={i}
              className={`scene-card ${editingIndex === i ? 'scene-card-editing' : ''}`}
            >
              <div className="scene-card-header">
                <span className="scene-number">{i + 1}</span>
                {editingIndex === i ? (
                  <Input
                    value={scene.slug}
                    onChange={(e) => updateScene(i, { slug: e.target.value })}
                    className="scene-slug-input"
                  />
                ) : (
                  <Text className="scene-slug">{scene.slug}</Text>
                )}
                <div className="scene-card-actions">
                  <Button
                    type="link"
                    size="small"
                    onClick={() => setEditingIndex(editingIndex === i ? null : i)}
                  >
                    {editingIndex === i ? 'Done' : <EditOutlined />}
                  </Button>
                  <button
                    type="button"
                    className="scene-delete"
                    onClick={() => deleteScene(i)}
                    aria-label="Delete scene"
                  >
                    <CloseOutlined />
                  </button>
                </div>
              </div>
              <div className="scene-card-body">
                {editingIndex === i ? (
                  <Input.TextArea
                    value={scene.body}
                    onChange={(e) => updateScene(i, { body: e.target.value })}
                    autoSize={{ minRows: 4 }}
                    className="scene-body-input"
                  />
                ) : (
                  <pre className="scene-body">{scene.body}</pre>
                )}
              </div>
              <div className="scene-card-footer">
                {scene.characters.length > 0 && (
                  <span className="scene-characters">
                    {scene.characters.join(', ')}
                  </span>
                )}
                <span className="scene-meta">
                  {scene.location} · {scene.timeOfDay}
                </span>
              </div>
            </div>
          ))}
          <button type="button" className="add-scene-card" onClick={addScene}>
            + Add Scene
          </button>
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
