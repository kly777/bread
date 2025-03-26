### **Bread**

**浏览器扩展**
通过高亮、加粗、标注等技术提升中英文文本的阅读效率。

---

#### **已实现功能**

1. **鼠标选中文本高亮**
    - 当用户选中任意文本时，页面中所有相同文本会自动高亮（已实现）。

---

#### **待实现功能**

1. **英文单词前半部分加粗**

    - **功能**：将英文单词的前半部分加粗显示，提升阅读速度。
    - **示例**：`Hello` → `Hel`lo（加粗前半部分）。

2. **中英文词性高亮**

    - **功能**：根据词性（如名词、动词、介词等）对文本进行不同颜色/样式的高亮。
        - 中文：依赖分词技术（如 Lucene 中文切分原理）和词性标注。
        - 英文：使用自然语言处理（NLP）库（如 spaCy）进行词性分析。

3. **段落行号标注**
    - **功能**：在段落前后标注当前行号（如“5 aabbcc 5”），方便快速定位。

#### **Todo List**

| **任务优先级** | **任务描述**                     | **依赖/参考**                  |
| -------------- | -------------------------------- | ------------------------------ |
| **高优先级**   | 实现英文单词前半部分加粗         | 正则表达式分割、动态插入样式   |
| **高优先级**   | 中文分词与词性标注               | 集成 `jieba` 或 Lucene 分词库  |
| **高优先级**   | 段落行号标注                     | 遍历 DOM 节点并插入行号标记    |
| **中优先级**   | 英文词性高亮                     | NLP 库（如 spaCy）或自定义规则 |
| **低优先级**   | 用户自定义样式（颜色、加粗强度） | 配置界面开发                   |
| **低优先级**   | 兼容性测试（Firefox/Chrome）     | 浏览器扩展 API 适配            |

---

#### **思考**

1. **性能优化**：
    - 中文分词和词性标注可能耗时，需使用 Web Workers 或异步处理。
    - 限制处理范围（如仅对可见区域文本生效）。
2. 分词与词性标注用哪个库，要用 wasm 吗
