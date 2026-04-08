# 🌸 全球名花图鉴

一个交互式的全球名花可视化项目，收录了 **120 种世界名花**，覆盖 **5 大洲、35 个国家/地区**。支持 3D 地球仪和平面地图两种浏览方式，点击标记即可查看花卉详情。

## 预览

直接在浏览器中打开 `flower_global_show.html` 即可使用。

## 功能特色

- **3D 地球仪视图**：基于 Three.js 的可交互地球仪，花卉标记分布在对应的地理位置上，支持拖拽旋转、缩放和自动旋转
- **平面地图视图**：Canvas 绘制的等距圆柱投影世界地图，支持缩放和拖拽平移
- **多维筛选**：按大洲、花期月份搜索和筛选花卉，支持名称/国家/简介关键词搜索
- **花卉详情卡片**：展示花卉简介、花期分布、花朵颜色、观花指南和观赏地点
- **本地图片支持**：自动加载 `flowers/` 目录下以花名命名的图片（如 `樱花.jpg`），也可手动上传照片
- **背景音乐**：左上角音乐按钮，默认加载本地 `music.mp3`，也可上传自定义音频
- **花瓣飘落特效**：页面背景有随机飘落的花瓣动画

## 项目结构

```
flower_global_show/
├── flower_global_show.html   # 主页面入口
├── style.css                 # 样式文件
├── flowers-data.js           # 120种花卉数据
├── globe.js                  # 3D地球仪渲染模块
├── ui.js                     # UI交互模块（筛选、详情卡、地图视图等）
├── flowers/                  # 本地花卉图片（可选）
│   ├── 樱花.jpg
│   ├── 菊花.jpg
│   ├── 梅花.jpg
│   └── ...                   # 以花名命名，支持 jpg/webp/png
├── music.mp3                 # 背景音乐（可选）
└── README.md                 # 本文件
```

## 使用方法

### 基本浏览

1. 用浏览器打开 `flower_global_show.html`
2. 等待加载完成后，3D 地球仪会自动旋转展示全球花卉分布
3. **点击地球上的花卉图标** 查看详细信息
4. 使用左侧面板的搜索框和筛选条件缩小范围
5. 点击左上角 **🌍 地球仪 / 🗺 平面地图** 切换视图

### 花卉图片

在 `flowers/` 目录下放置以花名命名的图片文件，打开花卉详情时会自动加载对应图片：

- 支持格式：`.jpg`、`.webp`、`.png`、`.jpeg`
- 命名规则：使用花卉的中文名，如 `樱花.jpg`、`薰衣草.png`
- 也可以在详情卡片中点击 **📷 上传图片** 手动上传

### 背景音乐

- 在项目根目录放置 `music.mp3` 文件，打开页面后点击左上角 🎵 按钮即可播放
- 点击 🎵 旁的 📂 按钮可上传其他音频文件
- 再次点击 🎵 暂停播放

## 技术栈

- **Three.js**：3D 地球仪渲染
- **Canvas 2D**：平面地图绘制
- **TopoJSON**：世界地图边界数据
- **原生 HTML/CSS/JS**：无需构建工具，开箱即用

## 花卉数据

收录 120 种世界名花，每种花包含：

| 字段 | 说明 |
|------|------|
| 名称（中/英文） | 花卉的中英文名称 |
| 所属国家/地区 | 该花最具代表性的国家 |
| 地理坐标 | 用于在地球仪上定位 |
| 花期 | 开花月份分布 |
| 花朵颜色 | 常见花色 |
| 分类 | 木本花卉、草本花卉、球根花卉等 |
| 简介与观赏指南 | 文化背景、观赏建议 |

区域分布：亚洲 60 种、欧洲 21 种、美洲 19 种、非洲 12 种、大洋洲 8 种。

## 许可证

本项目采用自定义许可证，详见 [LICENSE](./LICENSE) 文件。

### 你可以：

- **分享** — 在任何媒介或格式中复制、转载本项目
- **演绎** — 修改、转换或基于本项目进行二次创作
- **个人使用** — 用于个人学习、研究和非商业展示

### 但须遵守以下条件：

- **署名** — 你必须注明原作者并提供本项目链接
- **未经授权不可商用** — 未经作者书面授权，不得将本项目用于任何商业目的。如需商业授权，请联系作者

### 免责声明

- 本项目中的花卉图片链接来自 Wikipedia Commons，其版权归原作者所有
- `flowers/` 目录下的本地图片由用户自行提供，不包含在本项目许可范围内
- 花卉数据仅供参考，不保证完全准确

---

**Copyright (c) 2026 seanlsxu. All rights reserved.**

**本项目仅供个人学习、研究和非商业用途使用。未经作者书面授权，严禁用于任何商业目的。**

---

<details>
<summary><b>English Version</b></summary>

# 🌸 World Flowers Atlas

An interactive visualization of world-famous flowers, featuring **120 species** across **5 continents and 35 countries/regions**. Browse via a 3D globe or a flat world map, and click on markers to explore flower details.

## Preview

Open `flower_global_show.html` in any modern browser.

## Features

- **3D Globe View** — Interactive Three.js globe with flower markers at real geographic coordinates; supports drag, zoom and auto-rotation
- **Flat Map View** — Canvas-rendered equirectangular world map with zoom and pan
- **Multi-filter Search** — Filter by continent, blooming month, or keyword (name / country / description)
- **Flower Detail Cards** — View description, bloom calendar, petal colors, viewing guide and recommended locations
- **Local Image Support** — Automatically loads images from the `flowers/` directory matched by flower name (e.g. `樱花.jpg`); manual upload also available
- **Background Music** — Auto-plays `music.mp3` on load if present; upload custom audio via the top-left controls
- **Petal Rain Effect** — Falling petal animation in the background

## Project Structure

```
flower_global_show/
├── flower_global_show.html   # Main entry page
├── style.css                 # Stylesheet
├── flowers-data.js           # 120 flower species data
├── globe.js                  # 3D globe renderer
├── ui.js                     # UI interaction module
├── flowers/                  # Local flower images (optional)
│   ├── 樱花.jpg
│   ├── 菊花.jpg
│   └── ...                   # Named by Chinese flower name; jpg/webp/png
├── music.mp3                 # Background music (optional)
├── LICENSE                   # License file
└── README.md                 # This file
```

## Usage

### Browsing

1. Open `flower_global_show.html` in a browser
2. The 3D globe auto-rotates showing global flower distribution
3. **Click a flower marker** on the globe to view details
4. Use the left panel to search and filter
5. Switch between **🌍 Globe / 🗺 Flat Map** via top-left tabs

### Flower Images

Place image files named after the flower's Chinese name in the `flowers/` directory:

- Supported formats: `.jpg`, `.webp`, `.png`, `.jpeg`
- Example: `樱花.jpg` (Cherry Blossom), `薰衣草.png` (Lavender)
- You can also upload images manually via the **📷 Upload** button in the detail card

### Background Music

- Place a `music.mp3` file in the project root; it will auto-play on page load
- Click the 📂 button next to 🎵 to upload a different audio file
- Click 🎵 to pause/resume

## Tech Stack

- **Three.js** — 3D globe rendering
- **Canvas 2D** — Flat map rendering
- **TopoJSON** — World boundary data
- **Vanilla HTML/CSS/JS** — Zero build tools, works out of the box

## Flower Data

120 species, each containing:

| Field | Description |
|-------|-------------|
| Name (CN / EN) | Chinese and English names |
| Country / Region | Most representative country for the flower |
| Coordinates | For positioning on the globe |
| Bloom Season | Blooming months |
| Petal Colors | Common flower colors |
| Category | Tree, herb, bulb, aquatic, etc. |
| Guide | Cultural background and viewing tips |

Regional distribution: Asia 60, Europe 21, Americas 19, Africa 12, Oceania 8.

## Feedback & Contributing

Issues are welcome! Whether it's a bug report, feature request, or data correction — your feedback is greatly appreciated.

## License

This project uses a custom license. See [LICENSE](./LICENSE) for details.

### You may:

- **Share** — Copy and redistribute in any medium or format
- **Adapt** — Remix, transform, and build upon this project
- **Personal Use** — Use for personal learning, research and non-commercial display

### Conditions:

- **Attribution** — You must credit the original author and link to this repository
- **No Commercial Use Without Authorization** — Commercial use of any kind requires prior written permission from the author. Contact the author for commercial licensing

### Disclaimer

- Flower image links are sourced from Wikipedia Commons; copyrights belong to their respective owners
- Images in the `flowers/` directory are user-provided and not covered by this license
- Flower data is for reference only; accuracy is not guaranteed

---

**Copyright (c) 2026 seanlsxu. All rights reserved.**

**This project is for personal, educational and non-commercial use only. Commercial use without written authorization from the author is strictly prohibited.**

</details>
