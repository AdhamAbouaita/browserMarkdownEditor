import { keymap } from '@codemirror/view';

/**
 * Wraps the current selection with a delimiter (e.g., `**` for bold, `*` for italic).
 * If no selection, inserts the delimiters and places the cursor between them.
 */
function wrapSelection(view, delimiter) {
    const { state } = view;
    const { from, to } = state.selection.main;

    if (from === to) {
        // No selection — insert delimiters and place cursor in the middle
        const insert = delimiter + delimiter;
        view.dispatch({
            changes: { from, to, insert },
            selection: { anchor: from + delimiter.length },
        });
    } else {
        // Wrap selection
        const selected = state.doc.sliceString(from, to);
        const wrapped = delimiter + selected + delimiter;
        view.dispatch({
            changes: { from, to, insert: wrapped },
            selection: { anchor: from + delimiter.length, head: from + delimiter.length + selected.length },
        });
    }
    return true;
}

/**
 * Markdown formatting keybindings:
 * - Cmd+B  → bold  (**selection**)
 * - Cmd+I  → italic (*selection*)
 */
export const markdownFormatKeymap = keymap.of([
    {
        key: 'Mod-b',
        run: (view) => wrapSelection(view, '**'),
    },
    {
        key: 'Mod-i',
        run: (view) => wrapSelection(view, '*'),
    },
]);
