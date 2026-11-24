# 一份跨越山海的心意 · parcel for SI EUN

一个纯静态、双语（中文 / 한국어）的私人礼物页面：从上海寄往奉化的小包裹，包含真实路线地图、物流时间轴、密码解锁、四段小游戏、七件小礼物和双语信件。

## 线上地址

已发布到 GitHub Pages：

```text
https://liburs.github.io/parcel-for-si-eun/
```

仓库：<https://github.com/Liburs/parcel-for-si-eun>

## 目录结构

| 文件 | 作用 |
| --- | --- |
| `index.html` | 页面骨架，按顺序加载各模块 |
| `app.js` | 页面流程：物流面板、解锁、礼物、信件（解锁密码也在这里） |
| `map.js` | 解锁前顶部的真实路线地图（三级底图回退、流动邮路、🏠/💝/📦 图钉） |
| `parcel-map.css` | 地图的可爱手账皮肤（奶油色底图、圆角柔光、地名小标签） |
| `tracking.js` | 每 60 秒读取 `tracking.json`，并广播 `tracking-updated` 事件 |
| `tracking.json` | **物流数据源**（解锁前「物流实况」卡片和地图都读它） |
| `parcel-live.js` | 解锁前的「物流实况」卡片：进度条、承运商/单号/服务/清关、重量/尺寸/内件、距离、ETA、轨迹 |
| `parcel-live.css` | 上面这张卡片的独立样式 |
| `quest-*.js` `adventure.js` | 四段小游戏（寻宝、受困、灵异等） |
| `culture.js` | 熊猫 / 三星堆文化介绍 |
| `site-language.js` `site-language.css` | 全站中韩切换 |
| `assets/` | 图片、音乐、语音、Leaflet 本地文件 |

## 更新物流信息（重点）

这是一个纯静态站点（GitHub Pages 没有后端），浏览器无法直接调用 EMS / 中国邮政的查询接口，所以 `tracking.json` 就是页面唯一的数据源。你每次收到新的物流节点，改这个文件并提交即可；访客页面每 60 秒会自动重新读取（也可以点卡片右上角的「刷新」）。

```json
{
  "stage": "transit",
  "state": "in_transit",
  "updatedAt": "2026-11-22T08:40:00+08:00",
  "checkedAt": "2026-11-23T14:45:00+08:00",
  "sync": "ok",
  "carrier": "中国邮政 EMS",
  "carrierKo": "중국우정 EMS",
  "service": "EMS 特快 · 3–7 天",
  "serviceKo": "EMS 특급 · 3–7일",
  "number": "EB872529602CN",
  "origin": { "zh": "上海", "ko": "상하이", "lat": 31.2304, "lng": 121.4737 },
  "destination": { "zh": "奉化郡", "ko": "봉화군", "lat": 36.8931, "lng": 128.7324 },
  "eta": "2026-11-26",
  "customs": "pending",
  "cargo": {
    "weight": "1.2 kg",
    "dimensions": "30 × 22 × 12 cm",
    "contents": [
      { "zh": "中国饼干 · 坚果 · 魔芋爽", "ko": "중국 과자 · 견과류 · 곤약 간식" }
    ]
  },
  "events": [
    {
      "time": "2026-11-22T08:40:00+08:00",
      "city": { "zh": "仁川", "ko": "인천", "lat": 37.4563, "lng": 126.7052 },
      "zh": "到达仁川国际交换局，等待清关",
      "ko": "인천 국제 교환국 도착, 통관 대기"
    }
  ]
}
```

- `stage`（地图上的阶段位置）：`shanghai` 上海 → `domestic` 中国境内 → `transit` 国际运输 → `korea` 已到韩国 → `delivery` 前往奉化 → `delivered` 已送达。
- `state`（卡片上的状态标签）：`pending`、`label_created`、`in_transit`、`awaiting_data`、`attention`（延误/异常）、`location_unknown`、`pickup`、`customs`（清关中）、`delivered`。
- `updatedAt` 最近一次物流扫描时间；`checkedAt` 数据核对时间（卡片右上角「X 分钟前更新」就按它算，每次改完文件记得更新）；`eta` 预计到达日期（可留空，页面会显示「待确认」）。
- `carrierKo` 可选，韩文页面显示用的承运商名。
- `service` / `serviceKo` 可选，服务类型（例如「EMS 特快 · 3–7 天」）。
- `customs` 可选，清关状态：`pending` 待清关 / `preparing` 清关中 / `cleared` 已清关 / `unknown` 待确认。
- `cargo.weight`、`cargo.dimensions` 可选，重量与尺寸（纯文本，单位两边通用）。
- `cargo.contents` 可选，内件清单数组，每条写 `{ "zh": "...", "ko": "..." }`，最多显示 4 行。
- 「直线距离」由 `origin` 与 `destination` 的坐标自动算出来，`eta` 会自动换算成「D-4」这样的倒计时；运单号旁的「查询 ↗」会打开韩国邮政的查询页。
- `events` 按时间从新到旧写（代码也会自动排序）。每条里的 `city` 可写 `zh` / `ko` / `lat` / `lng`：卡片显示地名，地图会把包裹图标移到最新一条带坐标的扫描城市；没有坐标时按 `stage` 显示大致阶段位置。可选 `kind` 用来换时间轴图标：`picked`、`depart`、`flight`、`arrive`、`customs`、`delivery`、`delivered`。
- 没有 `events` 时，卡片会展示当前阶段附近的预计节点（可展开全部），不会空白。
- 可选字段 `location`：`{ "lat": 37.45, "lng": 126.45, "nameZh": "仁川", "nameKo": "인천" }`，在没有扫描记录时手动指定地图上的包裹位置。

> 小提示：`tracking.json` 里现在填的是真实单号 `EB872529602CN` / 中国邮政 EMS，阶段为「国际运输中」，还没有扫描记录。收到「已到仁川」「清关中」「派送中」之类的节点后，把 `stage`、`state`、`updatedAt` 和 `events` 一起更新即可。

## 发布到 GitHub Pages

这个仓库已经配置好：`main` 分支根目录发布，每次 `git push` 后 1–2 分钟自动更新 <https://liburs.github.io/parcel-for-si-eun/>。

如果以后要另建仓库，步骤是：

1. 新建仓库，把本目录的全部文件（包括 `.nojekyll` 和 `assets/`）推上去。
2. 仓库 **Settings → Pages → Build and deployment**：Source 选 `Deploy from a branch`，Branch 选 `main`，目录选 `/ (root)`，保存。
3. 等 1–2 分钟，打开 `https://<你的用户名>.github.io/<仓库名>/`。

注意事项：

- **仓库是公开的**：信件内容、`tracking.json` 里的运单号都会公开可见，请不要放地址、电话等隐私信息。
- `assets/` 约 180MB（音乐、语音、拆分后的视频），首次打开会慢一些；已经带有 `.nojekyll`，不要删掉。
- 所有路径都是相对路径，放在仓库根目录即可，不需要改配置。

## 本地预览

不能直接双击 `index.html`（`tracking.json` 通过 `fetch` 读取，`file://` 下会被浏览器拦截）。在项目目录运行：

```bash
python -m http.server 8000
```

然后打开 <http://localhost:8000/>。

## 解锁密码

密码在 `app.js` 的解锁表单处理里（当前是信里告诉 SI EUN 的那个词）。如果要换密码，记得同步改纸质信封里的提示。

## 版权与致谢

- 地图数据 © [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors，地图库 [Leaflet](https://leafletjs.com/)（BSD-2-Clause，见 `assets/vendor/LEAFLET-LICENSE.txt`）。
- 背景音乐、音效、语音的版权归原作者所有，仅供这份私人礼物使用，请勿商用或二次分发。
- 页面里引用的熊猫 / 三星堆资料用于私人文化分享，图片版权见 `culture.js` 中的来源说明。
