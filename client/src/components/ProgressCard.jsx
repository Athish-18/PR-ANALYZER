import React from 'react';
import Card from './ui/Card';
import { GitBranch } from 'lucide-react';

export default function ProgressCard({ repositoryId, repositoryName, progress }) {

  // Determine status
  let status = 'Indexing';
  let badgeColor = 'bg-yellow-500';
  
  if (progress) {
    if (progress.embeddingsCreated >= progress.chunksCreated && progress.chunksCreated > 0) {
      status = 'Ready';
      badgeColor = 'bg-emerald-500';
    } else {
      status = 'Indexing';
      badgeColor = 'bg-yellow-500';
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Repository & Status Section */}
      <div>
        <div className="flex items-center justify-between bg-background border border-border rounded-md px-3 py-2">
          <div className="flex items-center gap-2 overflow-hidden">
            <GitBranch size={16} className="text-gray-400 flex-shrink-0" />
            <span className="text-sm text-gray-200 truncate">{repositoryName}</span>
          </div>
        </div>
        
        <div className="mt-5 pt-4 border-t border-border/50">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 font-medium">Status</span>
            <span className="text-[10px] uppercase tracking-wider font-semibold bg-background border border-border px-2 py-0.5 rounded text-gray-400 flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${badgeColor}`}></span>
              {status}
            </span>
          </div>
        </div>
      </div>

      {/* Metrics Section */}
      <div>
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Metrics</h3>
        <div className="grid grid-cols-2 gap-3">
          <Card className="hover:border-accent/50 transition-colors !p-3">
            <span className="text-xs text-gray-500 block mb-1">Files</span>
            <span className="text-xl font-semibold text-white">{progress?.totalFiles || 0}</span>
          </Card>
          <Card className="hover:border-accent/50 transition-colors !p-3">
            <span className="text-xs text-gray-500 block mb-1">Contents</span>
            <span className="text-xl font-semibold text-white">{progress?.contentsStored || 0}</span>
          </Card>
          <Card className="hover:border-accent/50 transition-colors !p-3">
            <span className="text-xs text-gray-500 block mb-1">Chunks</span>
            <span className="text-xl font-semibold text-white">{progress?.chunksCreated || 0}</span>
          </Card>
          <Card className="hover:border-accent/50 transition-colors !p-3">
            <span className="text-xs text-gray-500 block mb-1">Embeddings</span>
            <span className="text-xl font-semibold text-white">{progress?.embeddingsCreated || 0}</span>
          </Card>
        </div>
      </div>
    </div>
  );
}
