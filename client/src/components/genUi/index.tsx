import { colors, fonts, textColors } from '../../theme/tokens';

/** Parse "• key: value" lines from params content */
function parseParamsContent(content: string): Array<{ key: string; value: string }> {
  const pairs: Array<{ key: string; value: string }> = [];
  const lines = content.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('• ') || trimmed.startsWith('- ')) {
      const rest = trimmed.slice(2).trim();
      const colonIdx = rest.indexOf(':');
      if (colonIdx > 0) {
        const key = rest.slice(0, colonIdx).trim();
        const value = rest.slice(colonIdx + 1).trim();
        if (key && value) pairs.push({ key, value });
      }
    }
  }
  return pairs;
}

/** Format key for display: snake_case → Title Case */
function formatKey(key: string): string {
  return key
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

export const ParamsUi = ({ data }: { data: { type: string; content: string; sceneNumber?: number } }) => {
  const pairs = parseParamsContent(data.content);
  if (pairs.length === 0) return null;

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, rgba(250,245,239,0.95) 0%, rgba(253,248,243,0.9) 100%)',
        border: '1px solid rgba(196,114,75,0.2)',
        borderRadius: 12,
        padding: '16px 20px',
        fontFamily: fonts.body,
        boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
      }}
    >
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.1em',
          color: colors.terracotta,
          textTransform: 'uppercase',
          marginBottom: 14,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <span style={{ fontSize: 12 }}>⚙</span>
        {data.sceneNumber != null ? `Scene ${data.sceneNumber} — Parameters set` : 'Parameters set'}
      </div>
      <div
        style={{
          display: 'grid',
          gap: 10,
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        }}
      >
        {pairs.map(({ key, value }) => (
          <div
            key={key}
            style={{
              background: 'rgba(255,255,255,0.7)',
              borderRadius: 8,
              padding: '10px 14px',
              border: '1px solid rgba(0,0,0,0.06)',
            }}
          >
            <div
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: textColors.secondary,
                marginBottom: 4,
                fontFamily: fonts.mono,
              }}
            >
              {formatKey(key)}
            </div>
            <div
              style={{
                fontSize: 13,
                color: textColors.primary,
                lineHeight: 1.4,
                wordBreak: 'break-word',
              }}
            >
              {value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export function GenUi({ data }: { data: { type: string; content: string; sceneNumber?: number } }) {
  if (data.type === 'params') {
    return <ParamsUi data={data} />;
  }
  return (
    <p
      style={{
        fontSize: 14,
        lineHeight: 1.65,
        color: textColors.primary,
        margin: 0,
        fontFamily: fonts.body,
        whiteSpace: 'pre-wrap',
      }}
    >
      {data.content}
    </p>
  );
}
