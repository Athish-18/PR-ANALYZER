import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronRight, FileText } from 'lucide-react';

export default function MessageBubble({ role, content, diagnostics, sources }) {
  const [showDetailed, setShowDetailed] = useState(false);
  const [showSources, setShowSources] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const isUser = role === 'user';
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex w-full mb-8 ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div 
        className={`rounded-2xl px-6 py-5 ${
          isUser 
            ? 'bg-accent/5 border border-accent/20 text-text-main max-w-[700px] shadow-[0_0_15px_rgba(0,245,212,0.05)]' 
            : 'bg-transparent text-text-main max-w-[850px] w-full'
        }`}
      >
        <div className="text-xs font-semibold uppercase tracking-widest mb-3 opacity-40">
          {isUser ? 'You' : 'PR Analyzer'}
        </div>
        <div className={`text-[15px] whitespace-pre-wrap ${
          isUser 
            ? 'leading-relaxed' 
            : 'leading-[1.75] text-text-main/90'
        }`}>
          {content}
        </div>
        
        {/* Inline Sources */}
        {sources && sources.length > 0 && (
          <div className="mt-6 border-t border-border pt-4">
            <button 
              onClick={() => setShowSources(!showSources)}
              className="flex items-center gap-2 text-sm font-semibold text-text-muted hover:text-text-main transition-colors uppercase tracking-wider"
            >
              {showSources ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              Sources ({sources.length})
            </button>
            
            <AnimatePresence>
              {showSources && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-4 grid grid-cols-1 gap-2">
                    {sources.map((source, i) => (
                      <div key={i} className="bg-card border border-border rounded-lg p-3 flex items-center gap-3 hover:border-accent/30 transition-colors">
                        <div className="p-2 bg-accent/10 text-accent rounded-md">
                          <FileText size={16} />
                        </div>
                        <div className="flex flex-col truncate">
                          <span className="text-sm font-medium text-text-main truncate">{source.filePath.split('/').pop()}</span>
                          <span className="text-xs text-text-muted truncate opacity-70">{source.filePath}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
        
        {/* Inline Diagnostics */}
        {diagnostics && (
          <div className={`border-t border-border pt-4 ${sources && sources.length > 0 ? 'mt-4' : 'mt-6'}`}>
            <button 
              onClick={() => setShowDiagnostics(!showDiagnostics)}
              className="flex items-center gap-2 text-sm font-semibold text-text-muted hover:text-text-main transition-colors uppercase tracking-wider"
            >
              {showDiagnostics ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              Diagnostics
            </button>
            
            <AnimatePresence>
              {showDiagnostics && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-4">
                    {diagnostics.retrievalSummary && (
                      <div className="bg-card border border-border rounded-lg p-4 mb-4">
                        <div className="flex flex-wrap items-center gap-4 mb-4 text-[13px]">
                          <span className="text-emerald-400 font-medium">✓ {diagnostics.retrievalSummary.method}</span>
                          {diagnostics.retrievalSummary.retrievalMode && (
                            <span className="text-emerald-400 font-medium">✓ Mode: {diagnostics.retrievalSummary.retrievalMode}</span>
                          )}
                          <span className="text-text-muted">✓ {diagnostics.retrievalSummary.chunksRetrieved} chunks retrieved</span>
                          <span className="text-text-muted">✓ {diagnostics.retrievalSummary.uniqueFiles} unique files</span>
                          <span className="text-text-muted">✓ Confidence: {diagnostics.retrievalSummary.confidence}</span>
                        </div>
                        
                        <div className="text-xs text-text-muted mb-2 uppercase tracking-wider">Top Sources:</div>
                        <ul className="text-sm text-accent space-y-1 mb-4 list-disc list-inside opacity-90">
                          {diagnostics.retrievalSummary.topSources.map((src, i) => (
                            <li key={i} className="truncate">{src}</li>
                          ))}
                        </ul>
                        
                        <button 
                          onClick={() => setShowDetailed(!showDetailed)}
                          className="text-xs text-text-muted hover:text-text-main underline transition-colors"
                        >
                          {showDetailed ? "[Hide Detailed Diagnostics]" : "[View Detailed Diagnostics]"}
                        </button>
                      </div>
                    )}

                    {showDetailed && diagnostics.detailedDiagnostics && (
                      <div className="space-y-3">
                        {diagnostics.detailedDiagnostics.map((diag, idx) => (
                          <div key={idx} className="bg-card border border-border/50 rounded-lg p-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-2">
                              <span className="text-xs font-medium text-accent break-all">{diag.filePath}</span>
                              <div className="flex items-center gap-3 shrink-0">
                                <span className="text-xs text-text-muted">Score: <span className="text-text-main">{diag.score}</span></span>
                                <span className="text-xs text-text-muted">Source: <span className="text-emerald-400 uppercase tracking-wider text-[10px]">{diag.source}</span></span>
                              </div>
                            </div>
                            <div className="text-xs text-text-muted mb-1.5">Preview:</div>
                            <pre className="text-xs text-text-muted bg-panel p-3 rounded-md border border-border/30 overflow-x-auto whitespace-pre-wrap font-mono">
                              {diag.chunkText}
                            </pre>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.div>
  );
}
