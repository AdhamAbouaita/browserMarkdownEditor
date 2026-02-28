import { WidgetType } from '@codemirror/view';

/**
 * A simple horizontal rule widget.
 */
export class HorizontalRuleWidget extends WidgetType {
    eq() { return true; }

    toDOM() {
        const el = document.createElement('div');
        el.className = 'cm-hr-widget';
        return el;
    }

    ignoreEvent() { return false; }
}
