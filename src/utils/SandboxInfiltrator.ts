export class SandboxInfiltrator {
    static init(iframeElement: HTMLIFrameElement, onElementBounds: (bounds: DOMRect) => void) {
        window.addEventListener('message', (event) => {
            if (event.data && event.data.type === 'DOM_ELEMENT_BOUNDS') {
                const bounds = event.data.bounds;
                const iframeRect = iframeElement.getBoundingClientRect();
                const globalBounds = {
                    left: bounds.left + iframeRect.left,
                    top: bounds.top + iframeRect.top,
                    right: bounds.right + iframeRect.left,
                    bottom: bounds.bottom + iframeRect.top,
                    width: bounds.width,
                    height: bounds.height
                } as DOMRect;
                onElementBounds(globalBounds);
            }
        });
    }
    static injectIframeScript() {
        return `
            document.addEventListener('click', (e) => {
                const target = e.target;
                if (target) {
                    const bounds = target.getBoundingClientRect();
                    window.parent.postMessage({
                        type: 'DOM_ELEMENT_BOUNDS',
                        bounds: {
                            left: bounds.left,
                            top: bounds.top,
                            right: bounds.right,
                            bottom: bounds.bottom,
                            width: bounds.width,
                            height: bounds.height
                        }
                    }, '*');
                }
            });
        `;
    }
}
