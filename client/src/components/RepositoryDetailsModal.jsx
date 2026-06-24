import React from 'react';
import { X, Database, FileCode, HardDrive, ListTree, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function RepositoryDetailsModal({ isOpen, onClose, repositoryName, progress }) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-panel border border-border/80 rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] w-full max-w-md overflow-hidden relative"
        >
          {/* Subtle top glow */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-accent/0 via-accent/50 to-accent/0 opacity-50"></div>
          
          <div className="p-6 border-b border-border/50 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-text-main flex items-center gap-2">
              <Database size={18} className="text-accent" />
              Repository Details
            </h2>
            <button
              onClick={onClose}
              className="text-text-muted hover:text-text-main transition-colors p-1.5 rounded-lg hover:bg-border/50"
            >
              <X size={18} />
            </button>
          </div>

          <div className="p-7">
            <div className="mb-8">
              <div className="text-xs text-text-muted uppercase tracking-wider font-semibold mb-1">Connected To</div>
              <div className="text-sm text-text-main font-medium truncate">{repositoryName}</div>
            </div>

            {progress ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-card/50 border border-border/60 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-accent/10 text-accent rounded-md">
                      <ListTree size={16} />
                    </div>
                    <div>
                      <div className="text-xs text-text-muted mb-0.5">Status</div>
                      <div className="text-sm font-semibold text-text-main">
                        {progress.status === 'Indexed' ? (
                          <span className="text-emerald-400 flex items-center gap-1.5"><CheckCircle size={14}/> Indexed</span>
                        ) : progress.status === 'Failed' ? (
                          <span className="text-red-400 flex items-center gap-1.5"><X size={14}/> Failed</span>
                        ) : (
                          <span className="text-accent flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-accent animate-pulse"></span> {progress.status || 'Processing'}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-5 bg-card/50 border border-border/60 rounded-xl flex flex-col justify-between hover:bg-card hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
                    <div className="text-xs text-text-muted flex items-center gap-2 mb-3">
                      <FileCode size={14} className="opacity-70" /> Files
                    </div>
                    <div className="text-2xl font-semibold text-text-main tracking-tight">
                      {progress.totalFiles?.toLocaleString() || 0}
                    </div>
                  </div>
                  
                  <div className="p-5 bg-card/50 border border-border/60 rounded-xl flex flex-col justify-between hover:bg-card hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
                    <div className="text-xs text-text-muted flex items-center gap-2 mb-3">
                      <HardDrive size={14} className="opacity-70" /> Contents
                    </div>
                    <div className="text-2xl font-semibold text-text-main tracking-tight">
                      {progress.contentsStored?.toLocaleString() || 0}
                    </div>
                  </div>
                  
                  <div className="p-5 bg-card/50 border border-border/60 rounded-xl flex flex-col justify-between hover:bg-card hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
                    <div className="text-xs text-text-muted flex items-center gap-2 mb-3">
                      <HardDrive size={14} className="opacity-70" /> Chunks
                    </div>
                    <div className="text-2xl font-semibold text-text-main tracking-tight">
                      {progress.chunksCreated?.toLocaleString() || 0}
                    </div>
                  </div>
                  
                  <div className="p-5 bg-card/50 border border-border/60 rounded-xl flex flex-col justify-between hover:bg-card hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
                    <div className="text-xs text-text-muted flex items-center gap-2 mb-3">
                      <Database size={14} className="opacity-70" /> Embeddings
                    </div>
                    <div className="text-2xl font-semibold text-text-main tracking-tight">
                      {progress.embeddingsCreated?.toLocaleString() || 0}
                    </div>
                  </div>
                </div>

              </div>
            ) : (
              <div className="text-center py-8 text-sm text-text-muted">
                No indexing progress available.
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
