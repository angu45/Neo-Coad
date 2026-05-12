import React, { useState } from 'react';
import { Palette, Layers, Sparkles, Box, Scissors, Copy, Check } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

export const Toolbox: React.FC = () => {
  const [activeTool, setActiveTool] = useState<'gradient' | 'shadow' | 'radius'>('gradient');
  const [copied, setCopied] = useState(false);

  const [gradient, setGradient] = useState({ 
    start: '#38bdf8', 
    end: '#a78bfa', 
    angle: 45 
  });

  const [shadow, setShadow] = useState({
    x: 0, y: 10, blur: 20, spread: -5, opacity: 0.3, color: '#000000'
  });

  const [radius, setRadius] = useState(16);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const gradientCode = `background: linear-gradient(${gradient.angle}deg, ${gradient.start}, ${gradient.end});`;
  const shadowCode = `box-shadow: ${shadow.x}px ${shadow.y}px ${shadow.blur}px ${shadow.spread}px ${shadow.color}${Math.round(shadow.opacity * 255).toString(16).padStart(2, '0')};`;
  const radiusCode = `border-radius: ${radius}px;`;

  return (
    <div className="flex flex-col h-full bg-[#1e293b] overflow-hidden">
      <div className="p-4 border-b border-slate-700">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Design Tools</h2>
        <div className="flex gap-1 bg-slate-900 rounded-lg p-1">
          <ToolTab 
            icon={Palette} 
            active={activeTool === 'gradient'} 
            onClick={() => setActiveTool('gradient')} 
          />
          <ToolTab 
            icon={Layers} 
            active={activeTool === 'shadow'} 
            onClick={() => setActiveTool('shadow')} 
          />
          <ToolTab 
            icon={Box} 
            active={activeTool === 'radius'} 
            onClick={() => setActiveTool('radius')} 
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {activeTool === 'gradient' && (
          <div className="space-y-4">
            <div 
              className="h-24 rounded-xl shadow-inner mb-6" 
              style={{ background: `linear-gradient(${gradient.angle}deg, ${gradient.start}, ${gradient.end})` }}
            />
            
            <ToolSlider label="Angle" min={0} max={360} value={gradient.angle} onChange={(v) => setGradient({...gradient, angle: v})} />
            
            <div className="grid grid-cols-2 gap-4">
              <ToolColor label="Start Color" value={gradient.start} onChange={(v) => setGradient({...gradient, start: v})} />
              <ToolColor label="End Color" value={gradient.end} onChange={(v) => setGradient({...gradient, end: v})} />
            </div>

            <CodeBlock code={gradientCode} onCopy={() => copyToClipboard(gradientCode)} copied={copied} />
          </div>
        )}

        {activeTool === 'shadow' && (
          <div className="space-y-4">
            <div className="h-24 bg-white rounded-xl flex items-center justify-center mb-6">
               <div className="w-12 h-12 bg-sky-500 rounded-lg" style={{ 
                 boxShadow: `${shadow.x}px ${shadow.y}px ${shadow.blur}px ${shadow.spread}px ${shadow.color}${Math.round(shadow.opacity * 255).toString(16).padStart(2, '0')}` 
               }} />
            </div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-4">
              <ToolSlider label="Horizontal" min={-50} max={50} value={shadow.x} onChange={(v) => setShadow({...shadow, x: v})} />
              <ToolSlider label="Vertical" min={-50} max={50} value={shadow.y} onChange={(v) => setShadow({...shadow, y: v})} />
              <ToolSlider label="Blur" min={0} max={100} value={shadow.blur} onChange={(v) => setShadow({...shadow, blur: v})} />
              <ToolSlider label="Spread" min={-50} max={50} value={shadow.spread} onChange={(v) => setShadow({...shadow, spread: v})} />
            </div>

            <CodeBlock code={shadowCode} onCopy={() => copyToClipboard(shadowCode)} copied={copied} />
          </div>
        )}

        {activeTool === 'radius' && (
          <div className="space-y-4">
             <div className="h-24 bg-slate-800 rounded-xl flex items-center justify-center mb-6">
               <div className="w-16 h-16 bg-sky-500 border border-sky-400" style={{ borderRadius: `${radius}px` }} />
            </div>

            <ToolSlider label="All Corners" min={0} max={100} value={radius} onChange={(v) => setRadius(v)} />

            <CodeBlock code={radiusCode} onCopy={() => copyToClipboard(radiusCode)} copied={copied} />
          </div>
        )}
      </div>
    </div>
  );
};

const ToolTab = ({ icon: Icon, active, onClick }: { icon: any, active: boolean, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className={cn(
      "flex-1 p-2 rounded-md transition-all flex items-center justify-center",
      active ? "bg-slate-800 text-sky-400 shadow-sm" : "text-slate-500 hover:text-slate-300"
    )}
  >
    <Icon className="w-4 h-4" />
  </button>
);

const ToolSlider = ({ label, min, max, value, onChange }: { label: string, min: number, max: number, value: number, onChange: (v: number) => void }) => (
  <div className="space-y-1">
    <div className="flex justify-between text-[10px] text-slate-500">
      <span>{label}</span>
      <span>{value}px</span>
    </div>
    <input 
      type="range" min={min} max={max} value={value} 
      onChange={(e) => onChange(parseInt(e.target.value))}
      className="w-full h-1 bg-slate-800 appearance-none cursor-pointer accent-sky-500"
    />
  </div>
);

const ToolColor = ({ label, value, onChange }: { label: string, value: string, onChange: (v: string) => void }) => (
  <div className="space-y-1">
    <span className="text-[10px] text-slate-500 block">{label}</span>
    <div className="flex items-center gap-2">
      <input 
        type="color" value={value} 
        onChange={(e) => onChange(e.target.value)}
        className="w-8 h-8 rounded bg-transparent border-none cursor-pointer"
      />
      <span className="text-[10px] font-mono text-slate-300">{value.toUpperCase()}</span>
    </div>
  </div>
);

const CodeBlock = ({ code, onCopy, copied }: { code: string, onCopy: () => void, copied: boolean }) => (
  <div className="mt-6 relative">
    <pre className="p-3 bg-slate-950 rounded-lg text-[10px] font-mono text-emerald-400 overflow-x-auto border border-slate-800">
      {code}
    </pre>
    <button 
      onClick={onCopy}
      className="absolute top-2 right-2 p-1.5 rounded bg-slate-800 text-slate-400 hover:text-white transition-colors border border-slate-700"
    >
      {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
    </button>
  </div>
);
