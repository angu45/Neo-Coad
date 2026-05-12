import React, { useEffect, useRef, useState } from 'react';
import { Play, RefreshCw, Smartphone, Tablet, Monitor, ExternalLink, XCircle } from 'lucide-react';
import { cn } from '../lib/utils';

interface LivePreviewProps {
  html: string;
  css: string;
  js: string;
  className?: string;
}

type DeviceType = 'mobile' | 'tablet' | 'desktop';

export const LivePreview: React.FC<LivePreviewProps> = ({ html, css, js, className }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [device, setDevice] = useState<DeviceType>('desktop');
  const [key, setKey] = useState(0); // For forced refresh
  const [consoleLogs, setConsoleLogs] = useState<{ type: string; msg: string }[]>([]);

  const generateSource = () => {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>${css}</style>
          <script>
            const oldLog = console.log;
            const oldError = console.error;
            const oldWarn = console.warn;
            
            console.log = (...args) => {
              window.parent.postMessage({ type: 'console', method: 'log', data: args.join(' ') }, '*');
              oldLog(...args);
            };
            console.error = (...args) => {
              window.parent.postMessage({ type: 'console', method: 'error', data: args.join(' ') }, '*');
              oldError(...args);
            };
            console.warn = (...args) => {
              window.parent.postMessage({ type: 'console', method: 'warn', data: args.join(' ') }, '*');
              oldWarn(...args);
            };

            window.onerror = (msg, url, line, col, error) => {
              window.parent.postMessage({ type: 'console', method: 'error', data: msg + ' (line ' + line + ')' }, '*');
              return false;
            };
          </script>
        </head>
        <body>
          ${html}
          <script>${js}<\/script>
        </body>
      </html>
    `;
  };

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'console') {
        setConsoleLogs(prev => [...prev, { type: event.data.method, msg: event.data.data }].slice(-20));
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const refresh = () => setKey(prev => prev + 1);

  const deviceWidths = {
    mobile: 'max-w-[375px]',
    tablet: 'max-w-[768px]',
    desktop: 'max-w-full'
  };

  return (
    <div className={cn("flex flex-col h-full bg-[#0f172a] border-l border-slate-800", className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <Play className="w-4 h-4 text-emerald-400 fill-emerald-400" />
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Live Preview</span>
        </div>
        
        <div className="flex items-center gap-1 bg-slate-800/50 p-1 rounded-lg">
          <button 
            onClick={() => setDevice('mobile')}
            className={cn("p-1 rounded transition-colors", device === 'mobile' ? "bg-slate-700 text-sky-400" : "text-slate-500 hover:text-slate-300")}
          >
            <Smartphone className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setDevice('tablet')}
            className={cn("p-1 rounded transition-colors", device === 'tablet' ? "bg-slate-700 text-sky-400" : "text-slate-500 hover:text-slate-300")}
          >
            <Tablet className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setDevice('desktop')}
            className={cn("p-1 rounded transition-colors", device === 'desktop' ? "bg-slate-700 text-sky-400" : "text-slate-500 hover:text-slate-300")}
          >
            <Monitor className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={refresh} className="p-1.5 rounded hover:bg-slate-800 text-slate-400 transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button className="p-1.5 rounded hover:bg-slate-800 text-slate-400 transition-colors">
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Frame Container */}
      <div className="flex-1 overflow-auto p-4 flex justify-center bg-slate-950/50 dot-pattern">
        <div className={cn("w-full h-full bg-white shadow-2xl transition-all duration-300 overflow-hidden rounded-sm", deviceWidths[device])}>
          <iframe
            key={key}
            ref={iframeRef}
            srcDoc={generateSource()}
            className="w-full h-full border-none"
            title="preview"
            sandbox="allow-scripts allow-modals"
          />
        </div>
      </div>

      {/* Console Area */}
      <div className="h-32 border-t border-slate-800 bg-slate-900/80 backdrop-blur-md overflow-hidden flex flex-col">
        <div className="px-3 py-1 border-b border-slate-800 flex justify-between items-center">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Console Output</span>
          <button onClick={() => setConsoleLogs([])} className="text-slate-500 hover:text-slate-300">
            <XCircle className="w-3 h-3" />
          </button>
        </div>
        <div className="flex-1 overflow-auto p-2 font-mono text-xs space-y-1">
          {consoleLogs.length === 0 ? (
            <div className="text-slate-600 italic">No logs yet...</div>
          ) : (
            consoleLogs.map((log, i) => (
              <div key={i} className={cn(
                "flex gap-2",
                log.type === 'error' ? "text-rose-400" : log.type === 'warn' ? "text-amber-400" : "text-slate-300"
              )}>
                <span className="opacity-50">[{new Date().toLocaleTimeString().split(' ')[0]}]</span>
                <span>{log.msg}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
