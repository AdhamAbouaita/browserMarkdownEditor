import React, { useState, useRef, useEffect } from 'react';
import TreeNode from './TreeNode.jsx';
import { FilePlus, FolderPlus, FolderOpen } from './icons.jsx';

export default function FileExplorer({
    rootHandle,
    fileTree,
    activeFilePath,
    onFileClick,
    onCreateFile,
    onCreateFolder,
    onChangeVault,
    onTrash,
    expandedPaths,
    onToggleExpand,
    onMoveFile
}) {
    const [creatingInRoot, setCreatingInRoot] = useState(null); // 'file' | 'folder' | null
    const inputRef = useRef(null);

    useEffect(() => {
        if (creatingInRoot && inputRef.current) {
            inputRef.current.focus();
        }
    }, [creatingInRoot]);

    const handleRootCreate = async (e) => {
        if (e.key === 'Enter') {
            const name = e.target.value.trim();
            if (!name) {
                setCreatingInRoot(null);
                return;
            }
            if (creatingInRoot === 'file') {
                await onCreateFile(rootHandle, name);
            } else {
                await onCreateFolder(rootHandle, name);
            }
            setCreatingInRoot(null);
        } else if (e.key === 'Escape') {
            setCreatingInRoot(null);
        }
    };

    const handleRootCreateBlur = () => {
        setCreatingInRoot(null);
    };

    return (
        <div className="file-explorer">
            <div className="nav-header">
                <span className="nav-header-title">
                    {rootHandle ? rootHandle.name : 'Explorer'}
                </span>
                <div className="nav-header-actions">
                    <button
                        className="nav-action-btn"
                        title="New note"
                        onClick={() => setCreatingInRoot('file')}
                    >
                        <FilePlus size={15} />
                    </button>
                    <button
                        className="nav-action-btn"
                        title="New folder"
                        onClick={() => setCreatingInRoot('folder')}
                    >
                        <FolderPlus size={15} />
                    </button>
                    <button
                        className="nav-action-btn"
                        title="Open another vault"
                        onClick={onChangeVault}
                    >
                        <FolderOpen size={15} />
                    </button>
                </div>
            </div>

            <div className="nav-files-container">
                {creatingInRoot && (
                    <div className="tree-item tree-inline-input" style={{ paddingLeft: 12 }}>
                        <input
                            ref={inputRef}
                            className="inline-rename-input"
                            type="text"
                            placeholder={creatingInRoot === 'file' ? 'Untitled.md' : 'New folder'}
                            onKeyDown={handleRootCreate}
                            onBlur={handleRootCreateBlur}
                        />
                    </div>
                )}
                {fileTree.map((node) => (
                    <TreeNode
                        key={node.path}
                        node={node}
                        activeFilePath={activeFilePath}
                        onFileClick={onFileClick}
                        onCreateFile={(handle, _path) => {
                            const name = prompt('Enter file name (e.g. "note.md"):');
                            if (name) onCreateFile(handle, name);
                        }}
                        onCreateFolder={(handle, _path) => {
                            const name = prompt('Enter folder name:');
                            if (name) onCreateFolder(handle, name);
                        }}
                        onTrash={onTrash}
                        expandedPaths={expandedPaths}
                        onToggleExpand={onToggleExpand}
                        onMoveFile={onMoveFile}
                    />
                ))}
            </div>
        </div>
    );
}
