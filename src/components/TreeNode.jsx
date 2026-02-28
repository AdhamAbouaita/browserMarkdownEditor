import React, { useState } from 'react';
import { ChevronRight, ChevronDown, FileText, FolderIcon, FilePlus, FolderPlus } from './icons.jsx';

export default function TreeNode({ node, activeFilePath, onFileClick, onCreateFile, onCreateFolder, depth = 0 }) {
    const [expanded, setExpanded] = useState(false);

    const isActive = node.kind === 'file' && node.path === activeFilePath;
    const paddingLeft = 12 + depth * 16;

    if (node.kind === 'file') {
        return (
            <div
                className={`tree-item tree-file${isActive ? ' is-active' : ''}`}
                style={{ paddingLeft }}
                onClick={() => onFileClick(node)}
            >
                <span className="tree-item-icon file-icon">
                    <FileText size={14} />
                </span>
                <span className="tree-item-label">{node.name}</span>
            </div>
        );
    }

    return (
        <div className="tree-item-container">
            <div
                className="tree-item tree-folder"
                style={{ paddingLeft }}
                onClick={() => setExpanded(!expanded)}
            >
                <span className="tree-item-chevron">
                    {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                </span>
                <span className="tree-item-icon folder-icon">
                    <FolderIcon size={14} />
                </span>
                <span className="tree-item-label">{node.name}</span>
                <span className="tree-item-actions">
                    <button
                        className="tree-action-btn"
                        title="New file"
                        onClick={(e) => { e.stopPropagation(); onCreateFile(node.handle, node.path); }}
                    >
                        <FilePlus size={14} />
                    </button>
                    <button
                        className="tree-action-btn"
                        title="New folder"
                        onClick={(e) => { e.stopPropagation(); onCreateFolder(node.handle, node.path); }}
                    >
                        <FolderPlus size={14} />
                    </button>
                </span>
            </div>
            {expanded && node.children && (
                <div className="tree-children">
                    {node.children.map((child) => (
                        <TreeNode
                            key={child.path}
                            node={child}
                            activeFilePath={activeFilePath}
                            onFileClick={onFileClick}
                            onCreateFile={onCreateFile}
                            onCreateFolder={onCreateFolder}
                            depth={depth + 1}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
