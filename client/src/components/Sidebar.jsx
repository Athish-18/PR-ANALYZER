import React, { useState } from 'react';
import { GitBranch, Database, Sun, Moon, Info, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import Input from './ui/Input';
import Button from './ui/Button';
import RepositoryDetailsModal from './RepositoryDetailsModal';
import { useTheme } from '../contexts/ThemeContext';

export default function Sidebar({ 
  repositories,
  repositoryId, 
  repositoryName, 
  progress, 
  onIndexRepository, 
  onSelectRepository,
  isIndexing,
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewConversation
}) {
  const [repoUrl, setRepoUrl] = useState('');
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [showAddRepo, setShowAddRepo] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (repoUrl.trim()) {
      onIndexRepository(repoUrl.trim());
      setRepoUrl('');
      setShowAddRepo(false);
    }
  };

  return (
    <div className="w-[280px] bg-panel border-r border-border h-full p-4 flex flex-col flex-shrink-0">
      <div className="flex items-center gap-2 mb-8 px-1">
        <div className="w-8 h-8 rounded bg-accent/10 flex items-center justify-center text-accent">
          <Database size={18} />
        </div>
        <span className="font-semibold text-text-main">PR Analyzer</span>
      </div>

      <div className="mb-6 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider">Repositories</h3>
          {repositories && repositories.length > 0 && (
            <button 
              onClick={() => setShowAddRepo(!showAddRepo)}
              className="text-xs text-text-muted hover:text-accent font-medium transition-colors flex items-center gap-1"
            >
              <Plus size={12} /> Add
            </button>
          )}
        </div>
        
        {!repositories || repositories.length === 0 ? (
          <div className="bg-card border border-border p-4 rounded-xl flex flex-col gap-4 text-center">
            <span className="text-sm font-medium text-text-main">Connect a GitHub repository to begin analysis</span>
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <GitBranch size={16} className="text-text-muted" />
                </div>
                <Input
                  placeholder="https://github.com/..."
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  className="pl-9 w-full bg-background border-border/50 focus:border-accent"
                />
              </div>
              <Button type="submit" isLoading={isIndexing} className="w-full">
                Index Repository
              </Button>
            </form>
          </div>
        ) : (
          <div className="flex flex-col gap-2 max-h-[30vh] overflow-y-auto pr-1">
            {showAddRepo && (
              <div className="pt-1 pb-2">
                <form onSubmit={handleSubmit} className="flex flex-col gap-2">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <GitBranch size={14} className="text-text-muted" />
                    </div>
                    <Input
                      placeholder="https://github.com/..."
                      value={repoUrl}
                      onChange={(e) => setRepoUrl(e.target.value)}
                      className="pl-8 w-full text-xs py-1.5 bg-background border-border/50 focus:border-accent"
                    />
                  </div>
                  <Button type="submit" isLoading={isIndexing} className="w-full text-xs py-1.5">
                    Index Repository
                  </Button>
                </form>
              </div>
            )}
            
            {repositories.map(repo => {
              const isActive = repositoryId === repo.id;
              return (
                <div 
                  key={repo.id}
                  onClick={() => onSelectRepository(repo.id, repo.name)}
                  className={`group cursor-pointer p-3 rounded-xl border transition-all duration-300 relative ${
                    isActive 
                      ? 'bg-accent/10 border-accent/40 shadow-[0_2px_15px_-3px_rgba(0,245,212,0.15)]' 
                      : 'bg-card border-border hover:border-accent/30 hover:bg-accent/5'
                  }`}
                >
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-1/2 bg-accent rounded-r-full shadow-[0_0_8px_rgba(0,245,212,0.6)]"></div>
                  )}
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-sm font-medium text-text-main truncate pl-1">{repo.name}</span>
                    {isActive && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); setIsDetailsOpen(true); }}
                        className="text-accent opacity-80 hover:opacity-100 transition-opacity p-0.5 rounded-md"
                        title="View Details"
                      >
                        <Info size={14} />
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-text-muted pl-1">
                    <span className="flex items-center gap-1">
                      {repo.status === 'Indexed' ? (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]"></span>
                      ) : repo.status === 'Failed' ? (
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.5)]"></span>
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse shadow-[0_0_5px_rgba(0,245,212,0.5)]"></span>
                      )}
                      {repo.status || 'Pending'}
                    </span>
                    <span className="opacity-50">•</span>
                    <span>{repo.totalFiles?.toLocaleString() || 0} files</span>
                  </div>
                </div>
              );
            })}
            
          </div>
        )}
      </div>

      {repositoryId && (
        <div className="flex-1 overflow-y-auto mt-4 pr-1 min-h-0 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider">Conversations</h3>
            <button 
              onClick={onNewConversation}
              className="text-xs text-accent hover:text-accent/80 font-medium transition-colors"
            >
              + New Chat
            </button>
          </div>
          
          <div className="flex flex-col gap-2 overflow-y-auto">
            {activeConversationId === null && (
              <button
                className={`group relative text-left px-3 py-2.5 rounded-xl text-sm transition-all duration-300 border bg-accent/10 border-accent/30 text-text-main shadow-[0_2px_15px_-3px_rgba(0,245,212,0.15)] shadow-accent/5`}
              >
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-1/2 bg-accent rounded-r-full shadow-[0_0_8px_rgba(0,245,212,0.6)]"></div>
                <div className="font-medium truncate pl-1">New Chat</div>
                <div className={`text-[10px] opacity-60 mt-1 pl-1 transition-colors text-accent`}>
                  Just now
                </div>
              </button>
            )}

            {conversations && conversations.length > 0 ? (
              conversations.map(conv => (
                <button
                  key={conv.id}
                  onClick={() => onSelectConversation(conv.id)}
                  className={`group relative text-left px-3 py-2.5 rounded-xl text-sm transition-all duration-300 border ${
                    activeConversationId === conv.id 
                      ? 'bg-accent/10 border-accent/30 text-text-main shadow-[0_2px_15px_-3px_rgba(0,245,212,0.15)] shadow-accent/5' 
                      : 'bg-transparent border-transparent text-text-muted hover:bg-border/40 hover:text-text-main'
                  }`}
                >
                  {activeConversationId === conv.id && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-1/2 bg-accent rounded-r-full shadow-[0_0_8px_rgba(0,245,212,0.6)]"></div>
                  )}
                  <div className="font-medium truncate pl-1">{conv.title}</div>
                  <div className={`text-[10px] opacity-60 mt-1 pl-1 transition-colors ${activeConversationId === conv.id ? 'text-accent' : 'text-text-muted group-hover:text-text-main/70'}`}>
                    {new Date(conv.updated_at).toLocaleDateString()} {new Date(conv.updated_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </div>
                </button>
              ))
            ) : activeConversationId !== null ? (
              <div className="text-xs text-text-muted italic px-2">No past conversations</div>
            ) : null}
          </div>
        </div>
      )}

      {/* Footer Area with Theme Toggle */}
      <div className="mt-auto pt-4 border-t border-border flex items-center justify-between">
        <span className="text-xs text-text-muted font-medium">Theme</span>
        <button 
          onClick={toggleTheme}
          className="p-2 rounded-lg text-text-muted hover:text-text-main hover:bg-border/50 transition-colors flex items-center justify-center"
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>

      <RepositoryDetailsModal 
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        repositoryName={repositoryName}
        progress={progress}
      />
    </div>
  );
}
