import React from 'react';

export default function Card({ children, className = '' }) {
  return (
    <div className={`bg-card border border-border rounded-lg p-4 shadow-sm ${className}`}>
      {children}
    </div>
  );
}
