import { useState, useMemo } from 'react';
import Editor from '@monaco-editor/react';
import { Files, Search, Settings, Code, Play, Monitor, Download, Upload, Moon, Sun, Layout, Terminal, Layers, Palette, Github, Zap, Menu, X, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useFileSystem } from './hooks/useFileSystem';
import { useSettings } from './hooks/useSettings';
import { FileExplorer } from './components/FileExplorer';
import { LivePreview } from './components/LivePreview';
import { Toolbox } from './components/Toolbox';
import { cn } from './lib/utils';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

export default function App() {
  const { 
    project, 
    activeFileId, 
    updateFileContent, 
    createFile, 
    deleteFile, 
    renameFile, 
    openFile, 
    closeTab,
  } = useFileSystem();
  
  const { settings, updateSettings } = useSettings();
  
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'explorer' | 'search' | 'settings' | 'toolbox'>('explorer');
  const [previewOpen, setPreviewOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const activeFile = useMemo(() => 
    project.files.find(f => f.id === activeFileId), 
    [project.files, activeFileId]
  );

  const htmlFile = project.files.find(f => f.name.endsWith('.html'));
  const cssFile = project.files.find(f => f.name.endsWith('.css'));
  const jsFile = project.files.find(f => f.name.endsWith('.js'));

  const handleExportZip = async () => {
    const zip = new JSZip();
    project.files.forEach(file => {
      if (file.type === 'file' && file.content !== undefined) {
        zip.file(file.name, file.content);
      }
    });
    const blob = await zip.generateAsync({ type: 'blob' });
    saveAs(blob, `${project.name.replace(/\s+/g, '_')}.zip`);
  };

  const handleEditorChange = (value: string | undefined) => {
    if (activeFileId && value !== undefined) {
      updateFileContent(activeFileId, value);
    }
  };

  return (
    <div className={cn(
      "h-screen flex flex-col font-sans selection:bg-sky-500/30 overflow-hidden",
      settings.theme === 'vs-dark' ? "bg-[#0f172a] text-slate-100" : "bg-slate-50 text-slate-900"
    )}>
      {/* Header */}
      <header className="h-12 border-b border-slate-800 flex items-center justify-between px-4 bg-slate-900/50 backdrop-blur-xl z-50">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-sky-400 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-sky-500/20">
              <Zap className="w-5 h-5 text-white fill-white" />
            </div>
            <h1 className="font-bold text-sm tracking-tight hidden sm:block">NeonCode <span className="text-sky-400">Studio</span></h1>
          </div>
          <div className="h-4 w-px bg-slate-700 mx-2 hidden sm:block"></div>
          <p className="text-[10px] text-slate-500 font-medium uppercase tracking-widest hidden md:block">v1.2.0 | Production Ready</p>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => setPreviewOpen(!previewOpen)}
            className={cn(
              "p-2 rounded-lg transition-all",
              previewOpen ? "bg-sky-500/10 text-sky-400" : "text-slate-400 hover:bg-slate-800"
            )}
            title="Toggle Preview"
          >
            <Monitor className="w-4 h-4" />
          </button>
          <button 
            onClick={() => alert('Project Import: Select a ZIP or a folder to load into the workspace (Simulation)')}
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-all"
            title="Import Project"
          >
            <Upload className="w-4 h-4" />
          </button>
          <button 
            onClick={handleExportZip}
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-all"
            title="Export ZIP"
          >
            <Download className="w-4 h-4" />
          </button>
          <button 
            onClick={() => updateSettings({ theme: settings.theme === 'vs-dark' ? 'light' : 'vs-dark' })}
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-all"
          >
            {settings.theme === 'vs-dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          
          <div className="h-8 w-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center ml-2 overflow-hidden">
             <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${project.id}`} alt="User" />
          </div>
          
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 text-slate-400 lg:hidden"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Activity Bar (VS Code style) */}
        <aside className="w-12 border-r border-slate-800 bg-slate-900/80 flex flex-col items-center py-4 gap-4 hidden sm:flex">
          <ActivityIcon 
            icon={Files} 
            active={activeTab === 'explorer'} 
            onClick={() => { setActiveTab('explorer'); setSidebarOpen(true); }} 
          />
          <ActivityIcon 
            icon={Search} 
            active={activeTab === 'search'} 
            onClick={() => { setActiveTab('search'); setSidebarOpen(true); }} 
          />
          <ActivityIcon 
            icon={Sparkles} 
            active={activeTab === 'toolbox'} 
            onClick={() => { setActiveTab('toolbox'); setSidebarOpen(true); }} 
          />
          <div className="flex-1"></div>
          <ActivityIcon 
            icon={Github} 
            active={false} 
            onClick={() => {}} 
          />
          <ActivityIcon 
            icon={Settings} 
            active={activeTab === 'settings'} 
            onClick={() => { setActiveTab('settings'); setSidebarOpen(true); }} 
          />
        </aside>

        {/* Sidebar Container */}
        <AnimatePresence initial={false}>
          {sidebarOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 256, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="relative overflow-hidden border-r border-slate-800 bg-slate-900/30 backdrop-blur-sm hidden sm:block"
            >
              {activeTab === 'explorer' && (
                <FileExplorer 
                  files={project.files}
                  activeFileId={activeFileId}
                  onFileClick={openFile}
                  onFileCreate={createFile}
                  onFileDelete={deleteFile}
                  onFileRename={renameFile}
                />
              )}
              {activeTab === 'search' && (
                <div className="p-4">
                  <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Search</h2>
                  <p className="text-xs text-slate-500 italic">Advanced search coming soon...</p>
                </div>
              )}
              {activeTab === 'toolbox' && <Toolbox />}
              {activeTab === 'settings' && (
                <div className="p-4 space-y-6 overflow-y-auto h-full pb-20">
                  <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 text-sky-400">Settings</h2>
                  
                  <div className="space-y-4">
                    <SettingItem label="Font Size">
                       <input 
                        type="range" 
                        min="10" max="30" 
                        value={settings.fontSize} 
                        onChange={(e) => updateSettings({ fontSize: parseInt(e.target.value) })}
                        className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-500"
                       />
                       <span className="text-[10px] text-slate-500">{settings.fontSize}px</span>
                    </SettingItem>

                    <SettingItem label="Tab Size">
                      <select 
                        value={settings.tabSize}
                        onChange={(e) => updateSettings({ tabSize: parseInt(e.target.value) })}
                        className="w-full bg-slate-800 border border-slate-700 rounded p-1 text-xs text-slate-300"
                      >
                        <option value={2}>2 Spaces</option>
                        <option value={4}>4 Spaces</option>
                        <option value={8}>8 Spaces</option>
                      </select>
                    </SettingItem>

                    <SettingItem label="Word Wrap">
                      <button 
                        onClick={() => updateSettings({ wordWrap: settings.wordWrap === 'on' ? 'off' : 'on' })}
                        className={cn(
                          "w-full py-1 text-xs rounded border transition-all",
                          settings.wordWrap === 'on' ? "bg-sky-500/20 border-sky-500 text-sky-400" : "bg-slate-800 border-slate-700 text-slate-400"
                        )}
                      >
                        {settings.wordWrap === 'on' ? 'Enabled' : 'Disabled'}
                      </button>
                    </SettingItem>

                    <SettingItem label="Minimap">
                      <button 
                        onClick={() => updateSettings({ minimap: !settings.minimap })}
                        className={cn(
                          "w-full py-1 text-xs rounded border transition-all",
                          settings.minimap ? "bg-sky-500/20 border-sky-500 text-sky-400" : "bg-slate-800 border-slate-700 text-slate-400"
                        )}
                      >
                        {settings.minimap ? 'Show' : 'Hide'}
                      </button>
                    </SettingItem>

                    <SettingItem label="Accent Color">
                       <div className="flex gap-2">
                         {['#38bdf8', '#f472b6', '#a78bfa', '#34d399', '#fbbf24'].map(color => (
                           <button 
                            key={color}
                            onClick={() => updateSettings({ accentColor: color })}
                            className={cn(
                              "w-5 h-5 rounded-full border-2",
                              settings.accentColor === color ? "border-white scale-110 shadow-lg shadow-black/50" : "border-transparent opacity-70"
                            )}
                            style={{ backgroundColor: color }}
                           />
                         ))}
                       </div>
                    </SettingItem>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Toggle Sidebar Button */}
        <button 
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute left-[calc(48px+256px)] bottom-8 z-40 bg-slate-800 border border-slate-700 p-1.5 rounded-full text-slate-400 hover:text-white transition-all hidden sm:flex items-center justify-center translate-x-[-50%]"
          style={{ left: sidebarOpen ? '304px' : '48px' }}
        >
          {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>

        {/* Editor & Preview Area */}
        <main className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Editor Container */}
          <div className="flex-1 flex flex-col bg-[#1e293b] min-w-0">
             {/* Tabs Header */}
             <div className="h-9 flex items-center bg-slate-900 overflow-x-auto scrollbar-hide border-b border-slate-800">
               {project.openTabs.map(tabId => {
                 const file = project.files.find(f => f.id === tabId);
                 if (!file) return null;
                 const isActive = activeFileId === tabId;
                 return (
                   <div 
                    key={tabId}
                    onClick={() => openFile(tabId)}
                    className={cn(
                      "h-full flex items-center px-3 min-w-[120px] max-w-[200px] border-r border-slate-800 text-[11px] cursor-pointer group transition-all",
                      isActive ? "bg-[#1e293b] text-sky-400 border-t-2 border-t-sky-500" : "bg-black/20 text-slate-500 hover:bg-slate-800"
                    )}
                   >
                     <Code className="w-3.5 h-3.5 mr-2 opacity-60" />
                     <span className="flex-1 truncate">{file.name}</span>
                     <button 
                      onClick={(e) => { e.stopPropagation(); closeTab(tabId); }}
                      className="ml-2 p-0.5 rounded-full hover:bg-slate-700 opacity-0 group-hover:opacity-100 transition-opacity"
                     >
                       <X className="w-3 h-3 text-slate-400" />
                     </button>
                   </div>
                 );
               })}
             </div>

             {/* Monaco Editor */}
             <div className="flex-1 relative">
               {activeFile ? (
                 <Editor
                   theme={settings.theme}
                   language={activeFile.language}
                   value={activeFile.content}
                   onChange={handleEditorChange}
                   options={{
                     fontSize: settings.fontSize,
                     fontFamily: settings.fontFamily,
                     minimap: { enabled: settings.minimap },
                     wordWrap: settings.wordWrap,
                     lineHeight: settings.lineHeight * settings.fontSize,
                     tabSize: settings.tabSize,
                     scrollBeyondLastLine: false,
                     automaticLayout: true,
                     padding: { top: 16 },
                     glyphMargin: true,
                     folding: true,
                     lineNumbers: 'on',
                     renderWhitespace: 'none',
                     cursorBlinking: 'smooth',
                     cursorSmoothCaretAnimation: 'on',
                     smoothScrolling: true,
                     bracketPairColorization: { enabled: true },
                   }}
                 />
               ) : (
                 <div className="h-full flex flex-col items-center justify-center text-slate-500 p-8 text-center">
                    <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mb-4 text-slate-600">
                      <Layout className="w-8 h-8" />
                    </div>
                    <h3 className="font-semibold text-slate-300">No file open</h3>
                    <p className="text-xs max-w-[200px] mt-2">Select a file from the explorer to start coding.</p>
                 </div>
               )}
             </div>
          </div>

          {/* Preview Container */}
          <AnimatePresence>
            {previewOpen && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex-1 flex flex-col min-w-0"
              >
                <LivePreview 
                  html={htmlFile?.content || ''}
                  css={cssFile?.content || ''}
                  js={jsFile?.content || ''}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* Mobile Activity Bar (Bottom) */}
      <aside className="h-14 border-t border-slate-800 bg-slate-900/90 backdrop-blur-md flex items-center justify-around px-4 sm:hidden z-50">
        <ActivityIcon 
          icon={Files} 
          active={activeTab === 'explorer'} 
          onClick={() => { setActiveTab('explorer'); setIsMobileMenuOpen(true); }} 
        />
        <ActivityIcon 
          icon={Code} 
          active={!isMobileMenuOpen && !previewOpen} 
          onClick={() => { setIsMobileMenuOpen(false); setPreviewOpen(false); }} 
        />
        <ActivityIcon 
          icon={Play} 
          active={previewOpen} 
          onClick={() => { setPreviewOpen(true); setIsMobileMenuOpen(false); }} 
        />
        <ActivityIcon 
          icon={Sparkles} 
          active={activeTab === 'toolbox'} 
          onClick={() => { setActiveTab('toolbox'); setIsMobileMenuOpen(true); }} 
        />
        <ActivityIcon 
          icon={Settings} 
          active={activeTab === 'settings'} 
          onClick={() => { setActiveTab('settings'); setIsMobileMenuOpen(true); }} 
        />
      </aside>

      {/* Mobile Menu Backdrop */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] lg:hidden"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              className="fixed inset-y-0 left-0 w-80 bg-slate-900 z-[70] lg:hidden border-r border-slate-800 shadow-2xl"
            >
              <div className="h-full flex flex-col">
                <div className="p-4 border-b border-slate-800 flex justify-between items-center">
                   <h2 className="font-bold text-sky-400 capitalize">{activeTab}</h2>
                   <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-slate-400">
                     <X className="w-5 h-5" />
                   </button>
                </div>
                <div className="flex-1 overflow-hidden">
                   {activeTab === 'explorer' && (
                      <FileExplorer 
                        files={project.files}
                        activeFileId={activeFileId}
                        onFileClick={(id) => { openFile(id); setIsMobileMenuOpen(false); }}
                        onFileCreate={createFile}
                        onFileDelete={deleteFile}
                        onFileRename={renameFile}
                      />
                   )}
                   {activeTab === 'toolbox' && <Toolbox />}
                   {activeTab === 'settings' && (
                     <div className="p-4">
                        <p className="text-slate-500 text-xs italic">Mobile settings simplified...</p>
                        {/* Add settings items here if needed */}
                     </div>
                   )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Status Bar */}
      <footer className="h-6 bg-slate-900 border-t border-slate-800 flex items-center justify-between px-3 text-[10px] text-slate-500 select-none">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-emerald-500">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span>System Online</span>
          </div>
          <div className="flex items-center gap-1">
             <Terminal className="w-3 h-3" />
             <span>master*</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
           {activeFile && (
             <>
               <span>Ln {activeFile.content?.split('\n').length || 1}, Col 1</span>
               <span>{activeFile.language?.toUpperCase()}</span>
               <span>UTF-8</span>
             </>
           )}
           <div className="flex items-center gap-1">
             <Zap className="w-3 h-3 text-amber-500" />
             <span>Premium Studio</span>
           </div>
        </div>
      </footer>
    </div>
  );
}

const ActivityIcon = ({ icon: Icon, active, onClick }: { icon: any, active: boolean, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className={cn(
      "p-2.5 rounded-xl transition-all duration-300 relative group",
      active ? "text-sky-400 bg-sky-500/10 shadow-[0_0_20px_rgba(56,189,248,0.15)]" : "text-slate-500 hover:text-slate-300 hover:bg-slate-800"
    )}
  >
    <Icon className="w-5 h-5" />
    {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-sky-500 rounded-r-full"></div>}
    
    {/* Tooltip */}
    <div className="absolute left-full ml-4 px-2 py-1 bg-slate-800 text-slate-200 text-[10px] rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-xl border border-slate-700">
       {Icon.name}
    </div>
  </button>
);

const SettingItem = ({ label, children }: { label: string, children: React.ReactNode }) => (
  <div className="space-y-2">
    <div className="flex justify-between items-center text-[10px] font-semibold text-slate-500 tracking-wider">
      {label}
    </div>
    {children}
  </div>
);
