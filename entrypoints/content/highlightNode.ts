import { getTextNodes } from "./kit/getNodes";
/**
 * HighlightFeature 类用于管理和执行文本高亮功能
 */
class HighlightFeature {
    // 当前高亮的文本及其对应的HTML元素
    private currentHighlight = {
        text: "" as string,
        spans: [] as HTMLElement[],
    };

    constructor() {
        //绑定switchHighlight方法，以确保其在事件监听器中的this指向正确
        this.switchHighlight = this.switchHighlight.bind(this);
    }

    public start(): void {
        console.log("highlight start");
        document.addEventListener("mouseup", this.switchHighlight);
    }

    public stop(): void {
        console.log("highlight stop");
        document.removeEventListener("mouseup", this.switchHighlight);
        this.removeExistingHighlights();
    }

    /**
     * 移除已存在的高亮
     * 此方法旨在清除当前所有已高亮的文本，通过替换高亮文本的节点为普通文本节点来实现
     */
    private removeExistingHighlights() {
        console.log("removeExistingHighlights");
        // 遍历当前所有的高亮文本节点
        this.currentHighlight.spans.forEach((span) => {
            // 获取当前高亮文本节点的父节点
            const parent = span.parentNode;
            // 用新的文本节点替换当前高亮文本节点
            parent?.replaceChild(
                document.createTextNode(
                    span.textContent ? span.textContent : ""
                ),
                span
            );
            // 合并相邻文本节点，优化DOM结构
            parent?.normalize();
        });
        // 重置高亮文本节点数组为空
        this.currentHighlight.spans = [];
    }

    /**
     * 高亮指定节点内所有匹配的文本
     *
     * 该方法会遍历给定根节点下的所有可见文本节点，并对每个文本节点中匹配当前高亮文本的内容进行高亮处理。
     *
     * @param root - 指定的根节点，默认为文档的body元素。从该节点开始查找并高亮匹配的文本。
     */
    public highlightTextNodes(root: Node = document.body) {
        // 打印当前高亮的文本内容，用于调试
        console.log("highlight-", this.currentHighlight.text);

        // 获取根节点下的所有可见文本节点
        const textNodes = getTextNodes(root);
        // 将当前高亮文本转换为小写形式，以便进行大小写不敏感的匹配
        const lowerCaseText = this.currentHighlight.text.toLowerCase();

        // 遍历每个文本节点，并在其中高亮匹配的文本
        textNodes.forEach((node) => {
            this.highlightTextInNode(node, lowerCaseText);
        });
    }
    /**
     * 在指定的文本节点中高亮所有匹配的文本
     *
     * @param node - 要处理的文本节点
     * @param lowerCaseText - 要高亮的文本（小写形式）
     */
    private highlightTextInNode(node: Text, lowerCaseText: string) {
        const textLength = lowerCaseText.length;
        let nodeText = node.textContent || "";
        let lowerCaseNodeText = nodeText.toLowerCase();
        let startIdx = 0;

        while (
            (startIdx = lowerCaseNodeText.indexOf(lowerCaseText, startIdx)) !==
            -1
        ) {
            if (node.length < startIdx) break;

            const beforeSplit = node.splitText(startIdx);
            const afterHighlight = beforeSplit.splitText(textLength);
            const highlightedNode = beforeSplit;

            const span = createSpanElement(highlightedNode.textContent || "");

            highlightedNode.parentNode?.replaceChild(span, highlightedNode);

            this.currentHighlight.spans.push(span);

            lowerCaseNodeText = afterHighlight.textContent?.toLowerCase() || "";
            node = afterHighlight;
            startIdx = 0;
        }
    }

    /**
     * 切换高亮状态以响应用户选择的文本
     *
     * 此方法在用户释放鼠标按钮时触发，用于判断当前选中的文本是否需要被高亮显示。
     * 如果选中的文本符合高亮条件，则移除已有的高亮并应用新的高亮。
     */
    private switchHighlight() {
        console.log("switchHighlight");

        // 提取选中的文本内容
        const selectedText = getSelectedText();
        console.log("selectedText", selectedText);

        /**
         * 如果选中的文本只有一个字符且是字母或数字，则不进行高亮
         * 这是为了避免对单个字符的误操作（如光标定位或误选）
         */
        if (selectedText.length === 1 && /[a-zA-Z0-9]/.test(selectedText)) {
            return;
        }

        /**
         * 如果选中的文本与当前高亮的文本不同，则更新高亮状态
         * 1. 移除已有的高亮
         * 2. 更新当前高亮的文本
         * 3. 对新选中的文本应用高亮
         */
        if (selectedText !== this.currentHighlight.text) {
            // 移除已有的高亮
            this.removeExistingHighlights();
            // 更新当前高亮的文本为用户选中的文本
            this.currentHighlight.text = selectedText;

            // 如果有选中的文本，则对其进行高亮处理
            if (selectedText) {
                this.highlightTextNodes();
            }
        }
    }
}
export const highlightFeature = new HighlightFeature();

/**
 * 创建一个带有高亮样式的span元素
 *
 * 该函数用于创建一个新的span元素，并为其设置特定的样式和类名
 * 以便在页面中高亮显示文本
 *
 * @param textContent - span元素的文本内容
 * @returns 返回一个带有高亮样式的span元素
 */
function createSpanElement(textContent: string): HTMLElement {
    //return document.createElement("span");
    const span = document.createElement("span");
    span.className = "bread-highlight";
    span.textContent = textContent;
    // span.style.border = "2px solid rgb(255, 153, 0)";
    // span.style.boxSizing = "border-box";
    span.style.backgroundColor = "rgba(255, 153, 0, 0.5)";
    span.style.display = "inline";
    span.style.lineHeight = "inherit"; // 继承行高
    span.style.verticalAlign = "baseline";
    return span;
}

/**
 * 获取当前选中的文本
 *
 * 此函数的目的是从给定的Selection对象中提取选中的文本并返回
 * 如果没有选中的文本或者selection对象为空，则返回空字符串
 *
 * @returns 返回选中的文本，如果无文本被选中则返回空字符串
 */
function getSelectedText(): string {
    // 获取当前用户选中的内容
    const selection = window.getSelection();
    // 检查是否有选中的文本，如果没有则直接返回
    if (!selection) return "";
    return selection.toString().trim() || "";
}
