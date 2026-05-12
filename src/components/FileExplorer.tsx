import React, { useState } from 'react';
import { File, Folder, ChevronRight, ChevronDown, Plus, FolderPlus, Trash2, Edit2, Search, MoreVertical } from 'lucide-react';
import { FileNode } from '../types';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface FileExplorerProps {
  files: FileNode[];
  activeFileId: string | null;
  onFileClick: (id: string) => void;
  onFileCreate: (name: string, type: 'file' | 'folder', parentId?: string | null) => void;
  onFileDelete: (id: string) => void;
  onFileRename: (id: string, newName: string) => void;
}

export const FileExplorer: React.FC<FileExplorerProps> = ({
  files,
  activeFileId,
  onFileClick,
  onFileCreate,
  onFileDelete,
  onFileRename
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddingFileAtRoot, setIsAddingFileAtRoot] = useState(false);
  const [isAddingFolderAtRoot, setIsAddingFolderAtRoot] = useState(false);
  const [newName, setNewName] = useState('');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['root']));

  const toggleFolder = (id: string) => {
    const next = new Set(expandedFolders);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedFolders(next);
  };

  const handleAdd = (type: 'file' | 'folder', parentId: string | null = null) => {
    if (newName.trim()) {
      onFileCreate(newName.trim(), type, parentId);
      setNewName('');
      setIsAddingFileAtRoot(false);
      setIsAddingFolderAtRoot(false);
    }
  };

  const renderTree = (parentId: string | null = null, level = 0) => {
    const children = files
      .filter(f => f.parentId === parentId)
      .filter(f => f.name.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => {
        if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
        return a.name.localeCompare(b.name);
      });

    return children.map(file => {
      const isExpanded = expandedFolders.has(file.id);
      const isActive = activeFileId === file.id;

      if (file.type === 'folder') {
        return (
          <div key={file.id}>
            <div 
              onClick={() => toggleFolder(file.id)}
              className="group flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
              style={{ paddingLeft: `${level * 12 + 8}px` }}
            >
              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              <Folder className="w-4 h-4 text-amber-500/70" />
              <span className="text-xs font-medium">{file.name}</span>
            </div>
            {isExpanded && (
              <div className="border-l border-slate-800 ml-3">
                {renderTree(file.id, level + 1)}
              </div>
            )}
          </div>
        );
      }

      return (
        <div 
          key={file.id}
          onClick={() => onFileClick(file.id)}
          className={cn(
            "group flex items-center justify-between px-2 py-1.5 rounded-md cursor-pointer transition-all duration-200",
            isActive ? "bg-sky-500/10 text-sky-400" : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
          )}
          style={{ paddingLeft: `${level * 12 + 8}px` }}
        >
          <div className="flex items-center gap-2 overflow-hidden">
            <FileIcon name={file.name} isActive={isActive} />
            <span className="text-xs truncate">{file.name}</span>
          </div>
          <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
              onClick={(e) => { e.stopPropagation(); onFileDelete(file.id); }}
              className="p-1 rounded hover:bg-slate-700 text-slate-500 hover:text-rose-400"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>
      );
    });
  };

  return (
    <div className="flex flex-col h-full bg-[#1e293b] border-r border-slate-700 w-64 select-none">
      <div className="p-4 flex flex-col gap-4 bg-slate-900/20 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Explorer</h2>
          <div className="flex gap-0.5">
            <ExplorerAction icon={Plus} onClick={() => setIsAddingFileAtRoot(true)} label="New File" />
            <ExplorerAction icon={FolderPlus} onClick={() => setIsAddingFolderAtRoot(true)} label="New Folder" />
          </div>
        </div>

        <div className="relative">
          <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input 
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950/50 border border-slate-800 rounded-md py-1.5 pl-8 pr-3 text-[11px] text-slate-400 focus:outline-none focus:border-sky-500/50"
          />
        </div>
      </div>

      <div className="flex-1 overflow-auto py-2 custom-scrollbar">
        <AnimatePresence>
          {(isAddingFileAtRoot || isAddingFolderAtRoot) && (
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="px-4 mb-2">
              <div className="flex items-center gap-2 bg-slate-900 p-1.5 rounded border border-sky-500/30">
                <input 
                  autoFocus
                  placeholder={isAddingFileAtRoot ? "file.js" : "folder..."}
                  className="bg-transparent border-none text-xs text-slate-200 outline-none w-full"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAdd(isAddingFileAtRoot ? 'file' : 'folder');
                    if (e.key === 'Escape') { setIsAddingFileAtRoot(false); setIsAddingFolderAtRoot(false); }
                  }}
                  onBlur={() => handleAdd(isAddingFileAtRoot ? 'file' : 'folder')}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        {renderTree()}
      </div>
    </div>
  );
};

const FileIcon = ({ name, isActive }: { name: string, isActive: boolean }) => {
  const ext = name.split('.').pop();
  const color = isActive ? "text-sky-400" : "text-slate-500";
  
  if (ext === 'html') return <File className={cn("w-4 h-4", isActive ? "text-orange-400" : "text-orange-500/70")} />;
  if (ext === 'css') return <File className={cn("w-4 h-4", isActive ? "text-sky-400" : "text-sky-500/70")} />;
  if (ext === 'js') return <File className={cn("w-4 h-4", isActive ? "text-yellow-400" : "text-yellow-500/70")} />;
  
  return <File className={cn("w-4 h-4", color)} />;
};

const ExplorerAction = ({ icon: Icon, onClick, label }: { icon: any, onClick: () => void, label: string }) => (
  <button 
    onClick={onClick}
    title={label}
    className="p-1 rounded hover:bg-slate-800 text-slate-500 hover:text-slate-200 transition-colors"
  >
    <Icon className="w-3.5 h-3.5" />
  </button>
);
