// highlightNodeV3.ts

interface TextNodeEntry {
    node: Text;
    start: number;
    end: number;
}

const EXCLUDED_TAGS = new Set([
    "input",
    "textarea",
    "select",
    "button",
    "script",
    "style",
    "noscript",
    "template",
]);

interface GetTextNodesOptions {
    excludeHidden?: boolean; // 是否排除隐藏元素
    minContentLength?: number; // 最小文本长度要求
}

/**
 * 获取指定根节点下所有符合条件的文本节点
 *
 * @param root - 遍历的起始根节点，默认为document.body
 * @param options - 配置选项对象
 * @param options.excludeHidden - 是否排除隐藏元素（默认true）
 * @param options.minContentLength - 文本内容的最小长度要求（默认1）
 * @returns 符合过滤条件的文本节点数组
 *
 * 功能说明：
 * 1. 自动排除预定义的非内容型标签（input/textarea等）
 * 2. 可选过滤隐藏元素（通过CSS计算样式判断）
 * 3. 过滤空白内容及满足最小长度要求的文本
 */
function getTextNodes(
    root: Node = document.body,
    options: GetTextNodesOptions = {}
): { texts: TextNodeEntry[]; mergedText: string } {
    // 合并默认配置选项
    const { excludeHidden = true, minContentLength = 1 } = options;

    // 创建TreeWalker进行节点遍历，配置复合过滤条件
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
        acceptNode: (node: Node) => {
            const parent = node.parentElement;
            if (!parent) return NodeFilter.FILTER_ACCEPT;

            /* 过滤逻辑分三个层级处理 */
            // 1. 标签名称过滤：直接拒绝整个子树
            if (EXCLUDED_TAGS.has(parent.tagName.toLowerCase())) {
                return NodeFilter.FILTER_REJECT;
            }

            // 2. 可见性过滤：根据计算样式判断元素是否隐藏
            if (excludeHidden) {
                const style = window.getComputedStyle(parent);
                if (style.display === "none" || style.visibility === "hidden") {
                    return NodeFilter.FILTER_REJECT;
                }
            }

            // 3. 内容过滤：检查文本内容长度是否达标
            const content = node.textContent?.trim() || "";
            if (content.length < minContentLength) {
                return NodeFilter.FILTER_SKIP;
            }

            return NodeFilter.FILTER_ACCEPT;
        },
    });
    const texts: TextNodeEntry[] = [];
    let offset = 0;

    // 遍历收集所有符合条件的文本节点
    while (walker.nextNode()) {
        const node = walker.currentNode as Text;
        const text = node.textContent || "";
        texts.push({
            node,
            start: offset,
            end: offset + text.length,
        });
        offset += text.length;
    }

    return {
        texts,
        mergedText: texts
            .map((n) => n.node.textContent?.toLowerCase())
            .join(""),
    };
}

let lastSelectedText = "";
export function highlightNode(root: Node = document.body) {
    removeHighlights();
    const text = getSelectedText();
    if (text !== "" && text !== lastSelectedText) {
        lastSelectedText = text;

        // 获取根节点下的所有文本节点及合并后的完整文本
        let { texts, mergedText } = getTextNodes(root);

        console.table(
            texts.map((t) => ({
                ...t,
                text: t.node.textContent, // 新增text列显示节点文本内容
            }))
        );
        console.info(mergedText);

        if (texts.length > 0 && text !== "") {
            // 查找所有匹配的文本位置
            const matches = findMatches(mergedText, text);

            // 新增过滤逻辑：排除当前选中文本对应的匹配项
            const filteredMatches = matches.filter(
                (m) => !isInSelection(m, texts, window.getSelection())
            );

            console.table(
                matches.map((m) => ({
                    ...m,
                    text: mergedText.substring(m.start, m.end),
                }))
            );

            highlightMatches(texts, filteredMatches);
        } else {
            return;
        }
    }
}

export function removeHighlights() {
    // 查找所有高亮元素
    document.querySelectorAll<HTMLSpanElement>(".highlight").forEach((span) => {
        // 创建新的文本节点替代高亮元素
        const text = document.createTextNode(span.textContent || "");
        span.parentNode?.replaceChild(text, span);
    });
}

/**
 * 判断匹配项是否在当前选中的文本范围内
 *
 * @param match - 需要检查的匹配范围
 * @param texts - 文本节点位置信息数组
 * @param selection - 当前文档选区对象
 * @returns 如果匹配项在选区内返回true，否则false
 */
function isInSelection(
    match: MatchRange,
    texts: TextNodeEntry[],
    selection: Selection | null
): boolean {
    if (!selection || selection.rangeCount === 0) return false;

    // 获取第一个选区范围（通常只有一个）
    const range = selection.getRangeAt(0);
    const { startContainer, startOffset, endContainer, endOffset } = range;

    // 查找选区起始节点对应的全局偏移
    const findGlobalOffset = (node: Node, offset: number): number => {
        const entry = texts.find((t) => t.node === node);
        return entry ? entry.start + offset : -1;
    };

    // 计算选区全局范围
    const selStart = findGlobalOffset(startContainer, startOffset);
    const selEnd = findGlobalOffset(endContainer, endOffset);

    // 有效性检查
    if (selStart === -1 || selEnd === -1) return false;

    // 判断匹配范围是否与选区范围重叠
    return (
        (match.start >= selStart && match.end <= selEnd) || // 完全包含
        (match.start < selEnd && match.end > selStart) // 部分重叠
    );
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
    return selection.toString().trim().toLowerCase() || "";
}

interface MatchRange {
    start: number;
    end: number;
}

function findMatches(mergedText: string, selectedText: string): MatchRange[] {
    const matches: MatchRange[] = [];
    // 增加有效性检查
    if (!selectedText || selectedText.length === 0) {
        console.warn("Invalid search text");
        return matches;
    }

    let index = 0;

    while ((index = mergedText.indexOf(selectedText, index)) !== -1) {
        matches.push({
            start: index,
            end: index + selectedText.length,
        });
        index += selectedText.length;
    }

    return matches;
}

/**
 * 在文本节点中高亮显示指定的匹配范围
 *
 * @param texts 文本节点条目数组，包含需要处理的文本节点及其位置信息
 * @param matches 需要高亮的匹配范围数组，包含原始文档中的绝对位置信息
 * @returns void
 */
function highlightMatches(texts: TextNodeEntry[], matches: MatchRange[]): void {
    console.log(`开始处理 ${matches.length} 处匹配项`);

    // 预处理：将匹配项按起始位置排序，确保后续顺序处理
    const sortedMatches = [...matches].sort((a, b) => a.start - b.start);
    let currentMatchIndex = 0;
    let offsetAdjustment = 0;

    // 遍历所有文本节点进行批量处理
    texts.forEach((entry, index) => {
        const node = entry.node;
        let nodeContent = node.textContent || "";

        // 收集当前节点需要处理的所有匹配范围（包含跨节点匹配的部分处理）
        const nodeMatches: MatchRange[] = [];
        while (currentMatchIndex < sortedMatches.length) {
            const match = sortedMatches[currentMatchIndex];
            const matchStart = match.start - entry.start;
            const matchEnd = match.end - entry.start;

            // 匹配范围完全包含在当前节点的情况
            if (match.start >= entry.start && match.end <= entry.end) {
                nodeMatches.push({
                    start: Math.max(0, matchStart),
                    end: Math.min(nodeContent.length, matchEnd),
                });
                currentMatchIndex++;
            }
            // 匹配范围跨节点，记录当前节点部分
            // 处理跨节点匹配的情况（仅处理当前节点包含的部分）
            else if (match.start < entry.end && match.end > entry.start) {
                const partialMatch = {
                    start: Math.max(0, match.start - entry.start),
                    end: Math.min(nodeContent.length, match.end - entry.start),
                };
                nodeMatches.push(partialMatch);
                break; // 剩余部分由后续节点处理
            } else {
                break;
            }
        }

        // 处理当前节点的所有匹配范围
        // 执行节点内容修改操作
        if (nodeMatches.length > 0) {
            console.group(`处理节点 #${index} (长度:${nodeContent.length})`);
            console.log("原始内容:", nodeContent);

            // 反向处理匹配范围以防止分割操作影响后续索引
            nodeMatches.reverse().forEach((match) => {
                const span = createSpanElement();
                console.log(
                    `高亮范围: [${match.start}-${
                        match.end
                    }] "${nodeContent.slice(match.start, match.end)}"`
                );

                // 执行三次分割操作形成高亮区域：
                // 1. 在匹配开始处分割
                // 2. 在匹配结束处分割
                // 3. 用span包裹中间部分
                const pre = node.splitText(match.start);
                const highlighted = pre.splitText(match.end - match.start);

                span.appendChild(pre.cloneNode(true));
                node.parentNode?.replaceChild(span, pre);

                // 保留分割后的剩余文本节点
                if (highlighted.textContent) {
                    span.after(highlighted);
                }

                nodeContent = node.textContent || ""; // 更新节点内容
            });

            console.log("处理后内容:", nodeContent);
            console.groupEnd();
        }
    });

    console.log(
        "最终高亮元素数:",
        document.querySelectorAll(".highlight").length
    );
}

/**
 * 创建一个带有高亮样式的span元素
 *
 * 该函数用于创建一个新的span元素，并为其设置特定的样式和类名
 * 以便在页面中高亮显示文本
 *
 * @param textContent - span元素的文本内容
 * @returns 返回一个带有高亮样式的span元素
 */
function createSpanElement(): HTMLElement {
    //return document.createElement("span");
    const span = document.createElement("span");
    span.className = "highlight";
    // span.textContent = textContent;
    // span.style.border = "2px solid rgb(255, 153, 0)";
    span.style.boxSizing = "border-box";
    span.style.backgroundColor = "rgba(255, 153, 0, 0.5)";
    span.style.display = "inline";
    span.style.lineHeight = "inherit"; // 继承行高
    span.style.verticalAlign = "baseline";

    return span;
}
