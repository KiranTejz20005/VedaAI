'use client';

export default function CommunityLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        height: 'calc(100vh - 64px)',
        width: 'calc(100% + 48px)',
        marginLeft: -24,
        marginRight: -24,
        marginTop: -24,
        marginBottom: -24,
        background: '#f8f9fb',
        overflow: 'hidden',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      <div style={{ flex: 1, display: 'flex', minWidth: 0, overflow: 'hidden' }}>
        {children}
      </div>
    </div>
  );
}
