export function initHighlight() {
    console.log("highlight");
    // 存储当前高亮信息，用于清除旧高亮
    let currentHighlight = {
        text: null as null | string,
        spans: [] as HTMLElement[],
    };

    // let isMouseDown = false;
    // let mouseDownElement: HTMLElement | null = null;
    // // 监听鼠标按下事件
    // document.addEventListener("mousedown", (event) => {
    //     isMouseDown = true;
    //     mouseDownElement = event.target as HTMLElement;
    // });

    // // 监听鼠标移动事件
    // document.addEventListener("mousemove", () => {
    //     if (isMouseDown) {
    //         switchHighlight();
    //     }
    // });

    // 监听鼠标释放事件
    document.addEventListener("mouseup", () => {
        // isMouseDown = false;
        switchHighlight();
    });
    function switchHighlight() {
        console.log("switchHighlight");
        const selectedText = getSelectedText();
        console.log("selectedText", selectedText);
        if (selectedText.length === 1 && /[a-zA-Z0-9]/.test(selectedText)) {
            return;
        }
        if (selectedText === "") {
            removeExistingHighlights();
            currentHighlight.text = selectedText;
        }
        if (selectedText && selectedText !== currentHighlight.text) {
            console.log(selectedText, currentHighlight.text);
            // 清除旧高亮
            removeExistingHighlights();
            // 高亮新内容
            highlightAllOccurrences(selectedText);
            currentHighlight.text = selectedText;
        }
    }

    function getSelectedText(): string {
        // 获取选中的文本
        console.log("getSelectedText");
        const selection = window.getSelection();
        return selection?.toString().trim() || "";
    }

    function highlightAllOccurrences(text: string) {
        // 高亮所有匹配的文本
        console.log("highlightAllOccurrences", text);
        observer.disconnect();
        const textNodes = getTextNodes();
        const lowerCaseText = text.toLowerCase();

        textNodes.forEach((node) => {
            highlightTextInNode(node, lowerCaseText);
        });

        observer.observe(document.body, { childList: true, subtree: true });
    }

    function getTextNodes(): Text[] {
        console.log("getTextNodes");
        // 获取要处理的nodes
        const textNodes: Text[] = [];
        const walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: (node: Node) => {
                    if (
                        node.parentElement &&
                        [
                            "input",
                            "textarea",
                            "select",
                            "button",
                            "script",
                            "style",
                        ].includes(node.parentElement.tagName.toLowerCase())
                    ) {
                        return NodeFilter.FILTER_SKIP;
                    }
                    return NodeFilter.FILTER_ACCEPT;
                },
            }
        );
        let node;
        while ((node = walker.nextNode()) !== null) {
            if (node.nodeType === Node.TEXT_NODE) {
                // if (
                //     mouseDownElement &&
                //     node.parentElement &&
                //     node.parentElement.contains(mouseDownElement)
                // ) {
                //     continue;
                // }
                textNodes.push(node as Text);
            }
        }
        return textNodes;
    }

    function highlightTextInNode(node: Text, lowerCaseText: string) {
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

            const span = document.createElement("span");
            span.className = "bread-highlight";
            span.textContent = highlightedNode.textContent;
            // span.style.border = "2px solid rgb(255, 153, 0)";
            // span.style.boxSizing = "border-box";
            span.style.backgroundColor = "rgba(255, 153, 0, 0.5)";
            span.style.display = "inline";
            span.style.lineHeight = "inherit"; // 继承行高
            span.style.verticalAlign = "baseline";

            highlightedNode.parentNode?.replaceChild(span, highlightedNode);

            currentHighlight.spans.push(span);

            lowerCaseNodeText = afterHighlight.textContent?.toLowerCase() || "";
            node = afterHighlight;
            startIdx = 0;
        }
    }
    // 清除现有高亮
    function removeExistingHighlights() {
        console.log("removeExistingHighlights");
        currentHighlight.spans.forEach((span) => {
            const parent = span.parentNode;
            parent?.replaceChild(
                document.createTextNode(
                    span.textContent ? span.textContent : ""
                ),
                span
            );
            parent?.normalize(); // 合并相邻文本节点
        });
        currentHighlight.spans = [];
    }

    // 监听动态内容变化
    const observer = new MutationObserver((mutations) => {
        if (currentHighlight.text) {
            // 重新高亮以覆盖新内容
            removeExistingHighlights();
            highlightAllOccurrences(currentHighlight.text);
        }
    });
}
