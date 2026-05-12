/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  parentId: string | null;
  content?: string;
  language?: string;
  isOpen?: boolean;
}

export type EditorTheme = 'vs-dark' | 'light';

export interface EditorSettings {
  fontSize: number;
  fontFamily: string;
  theme: EditorTheme;
  wordWrap: 'on' | 'off';
  minimap: boolean;
  autoSave: boolean;
  tabSize: number;
  lineHeight: number;
  accentColor: string;
}

export interface ProjectData {
  id: string;
  name: string;
  files: FileNode[];
  lastOpenedFileId: string | null;
  openTabs: string[];
}
