# SEO 实施文档（docs.55aaseclab.com）

> 版本：v1 | 日期：2026-11-22 | 目标：文档站可被搜索引擎正常收录与展示
> 站点性质：静态（Astro SSG），无客户端渲染依赖，对 SEO 天然友好

---

## 1. 现状盘点（2026-11-22 审计）

| 项 | 现状 | 判定 |
|---|---|---|
| title | `文档 · 55AA 安全实验室` / `Docs · 55AA Security Lab` | ✅ 与控制台 tab 可区分 |
| meta description | 中英各一条 | ✅ |
| og 三件套（title/description/image） | ❌ 无（分享到微信/TG 无卡片） | ⬜ 待补 |
| robots.txt | ❌ 无 | ⬜ 新建 |
| sitemap.xml | ❌ 未集成（astro 无 sitemap 插件） | ⬜ 集成 @astrojs/sitemap |
| 结构化数据（JSON-LD） | ❌ 无 | ⬜ 可选 |
| 静态壳可见性 | SSG 直出完整 HTML | ✅ 爬虫可全量收录 |
| 收录状态 | 未提交任何搜索引擎 | ⬜ 上线动作 |

---

## 2. 站内优化（一次性完成）

### 2.1 meta 三件套

```html
<title>文档 · 55AA 安全实验室</title>
<meta name="description" content="55AA Security Lab LLM 网关使用文档：注册、充值、API 密钥、Codex/OpenCode/WorkBuddy 接入配置、用量查询。" />
<meta property="og:title" content="文档 · 55AA 安全实验室" />
<meta property="og:description" content="55AA Security Lab LLM 网关使用文档" />
<meta property="og:image" content="https://docs.55aaseclab.com/social-card.png" />
<meta property="og:url" content="https://docs.55aaseclab.com/zh/" />
<meta property="og:type" content="website" />
<meta name="twitter:card" content="summary_large_image" />
```

en 页同理（英文文案 + og:url=/en/）。

### 2.2 robots.txt（核对内容）

```
User-agent: *
Allow: /
Sitemap: https://docs.55aaseclab.com/sitemap.xml
```

### 2.3 sitemap

Astro `@astrojs/sitemap` 依赖 site 配置已指向 `https://docs.55aaseclab.com`，构建产物核对包含 `/zh/` `/en/` 两条（根 `/` 是 meta-refresh 跳转页，不应入 sitemap）。

### 2.4 可选：JSON-LD

```json
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "55AA Security Lab LLM 网关文档",
  "url": "https://docs.55aaseclab.com",
  "inLanguage": ["zh", "en"]
}
```

---

## 3. 上线动作（每搜索引擎一次性）

| 搜索引擎 | 动作 | 入口 | 备注 |
|---|---|---|---|
| Google | Search Console 添加资源（域名前缀）→ 提交 sitemap | search.google.com/search-console | DNS TXT 验证（DNSPod 加一条记录）；国内可访问性差是事实，但海外教育用户（EPFL 等）靠它 |
| Bing | Webmaster Tools 提交（可从 GSC 一键导入） | bing.com/webmasters | Bing 收录 = 国内部分场景 + DuckDuckGo |
| 百度 | 资源平台提交 + 建议开普通收录 | ziyan.baidu.com | 百度对未备案站点收录有限制；**ICP 备案通过后**再做，效果最好 |
| 360/搜狗 | 随百度之后提交 | — | 优先级低 |

**前提条件**：域名可稳定访问（已满足）、robots 不屏蔽（核对）、有实质内容（已满足）。

---

## 4. 内容策略（持续）

1. **锚点页面即着陆页**：`/zh/#codex`、`/zh/#workbuddy` 等锚点对应明确的搜索意图（"codex 第三方 api 配置"）。单页锚点对搜索引擎是同一 URL——若后续要吃搜索流量，可把每个工具的配置拆成独立页面 `/zh/codex/` `/zh/workbuddy/`（v2 再议，当前单页够用）
2. **关键词覆盖**（自然出现在正文即可，勿堆砌）：codex 配置、openai 中转、gpt api 教育优惠、chatgpt api 4 折、workbuddy 自定义模型、opencode 配置
3. **更新频率**：每次产品更新（PRD 修订号）同步更新文档 + 重新部署，搜索引擎偏好活跃站点
4. **外链**：控制台首页"文档"链接（已做）→ 构成内链；实验室官网 www.55aaseclab.com 加文档入口（待做）

---

## 5. 验证清单

- [ ] `view-source:` 确认 title/description/og 在 HTML 源码里（不是 JS 注入）
- [ ] robots.txt 可访问且 Allow
- [ ] sitemap.xml 可访问且含 zh/en
- [ ] GSC 提交后 1-2 周检查收录（`site:docs.55aaseclab.com`）
- [ ] 分享到微信/TG 确认 og 卡片显示

---

## 变更记录

| 版本 | 日期 | 变更 |
|------|------|------|
| v1 | 2026-11-22 | 初版：现状审计、站内优化清单、搜索引擎上线动作、内容策略 |
