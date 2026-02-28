import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { get, set } from 'idb-keyval';

const FileSystemContext = createContext(null);

const IDB_KEY = 'vault-directory-handle';

/**
 * Recursively traverses a FileSystemDirectoryHandle and returns a nested tree.
 */
async function buildFileTree(dirHandle, path = '') {
    const children = [];

    for await (const [name, handle] of dirHandle.entries()) {
        const entryPath = path ? `${path}/${name}` : name;

        if (handle.kind === 'directory') {
            const subtree = await buildFileTree(handle, entryPath);
            children.push({
                name,
                kind: 'directory',
                path: entryPath,
                handle,
                children: subtree,
            });
        } else {
            children.push({
                name,
                kind: 'file',
                path: entryPath,
                handle,
            });
        }
    }

    // Sort: directories first, then files. Alphabetical within each group.
    children.sort((a, b) => {
        if (a.kind !== b.kind) return a.kind === 'directory' ? -1 : 1;
        return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
    });

    return children;
}

export function FileSystemProvider({ children }) {
    const [rootHandle, setRootHandle] = useState(null);
    const [fileTree, setFileTree] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [previousVault, setPreviousVault] = useState(null);

    /**
     * Refresh the file tree from the current root handle.
     */
    const refreshTree = useCallback(async (handle) => {
        if (!handle) return;
        try {
            const tree = await buildFileTree(handle);
            setFileTree(tree);
        } catch (err) {
            console.error('Failed to build file tree:', err);
        }
    }, []);

    /**
     * On mount, try to restore the previously saved directory handle from IndexedDB.
     */
    useEffect(() => {
        (async () => {
            try {
                const storedHandle = await get(IDB_KEY);
                if (storedHandle) {
                    // queryPermission does not require a user gesture, unlike requestPermission
                    const permission = await storedHandle.queryPermission({ mode: 'readwrite' });
                    if (permission === 'granted') {
                        setRootHandle(storedHandle);
                        await refreshTree(storedHandle);
                        setIsLoading(false); // Fix: Ensure loading state is turned off
                        return;
                    } else if (permission === 'prompt') {
                        // Store it so we can show a "Restore Previous Vault" button
                        setPreviousVault(storedHandle);
                    }
                }
            } catch (err) {
                console.warn('Could not restore directory handle:', err);
            }
            setIsLoading(false);
        })();
    }, [refreshTree]);

    /**
     * Prompt the user to pick a directory, store its handle, and scan it.
     */
    const pickDirectory = useCallback(async () => {
        if (!window.showDirectoryPicker) {
            alert(
                "Your browser doesn't support the local File System Access API.\n\n" +
                "This feature is currently only supported in Chromium-based browsers (Chrome, Edge, Opera) on desktop."
            );
            return;
        }

        try {
            const handle = await window.showDirectoryPicker({ mode: 'readwrite' });
            await set(IDB_KEY, handle);
            setRootHandle(handle);
            await refreshTree(handle);
        } catch (err) {
            // User cancelled the picker
            if (err.name !== 'AbortError') {
                console.error('Error picking directory:', err);
            }
        }
    }, [refreshTree]);

    /**
     * Read the text content of a file handle.
     */
    const readFile = useCallback(async (fileHandle) => {
        const file = await fileHandle.getFile();
        return await file.text();
    }, []);

    /**
     * Write text content to a file handle.
     */
    const writeFile = useCallback(async (fileHandle, content) => {
        const writable = await fileHandle.createWritable();
        await writable.write(content);
        await writable.close();
    }, []);

    /**
     * Create a new file inside a directory handle.
     * Returns the new file handle.
     */
    const createFile = useCallback(async (parentDirHandle, fileName) => {
        const fileHandle = await parentDirHandle.getFileHandle(fileName, { create: true });
        // Write empty content to initialize
        const writable = await fileHandle.createWritable();
        await writable.write('');
        await writable.close();
        // Refresh the tree to reflect the new file
        await refreshTree(rootHandle);
        return fileHandle;
    }, [rootHandle, refreshTree]);

    /**
     * Create a new folder inside a directory handle.
     * Returns the new directory handle.
     */
    const createFolder = useCallback(async (parentDirHandle, folderName) => {
        const dirHandle = await parentDirHandle.getDirectoryHandle(folderName, { create: true });
        // Refresh the tree to reflect the new folder
        await refreshTree(rootHandle);
        return dirHandle;
    }, [rootHandle, refreshTree]);

    /**
     * Look for an 'Assets' folder in the root and try to get a file blob URL.
     * Returns null if folder or file is not found.
     */
    const getAssetUrl = useCallback(async (fileName) => {
        if (!rootHandle) return null;
        try {
            const assetsDir = await rootHandle.getDirectoryHandle('Assets');
            const fileHandle = await assetsDir.getFileHandle(fileName);
            const file = await fileHandle.getFile();
            return URL.createObjectURL(file);
        } catch (err) {
            // Folder or file doesn't exist
            return null;
        }
    }, [rootHandle]);

    /**
     * Save a Blob to the 'Assets' folder. Creates the folder if it doesn't exist.
     */
    const saveAsset = useCallback(async (fileName, blob) => {
        if (!rootHandle) throw new Error('No vault open');

        // Ensure "Assets" folder exists
        let assetsDir;
        try {
            assetsDir = await rootHandle.getDirectoryHandle('Assets', { create: true });
        } catch (err) {
            console.error('Could not create/access Assets folder:', err);
            throw err;
        }

        // Create file and write blob
        const fileHandle = await assetsDir.getFileHandle(fileName, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(blob);
        await writable.close();

        // Refresh file explorer to show new asset
        await refreshTree(rootHandle);
    }, [rootHandle, refreshTree]);

    /**
     * Restore the previous vault by requesting permission with a user gesture
     */
    const restoreVault = useCallback(async () => {
        if (!previousVault) return;
        try {
            const permission = await previousVault.requestPermission({ mode: 'readwrite' });
            if (permission === 'granted') {
                setRootHandle(previousVault);
                setIsLoading(true);
                await refreshTree(previousVault);
                setPreviousVault(null);
                setIsLoading(false);
            }
        } catch (err) {
            console.error('Error restoring vault permission:', err);
        }
    }, [previousVault, refreshTree]);

    const value = {
        rootHandle,
        fileTree,
        isLoading,
        previousVault,
        pickDirectory,
        readFile,
        writeFile,
        createFile,
        createFolder,
        getAssetUrl,
        saveAsset,
        restoreVault,
        refreshTree: () => refreshTree(rootHandle),
    };

    return (
        <FileSystemContext.Provider value={value}>
            {children}
        </FileSystemContext.Provider>
    );
}

export function useFileSystem() {
    const context = useContext(FileSystemContext);
    if (!context) {
        throw new Error('useFileSystem must be used within a FileSystemProvider');
    }
    return context;
}
