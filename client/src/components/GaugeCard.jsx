import React from 'react';

export default function GaugeCard({ title, value, max = 100, color = 'var(--accent)', icon: Icon }) {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const percentage = Math.min(Math.max(value / max, 0), 1);
  const strokeDashoffset = circumference - percentage * circumference;

  return (
    <div className="stat-card" style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
      <div style={{ position: 'relative', width: 80, height: 80, flexShrink: 0 }}>
        {/* Background Arc */}
        <svg width="80" height="80" viewBox="0 0 80 80" style={{ transform: 'rotate(-90deg)' }}>
          <circle
            cx="40"
            cy="40"
            r={radius}
            fill="none"
            stroke="var(--border)"
            strokeWidth="8"
            strokeLinecap="round"
          />
          {/* Progress Arc */}
          <circle
            cx="40"
            cy="40"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{ transition: 'stroke-dashoffset 1s ease-out' }}
          />
        </svg>
        {/* Center Icon/Text */}
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: color
        }}>
          {Icon ? <Icon size={24} /> : <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{Math.round(percentage * 100)}%</span>}
        </div>
      </div>
      
      <div>
        <div className="stat-label" style={{ marginBottom: 4 }}>{title}</div>
        <div className="stat-value" style={{ fontSize: 24, margin: 0 }}>
          {value}{max !== 100 && <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>/{max}</span>}
        </div>
      </div>
    </div>
  );
}
