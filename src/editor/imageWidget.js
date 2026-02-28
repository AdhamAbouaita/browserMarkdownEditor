import { WidgetType } from '@codemirror/view';

export class ImageWidget extends WidgetType {
    constructor(filename, width, getAssetUrl) {
        super();
        this.filename = filename;
        this.width = width;
        this.getAssetUrl = getAssetUrl;
    }

    eq(other) {
        return (
            other.filename === this.filename &&
            other.width === this.width &&
            other.getAssetUrl === this.getAssetUrl
        );
    }

    toDOM() {
        const container = document.createElement('span');
        container.className = 'cm-image-widget';

        const wrapper = document.createElement('span');
        wrapper.className = 'cm-image-wrapper';

        // Show a loading text while we see if the file exists
        const img = document.createElement('img');
        img.style.display = 'none';

        const placeholder = document.createElement('span');
        placeholder.className = 'cm-image-placeholder';
        placeholder.textContent = `Loading ${this.filename}...`;

        wrapper.appendChild(placeholder);
        wrapper.appendChild(img);
        container.appendChild(wrapper);

        this.getAssetUrl(this.filename).then((url) => {
            if (url) {
                img.src = url;
                img.style.display = 'block';
                // Apply width if provided (e.g. 200 from | 200)
                if (this.width) {
                    img.style.width = this.width + 'px';
                }
                placeholder.style.display = 'none';
            } else {
                placeholder.textContent = `Image not found: ${this.filename}`;
                placeholder.classList.add('error');
            }
        });

        return container;
    }
}
