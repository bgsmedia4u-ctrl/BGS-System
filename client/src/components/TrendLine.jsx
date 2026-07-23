import React from 'react';

export default function TrendLine({ data = [10, 25, 15, 30, 20, 45, 35], color = 'var(--accent)', width = 120, height = 40 }) {
  if (!data || data.length === 0) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1; // Prevent division by zero
  
  const stepX = width / (data.length - 1);
  
  const points = data.map((val, index) => {
    const x = index * stepX;
    // Invert Y axis for SVG (0 is top)
    const y = height - ((val - min) / range) * (height - 10) - 5; 
    return `${x},${y}`;
  }).join(' ');

  // Create a curved path using bezier curves instead of simple polyline for a smoother SaaS look
  let pathD = `M 0,${height - ((data[0] - min) / range) * (height - 10) - 5}`;
  for (let i = 1; i < data.length; i++) {
    const prevX = (i - 1) * stepX;
    const prevY = height - ((data[i - 1] - min) / range) * (height - 10) - 5;
    const currX = i * stepX;
    const currY = height - ((data[i] - min) / range) * (height - 10) - 5;
    
    const controlX1 = prevX + (currX - prevX) * 0.5;
    const controlY1 = prevY;
    const controlX2 = prevX + (currX - prevX) * 0.5;
    const controlY2 = currY;
    
    pathD += ` C ${controlX1},${controlY1} ${controlX2},${controlY2} ${currX},${currY}`;
  }

  // Create area path for gradient
  const areaPathD = `${pathD} L ${width},${height} L 0,${height} Z`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id={`gradient-${color}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      
      {/* Area under the curve */}
      <path d={areaPathD} fill={`url(#gradient-${color})`} />
      
      {/* The Line */}
      <path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
