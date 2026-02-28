import { EditorState } from "@codemirror/state"
import { markdown, markdownLanguage } from "@codemirror/lang-markdown"
import { syntaxTree } from "@codemirror/language"

const state = EditorState.create({
    doc: "Hello **bold**",
    extensions: [markdown({ base: markdownLanguage })]
})

let output = "";
syntaxTree(state).iterate({
    enter(node) {
        if (node.name === 'EmphasisMark') {
            const parent = node.node.parent;
            output += `Parent of ${node.name} is ${parent ? parent.name : 'null'} from ${parent.from} to ${parent.to}\n`;
        }
    }
})
console.log(output);
