export class ShadowBreaker {
    static deepQuerySelectorAll(selector: string, root: Document | Element | ShadowRoot = document): Element[] {
        const results: Element[] = [];
        const traverse = (node: Element | ShadowRoot | Document) => {
            if ('querySelectorAll' in node) {
                const matches = node.querySelectorAll(selector);
                matches.forEach((m: Element) => results.push(m));
            }
            if ('children' in node) {
                const children = node.children;
                for (let i = 0; i < children.length; i++) {
                    traverse(children[i]);
                }
            }
            if ('shadowRoot' in node && node.shadowRoot) {
                traverse(node.shadowRoot);
            }
        };
        traverse(root);
        return results;
    }
}
