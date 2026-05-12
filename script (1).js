/**
 * Nexus IDE - Script Core
 * Advanced Frontend Code Editor
 */

const DEFAULT_FILES = {
    'index.html': {
        name: 'index.html',
        content: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nexus New Project</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div id="app">
        <h1>Welcome to Nexus IDE</h1>
        <p>Edit this project in real-time.</p>
        <div class="circle"></div>
    </div>
    <script src="script.js"></script>
</body>
</html>`,
        type: 'html'
    },
    'style.css': {
        name: 'style.css',
        content: `body {
    background: #121212;
    color: white;
    font-family: system-ui, sans-serif;
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    margin: 0;
}
#app {
    text-align: center;
    padding: 2rem;
    background: rgba(255,255,255,0.05);
    border-radius: 20px;
    backdrop-filter: blur(10px);
}
.circle {
    width: 100px;
    height: 100px;
    background: linear-gradient(45deg, #3b82f6, #8b5cf6);
    border-radius: 50%;
    margin: 2rem auto;
    animation: rotate 4s linear infinite;
}
@keyframes rotate {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}`,
        type: 'css'
    },
    'script.js': {
        name: 'script.js',
        content: `console.log("Nexus IDE: Live Preview Started");

const app = document.getElementById('app');
app.addEventListener('click', () => {
    alert('Nexus IDE: Interaction detected!');
});`,
        type: 'js'
    }
};

class FileSystem {
    constructor() {
        this.files = JSON.parse(localStorage.getItem('nexus_fs')) || DEFAULT_FILES;
        this.save();
    }

    save() {
        localStorage.setItem('nexus_fs', JSON.stringify(this.files));
    }

    getFile(name) {
        return this.files[name];
    }

    updateFile(name, content) {
        if (this.files[name]) {
            this.files[name].content = content;
            this.save();
        }
    }

    createFile(name) {
        const ext = name.split('.').pop();
        this.files[name] = {
            name,
            content: '',
            type: ext
        };
        this.save();
        return this.files[name];
    }

    deleteFile(name) {
        delete this.files[name];
        this.save();
    }

    renameFile(oldName, newName) {
        if (this.files[oldName]) {
            this.files[newName] = this.files[oldName];
            this.files[newName].name = newName;
            delete this.files[oldName];
            this.save();
        }
    }
}

class EditorManager {
    constructor(nexus) {
        this.nexus = nexus;
        this.editor = null;
        this.currentModel = null;
        this.models = {};
        this.init();
    }

    init() {
        require.config({ paths: { vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs' } });
        require(['vs/editor/editor.main'], () => {
            this.editor = monaco.editor.create(document.getElementById('monaco-editor-host'), {
                theme: 'vs-dark',
                automaticLayout: true,
                fontSize: 14,
                fontFamily: 'JetBrains Mono',
                minimap: { enabled: true },
                wordWrap: 'on',
                smoothScrolling: true,
                cursorBlinking: 'smooth',
                cursorSmoothCaretAnimation: true,
                padding: { top: 20 },
                bracketPairColorization: { enabled: true },
            });

            this.editor.onDidChangeModelContent(() => {
                if (this.currentModel) {
                    const content = this.editor.getValue();
                    this.nexus.fs.updateFile(this.currentModel.fileName, content);
                    if (this.nexus.preview.autoRefresh) this.nexus.preview.run();
                }
            });

            this.editor.onDidChangeCursorPosition((e) => {
                const info = document.getElementById('editor-info');
                info.innerText = `Ln ${e.position.lineNumber}, Col ${e.position.column}`;
            });

            // Load initial file
            this.openFile('index.html');
            this.nexus.onEditorReady();
        });
    }

    openFile(name) {
        const file = this.nexus.fs.getFile(name);
        if (!file) return;

        let model = this.models[name];
        if (!model) {
            const lang = this.getLanguage(file.type);
            model = monaco.editor.createModel(file.content, lang);
            model.fileName = name;
            this.models[name] = model;
        }

        this.currentModel = model;
        this.editor.setModel(model);
        document.getElementById('lang-selector').innerText = this.getLanguage(file.type).toUpperCase();
        
        // Update Tabs
        this.nexus.tabs.setActive(name);
    }

    getLanguage(type) {
        const map = { 'html': 'html', 'css': 'css', 'js': 'javascript', 'json': 'json', 'md': 'markdown' };
        return map[type] || 'plaintext';
    }

    setTheme(theme) {
        monaco.editor.setTheme(theme);
    }

    updateOptions(options) {
        this.editor.updateOptions(options);
    }
}

class PreviewManager {
    constructor(nexus) {
        this.nexus = nexus;
        this.autoRefresh = true;
        this.panel = document.getElementById('preview-panel');
        this.iframe = document.getElementById('preview-iframe');
        this.isOpen = false;
    }

    run() {
        if (!this.isOpen) return;
        
        const html = this.nexus.fs.getFile('index.html')?.content || '';
        const css = this.nexus.fs.getFile('style.css')?.content || '';
        const js = this.nexus.fs.getFile('script.js')?.content || '';

        const fullHTML = `
            <!DOCTYPE html>
            <html>
                <head>
                    <style>${css}</style>
                </head>
                <body>
                    ${html}
                    <script>${js}<\/script>
                </body>
            </html>
        `;

        const blob = new Blob([fullHTML], { type: 'text/html' });
        this.iframe.src = URL.createObjectURL(blob);
    }

    toggle() {
        this.isOpen = !this.isOpen;
        if (this.isOpen) {
            this.panel.classList.remove('w-0');
            this.panel.classList.add('w-[40%]');
            document.getElementById('preview-resizer').classList.remove('hidden');
            this.run();
        } else {
            this.panel.classList.add('w-0');
            this.panel.classList.remove('w-[40%]');
            document.getElementById('preview-resizer').classList.add('hidden');
        }
    }

    setDevice(device) {
        const frame = document.getElementById('preview-device-frame');
        frame.className = 'bg-white shadow-2xl transition-all duration-500 overflow-hidden relative ' + `preview-${device}`;
        
        // Update buttons
        document.querySelectorAll('[data-device]').forEach(btn => {
            if (btn.dataset.device === device) {
                btn.classList.add('bg-white/10', 'text-white');
                btn.classList.remove('text-gray-500');
            } else {
                btn.classList.remove('bg-white/10', 'text-white');
                btn.classList.add('text-gray-500');
            }
        });
    }
}

class TabManager {
    constructor(nexus) {
        this.nexus = nexus;
        this.tabs = []; // Track open file names
    }

    addTab(name) {
        if (this.tabs.includes(name)) return;
        this.tabs.push(name);
        this.render();
    }

    setActive(name) {
        this.addTab(name);
        this.render(name);
    }

    removeTab(name, e) {
        if (e) e.stopPropagation();
        this.tabs = this.tabs.filter(t => t !== name);
        if (this.tabs.length > 0) {
            this.nexus.editor.openFile(this.tabs[this.tabs.length - 1]);
        }
        this.render();
    }

    render(activeName) {
        const container = document.getElementById('tab-bar');
        container.innerHTML = '';
        this.tabs.forEach(name => {
            const tab = document.createElement('div');
            tab.className = `tab ${name === activeName ? 'active' : ''}`;
            tab.innerHTML = `
                <i data-lucide="file-code" class="w-3.5 h-3.5 tree-file-icon ${name.split('.').pop()}"></i>
                <span>${name}</span>
                <i data-lucide="x" class="tab-close w-3 h-3"></i>
            `;
            tab.onclick = () => this.nexus.editor.openFile(name);
            tab.querySelector('.tab-close').onclick = (e) => this.removeTab(name, e);
            container.appendChild(tab);
        });
        lucide.createIcons();
    }
}

class NexusIDE {
    constructor() {
        this.fs = new FileSystem();
        this.tabs = new TabManager(this);
        this.preview = new PreviewManager(this);
        this.editor = new EditorManager(this);
        
        this.currentView = 'explorer';
        this.isDark = true;
        
        this.initUI();
    }

    onEditorReady() {
        this.renderFileTree();
        this.showNotification('Welcome back, Developer!');
    }

    initUI() {
        lucide.createIcons();

        // Run Button
        document.getElementById('run-btn').onclick = () => this.preview.toggle();
        document.getElementById('preview-close').onclick = () => this.preview.toggle();
        document.getElementById('preview-refresh').onclick = () => this.preview.run();

        // Device Selection
        document.querySelectorAll('[data-device]').forEach(btn => {
            btn.onclick = () => this.preview.setDevice(btn.dataset.device);
        });

        // Sidebar View Switching
        document.querySelectorAll('[data-view]').forEach(btn => {
            btn.onclick = () => this.switchView(btn.dataset.view);
        });

        // Theme Toggle
        document.getElementById('theme-toggle').onclick = () => this.toggleTheme();

        // Menu Dropdowns
        document.querySelectorAll('nav button').forEach(btn => {
            btn.onclick = (e) => this.showMenu(e, btn.innerText);
        });

        // Settings Modal
        const overlay = document.getElementById('modal-overlay');
        const modal = document.getElementById('settings-modal');
        document.getElementById('settings-btn').onclick = () => {
            overlay.classList.remove('hidden');
            setTimeout(() => {
                modal.classList.remove('hidden', 'scale-95', 'opacity-0');
                modal.classList.add('scale-100', 'opacity-100');
            }, 10);
        };

        const closeModal = () => {
            modal.classList.add('scale-95', 'opacity-0');
            setTimeout(() => {
                modal.classList.add('hidden');
                overlay.classList.add('hidden');
            }, 300);
        };

        document.querySelectorAll('.modal-close').forEach(b => b.onclick = closeModal);
        overlay.onclick = (e) => { if (e.target === overlay) closeModal(); };

        // File Operations
        document.getElementById('new-file-btn').onclick = () => {
            const name = prompt('File name:');
            if (name) {
                this.fs.createFile(name);
                this.renderFileTree();
                this.editor.openFile(name);
            }
        };

        document.getElementById('new-folder-btn').onclick = () => {
            const name = prompt('Folder name:');
            if (name) {
                this.showNotification(`Created folder: ${name}`);
                // Simulated folder support
            }
        };

        document.getElementById('explorer-refresh-btn').onclick = () => {
            this.renderFileTree();
            this.showNotification('File explorer refreshed');
        };

        // Settings Listeners
        document.getElementById('setting-font-size').onchange = (e) => {
            this.editor.updateOptions({ fontSize: parseInt(e.target.value) });
        };

        document.getElementById('setting-minimap').onchange = (e) => {
            this.editor.updateOptions({ minimap: { enabled: e.target.checked } });
        };

        document.getElementById('setting-wordwrap').onchange = (e) => {
            this.editor.updateOptions({ wordWrap: e.target.checked ? 'on' : 'off' });
        };

        // Export
        document.getElementById('share-btn').onclick = () => this.exportProject();

        // Mobile Tools
        const mobileTools = document.querySelectorAll('#mobile-tools button');
        if (mobileTools[0]) mobileTools[0].onclick = () => this.preview.toggle();
        if (mobileTools[1]) mobileTools[1].onclick = () => {
            const console = document.getElementById('console-panel');
            console.classList.toggle('active');
            console.style.transform = console.classList.contains('active') ? 'translateY(0)' : 'translateY(100%)';
        };

        // Account / User button
        document.querySelectorAll('[data-view="account"]').forEach(btn => {
            btn.onclick = () => this.showNotification('User profile settings');
        });

        // Resizer Logic
        const resizer = document.getElementById('preview-resizer');
        const panel = document.getElementById('preview-panel');
        let isResizing = false;

        resizer.addEventListener('mousedown', () => isResizing = true);
        window.addEventListener('mousemove', (e) => {
            if (!isResizing) return;
            const containerWidth = window.innerWidth;
            const width = ((containerWidth - e.clientX) / containerWidth) * 100;
            if (width > 10 && width < 80) {
                panel.style.width = `${width}%`;
            }
        });
        window.addEventListener('mouseup', () => isResizing = false);
    }

    switchView(view) {
        // Toggle Panel
        const panel = document.getElementById('activity-panel');
        if (this.currentView === view && !panel.classList.contains('collapsed')) {
            panel.classList.add('collapsed');
            return;
        }

        panel.classList.remove('collapsed');
        this.currentView = view;

        // Hide all views
        ['explorer', 'search', 'git', 'extensions'].forEach(v => {
            const el = document.getElementById(`${v}-view`);
            if (el) el.classList.add('hidden');
        });

        // Show target view
        const targetView = document.getElementById(`${view}-view`);
        if (targetView) targetView.classList.remove('hidden');

        // Update active sidebar button
        document.querySelectorAll('[data-view]').forEach(btn => {
            if (btn.dataset.view === view) {
                btn.classList.add('text-blue-500', 'bg-blue-500/10', 'border', 'border-blue-500/20');
                btn.classList.remove('text-gray-500');
            } else {
                btn.classList.remove('text-blue-500', 'bg-blue-500/10', 'border', 'border-blue-500/20');
                btn.classList.add('text-gray-500');
            }
        });
    }

    toggleTheme() {
        this.isDark = !this.isDark;
        const root = document.documentElement;
        if (this.isDark) {
            root.classList.add('dark');
            this.editor.setTheme('vs-dark');
            document.getElementById('theme-toggle').innerHTML = '<i data-lucide="moon" class="w-5 h-5"></i>';
        } else {
            root.classList.remove('dark');
            this.editor.setTheme('vs');
            document.getElementById('theme-toggle').innerHTML = '<i data-lucide="sun" class="w-5 h-5"></i>';
        }
        lucide.createIcons();
    }

    showMenu(e, type) {
        const menus = {
            'File': ['New File', 'New Window', 'Open...', 'Save', 'Save As...', 'Export Project'],
            'Edit': ['Undo', 'Redo', 'Cut', 'Copy', 'Paste', 'Find', 'Replace'],
            'View': ['Explorer', 'Search', 'Git', 'Extensions', 'Output', 'Terminal'],
            'Help': ['Welcome', 'Documentation', 'Keyboard Shortcuts', 'Release Notes', 'About']
        };

        const items = menus[type] || ['Command 1', 'Command 2'];
        
        // Remove existing menu
        const oldMenu = document.getElementById('active-menu');
        if (oldMenu) oldMenu.remove();

        const menu = document.createElement('div');
        menu.id = 'active-menu';
        menu.className = 'fixed bg-[#1e1e1e] border border-white/10 rounded-lg shadow-2xl py-1 z-[200] min-w-[160px] animate-in fade-in zoom-in-95 duration-100';
        menu.style.top = `${e.target.getBoundingClientRect().bottom + 5}px`;
        menu.style.left = `${e.target.getBoundingClientRect().left}px`;

        items.forEach(item => {
            const b = document.createElement('button');
            b.className = 'w-full px-3 py-1.5 text-left text-xs hover:bg-blue-600 hover:text-white transition-colors';
            b.innerText = item;
            b.onclick = () => {
                this.showNotification(`Executed: ${item}`);
                menu.remove();
            };
            menu.appendChild(b);
        });

        document.body.appendChild(menu);

        // Close on click outside
        const listener = (event) => {
            if (!menu.contains(event.target) && event.target !== e.target) {
                menu.remove();
                document.removeEventListener('click', listener);
            }
        };
        setTimeout(() => document.addEventListener('click', listener), 10);
    }

    renderFileTree() {
        const container = document.getElementById('file-tree');
        container.innerHTML = '';
        Object.keys(this.fs.files).sort().forEach(name => {
            const item = document.createElement('div');
            item.className = 'tree-item';
            const ext = name.split('.').pop();
            item.innerHTML = `
                <i data-lucide="file-code" class="tree-file-icon ${ext}"></i>
                <span>${name}</span>
            `;
            item.onclick = () => this.editor.openFile(name);
            container.appendChild(item);
        });
        lucide.createIcons();
    }

    showNotification(msg) {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.innerHTML = `
            <div class="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400">
                <i data-lucide="info" class="w-4 h-4"></i>
            </div>
            <div class="text-xs font-semibold">${msg}</div>
        `;
        container.appendChild(toast);
        lucide.createIcons();
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    exportProject() {
        const data = JSON.stringify(this.fs.files, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'nexus_project.json';
        a.click();
        this.showNotification('Project exported as JSON');
    }
}

// Global Terminal Simulation
window.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === '`') {
        const console = document.getElementById('console-panel');
        console.classList.toggle('active');
        console.style.transform = console.classList.contains('active') ? 'translateY(0)' : 'translateY(100%)';
    }
    
    // Command Palette Simulation
    if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        e.preventDefault();
        const cmd = prompt('Command Palette - Enter command:');
        if (cmd) {
            window.nexus.showNotification(`Running command: ${cmd}`);
        }
    }
});

// Initialize the IDE
window.nexus = new NexusIDE();
