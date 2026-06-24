import React from 'react';

export default function Input({ className = '', ...props }) {
  return (
    <input
      className={`w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-all ${className}`}
      {...props}
    />
  );
}
