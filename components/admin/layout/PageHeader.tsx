import React from 'react';

export function PageHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
      <p className="text-sm text-slate-500 mt-1">{description}</p>
    </div>
  );
}
