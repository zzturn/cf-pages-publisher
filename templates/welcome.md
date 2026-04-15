# CF Pages Publisher — 效果演示

## 这是什么

一个 Claude Code / OpenAI Codex 的 Skill，**一句话把内容发布成带样式的网页，秒得永久链接。**

面向 AI Agent 辅助开发时的真实痛点：生成的长文档在聊天窗口里排版混乱，难以阅读和分享。

## 安装

只需要在终端对 AI 说：

```text
https://github.com/zzturn/cf-pages-publisher，帮我安装并部署这个 skill
```

AI 会引导你配置 Cloudflare Pages 项目名称和 API Token，全程自动完成。前提是你有一个 Cloudflare 账号（免费版即可）。

或者手动安装：

```shell
git clone https://github.com/zzturn/cf-pages-publisher.git ~/.claude/skills/cf-pages-publisher
node ~/.claude/skills/cf-pages-publisher/setup.mjs
```

根据交互式指引，依次填写项目名称和 Cloudflare 凭据即可完成配置。

## 使用

装好之后，自然语言驱动：

- 发布文件：`"把这个文件发布为网页：./spec.md"`
- 直接发送内容：`"将以下内容发布为页面：# API 文档 ..."`

几秒后获得永久链接：`https://<project>.pages.dev/<hash>/`

---

以下为 **Markdown 各元素渲染效果展示**：

## 文本样式

普通段落文本，支持 **加粗**、*斜体*、~~删除线~~ 和 `行内代码`。

> 引用块可以用来强调重要内容。每一行文字都承载着品牌色温的痕迹 — 注意左边框使用的是品牌色。

## 代码高亮

```python
from dataclasses import dataclass
from typing import Optional

@dataclass
class Page:
    """A published static page."""
    slug: str
    title: str
    content: str
    base_url: str = "https://my-docs.pages.dev"

    @property
    def url(self) -> str:
        return f"{self.base_url}/{self.slug}/"

    def is_valid(self) -> bool:
        return len(self.slug) >= 8 and bool(self.content)
```

## 表格

| 特性 | 说明 | 成本 |
|:-----|:-----|:----:|
| 内容哈希 URL | SHA-256 取前 12 位，内容不变链接不变 | 免费 |
| 增量部署 | 旧页面保留，所有链接永久有效 | 免费 |
| 亮暗模式 | 自动跟随系统偏好 | 免费 |
| HTML 转义 | Markdown 中的 HTML 默认转义，防止 XSS | 免费 |

## 列表

**支持的发布方式：**

1. 指定文件路径 — `"发布这个文件：./doc.md"`
2. 直接发送内容 — `"将以下内容发布为页面：..."`
3. 带自定义选项 — `--len 16`、`--with-time`

**支持的文件格式：**

- `.md` / `.markdown` — Markdown 转 HTML（GFM）
- `.html` / `.htm` — 直接使用原始 HTML
- `.txt` — 纯文本，以代码块形式展示

## 分隔线与链接

下方是一条水平分隔线。项目地址：[github.com/zzturn/cf-pages-publisher](https://github.com/zzturn/cf-pages-publisher)

---

*由 CF Pages Publisher 自动生成 · Cloudflare Pages 免费托管*
