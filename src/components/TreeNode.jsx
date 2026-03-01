import React, { useState } from 'react';
import { ChevronRight, ChevronDown, FileText, FolderIcon, FilePlus, FolderPlus, Trash2 } from './icons.jsx';

export default function TreeNode({ node, activeFilePath, onFileClick, onCreateFile, onCreateFolder, onTrash, expandedPaths, onToggleExpand, onMoveFile, depth = 0 }) {
    const isActive = node.kind === 'file' && node.path === activeFilePath;
    const paddingLeft = 12 + depth * 16;
    const expanded = expandedPaths.has(node.path);
    const [dragOver, setDragOver] = useState(false);

    // ── Drag handlers ──
    const handleDragStart = (e) => {
        e.stopPropagation();
        e.dataTransfer.setData('text/plain', node.path);
        e.dataTransfer.effectAllowed = 'move';
        // Store the node in a module-level variable since dataTransfer can't hold objects
        TreeNode._draggedNode = node;
    };

    const handleDragOver = (e) => {
        if (node.kind !== 'directory') return;
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'move';
        setDragOver(true);
    };

    const handleDragLeave = (e) => {
        e.stopPropagation();
        setDragOver(false);
    };

    const handleDrop = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOver(false);

        const draggedNode = TreeNode._draggedNode;
        if (!draggedNode) return;
        TreeNode._draggedNode = null;

        // Don't drop into itself or its own parent
        if (draggedNode.path === node.path) return;
        // Don't drop a folder into its own descendant
        if (node.path.startsWith(draggedNode.path + '/')) return;

        if (onMoveFile) {
            await onMoveFile(draggedNode, node.handle);
        }
    };

    const handleDragEnd = () => {
        TreeNode._draggedNode = null;
    };

    if (node.kind === 'file') {
        return (
            <div
                className={`tree-item tree-file${isActive ? ' is-active' : ''}`}
                style={{ paddingLeft }}
                onClick={() => onFileClick(node)}
                draggable
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <span className="tree-item-icon file-icon">
                    <FileText size={14} />
                </span>
                <span className="tree-item-label">{node.name}</span>
                <span className="tree-item-actions">
                    <button
                        className="tree-action-btn trash-btn"
                        title="Move to Trash"
                        onClick={(e) => { e.stopPropagation(); onTrash(node); }}
                    >
                        <Trash2 size={13} />
                    </button>
                </span>
            </div>
        );
    }

    return (
        <div className="tree-item-container">
            <div
                className={`tree-item tree-folder${dragOver ? ' drag-over' : ''}`}
                style={{ paddingLeft }}
                onClick={() => onToggleExpand(node.path)}
                draggable
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
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
                            onTrash={onTrash}
                            expandedPaths={expandedPaths}
                            onToggleExpand={onToggleExpand}
                            onMoveFile={onMoveFile}
                            depth={depth + 1}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

// Module-level storage for the dragged node reference
TreeNode._draggedNode = null;
