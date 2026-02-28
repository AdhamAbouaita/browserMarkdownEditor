#!/usr/bin/env node

/**
 * Chrome Native Messaging Host for Markdown Editor.
 *
 * Chrome communicates via stdin/stdout using length-prefixed JSON messages.
 * Message format: 4-byte little-endian length prefix followed by UTF-8 JSON.
 */

const fs = require('fs');
const path = require('path');

// ── Read a native message from stdin ──
function readMessage() {
    return new Promise((resolve, reject) => {
        const header = Buffer.alloc(4);
        let bytesRead = 0;

        const readHeader = () => {
            const chunk = process.stdin.read(4 - bytesRead);
            if (!chunk) {
                process.stdin.once('readable', readHeader);
                return;
            }
            chunk.copy(header, bytesRead);
            bytesRead += chunk.length;
            if (bytesRead < 4) {
                process.stdin.once('readable', readHeader);
                return;
            }
            const msgLen = header.readUInt32LE(0);
            if (msgLen === 0) {
                resolve(null);
                return;
            }
            readBody(msgLen);
        };

        const readBody = (msgLen) => {
            let body = Buffer.alloc(0);
            const readChunk = () => {
                const chunk = process.stdin.read(msgLen - body.length);
                if (chunk) {
                    body = Buffer.concat([body, chunk]);
                }
                if (body.length < msgLen) {
                    process.stdin.once('readable', readChunk);
                    return;
                }
                try {
                    resolve(JSON.parse(body.toString('utf-8')));
                } catch (e) {
                    reject(e);
                }
            };
            readChunk();
        };

        readHeader();
    });
}

// ── Write a native message to stdout ──
function sendMessage(msg) {
    const json = JSON.stringify(msg);
    const buf = Buffer.from(json, 'utf-8');
    const header = Buffer.alloc(4);
    header.writeUInt32LE(buf.length, 0);
    process.stdout.write(header);
    process.stdout.write(buf);
}

// ── Recursively list a directory ──
function listDirectory(dirPath) {
    const entries = [];
    try {
        const items = fs.readdirSync(dirPath, { withFileTypes: true });
        // Sort: folders first, then alphabetical
        items.sort((a, b) => {
            if (a.isDirectory() && !b.isDirectory()) return -1;
            if (!a.isDirectory() && b.isDirectory()) return 1;
            return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
        });
        for (const item of items) {
            if (item.name.startsWith('.')) continue; // Skip hidden files
            const fullPath = path.join(dirPath, item.name);
            if (item.isDirectory()) {
                entries.push({
                    name: item.name,
                    path: fullPath,
                    type: 'directory',
                    children: listDirectory(fullPath),
                });
            } else if (item.name.endsWith('.md')) {
                entries.push({
                    name: item.name,
                    path: fullPath,
                    type: 'file',
                });
            }
        }
    } catch (e) {
        // Permission error or similar — return empty
    }
    return entries;
}

// ── Handle incoming messages ──
async function handleMessage(msg) {
    try {
        switch (msg.type) {
            case 'listDirectory': {
                const tree = listDirectory(msg.path);
                sendMessage({ id: msg.id, success: true, tree });
                break;
            }

            case 'readFile': {
                const content = fs.readFileSync(msg.path, 'utf-8');
                sendMessage({ id: msg.id, success: true, content });
                break;
            }

            case 'writeFile': {
                fs.writeFileSync(msg.path, msg.content, 'utf-8');
                sendMessage({ id: msg.id, success: true });
                break;
            }

            case 'createFile': {
                const filePath = path.join(msg.parentPath, msg.name);
                fs.writeFileSync(filePath, '', 'utf-8');
                sendMessage({ id: msg.id, success: true, path: filePath });
                break;
            }

            case 'createFolder': {
                const folderPath = path.join(msg.parentPath, msg.name);
                fs.mkdirSync(folderPath, { recursive: true });
                sendMessage({ id: msg.id, success: true, path: folderPath });
                break;
            }

            default:
                sendMessage({ id: msg.id, success: false, error: `Unknown type: ${msg.type}` });
        }
    } catch (e) {
        sendMessage({ id: msg.id, success: false, error: e.message });
    }
}

// ── Main loop ──
async function main() {
    process.stdin.resume();
    while (true) {
        try {
            const msg = await readMessage();
            if (msg === null) break;
            await handleMessage(msg);
        } catch (e) {
            break;
        }
    }
}

main();
