import { EditorState } from "@codemirror/state"
import { markdown, markdownLanguage } from "@codemirror/lang-markdown"
import { syntaxTree } from "@codemirror/language"

const state = EditorState.create({
    doc: "Hello **bold** and *italic* and ***both***",
    extensions: [markdown({ base: markdownLanguage })]
})

let output = "";
syntaxTree(state).iterate({
    enter(node) {
        output += `${node.name} ${node.from} ${node.to} ${JSON.stringify(state.doc.sliceString(node.from, node.to))}\n`;
    }
})
console.log(output);
