import { useState, useEffect, useCallback } from 'react';
import { FileNode, ProjectData } from '../types';

const STORAGE_KEY = 'neoncode_project_v1';

const DEFAULT_FILES: FileNode[] = [
  {
    id: '1',
    name: 'index.html',
    type: 'file',
    parentId: null,
    language: 'html',
    content: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Project</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div class="container">
        <h1>NeonCode Studio</h1>
        <p>Start editing index.html to see changes!</p>
        <button id="click-me">Click Me</button>
    </div>
    <script src="script.js"></script>
</body>
</html>`
  },
  {
    id: '2',
    name: 'style.css',
    type: 'file',
    parentId: null,
    language: 'css',
    content: `body {
    background: #0f172a;
    color: #f8fafc;
    font-family: system-ui, sans-serif;
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    margin: 0;
}

.container {
    text-align: center;
    padding: 2rem;
    background: rgba(30, 41, 59, 0.5);
    backdrop-filter: blur(10px);
    border-radius: 1rem;
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
}

h1 {
    color: #38bdf8;
    text-shadow: 0 0 20px rgba(56, 189, 248, 0.4);
}

button {
    background: #38bdf8;
    color: #0f172a;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 0.5rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
}

button:hover {
    transform: translateY(-2px);
    box-shadow: 0 0 15px rgba(56, 189, 248, 0.6);
}`
  },
  {
    id: '3',
    name: 'script.js',
    type: 'file',
    parentId: null,
    language: 'javascript',
    content: `document.getElementById('click-me').addEventListener('click', () => {
    alert('Hello from NeonCode Studio!');
    console.log('Button clicked!');
});`
  }
];

export function useFileSystem() {
  const [project, setProject] = useState<ProjectData>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved project', e);
      }
    }
    return {
      id: 'default',
      name: 'Default Project',
      files: DEFAULT_FILES,
      lastOpenedFileId: '1',
      openTabs: ['1', '2', '3']
    };
  });

  const [activeFileId, setActiveFileId] = useState<string | null>(project.lastOpenedFileId);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
  }, [project]);

  const updateFileContent = useCallback((id: string, content: string) => {
    setProject(prev => ({
      ...prev,
      files: prev.files.map(f => f.id === id ? { ...f, content } : f)
    }));
  }, []);

  const createFile = useCallback((name: string, type: 'file' | 'folder', parentId: string | null = null) => {
    const id = Math.random().toString(36).substr(2, 9);
    const extension = name.split('.').pop();
    let language = 'plaintext';
    if (extension === 'html') language = 'html';
    if (extension === 'css') language = 'css';
    if (extension === 'js') language = 'javascript';
    if (extension === 'json') language = 'json';
    if (extension === 'md') language = 'markdown';

    const newFile: FileNode = {
      id,
      name,
      type,
      parentId,
      content: type === 'file' ? '' : undefined,
      language: type === 'file' ? language : undefined
    };

    setProject(prev => ({
      ...prev,
      files: [...prev.files, newFile]
    }));

    return id;
  }, []);

  const deleteFile = useCallback((id: string) => {
    setProject(prev => ({
      ...prev,
      files: prev.files.filter(f => f.id !== id && f.parentId !== id),
      openTabs: prev.openTabs.filter(tabId => tabId !== id)
    }));
    if (activeFileId === id) {
      setActiveFileId(null);
    }
  }, [activeFileId]);

  const renameFile = useCallback((id: string, newName: string) => {
    setProject(prev => ({
      ...prev,
      files: prev.files.map(f => f.id === id ? { ...f, name: newName } : f)
    }));
  }, []);

  const openFile = useCallback((id: string) => {
    setProject(prev => ({
      ...prev,
      lastOpenedFileId: id,
      openTabs: prev.openTabs.includes(id) ? prev.openTabs : [...prev.openTabs, id]
    }));
    setActiveFileId(id);
  }, []);

  const closeTab = useCallback((id: string) => {
    setProject(prev => {
      const newTabs = prev.openTabs.filter(tabId => tabId !== id);
      const newActiveId = activeFileId === id 
        ? (newTabs.length > 0 ? newTabs[newTabs.length - 1] : null)
        : activeFileId;
      
      setActiveFileId(newActiveId);
      return {
        ...prev,
        openTabs: newTabs,
        lastOpenedFileId: newActiveId
      };
    });
  }, [activeFileId]);

  return {
    project,
    activeFileId,
    setActiveFileId,
    updateFileContent,
    createFile,
    deleteFile,
    renameFile,
    openFile,
    closeTab,
    setProject
  };
}
