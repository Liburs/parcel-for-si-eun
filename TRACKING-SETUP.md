# EMS 自动物流配置

运单：EB872529602CN。原网站：https://liburs.github.io/parcel-for-si-eun/

1. 在 https://api.17track.net/ 注册 **API 账号**，按该服务当前套餐与额度说明启用 API。普通查件账号不一定提供 API 密钥。不要把密钥写进源码或聊天。
2. GitHub 仓库 Settings → Secrets and variables → Actions → New repository secret。名称填写 `TRACK17_TOKEN`，内容填写 API 密钥。
3. Settings → Pages → Source 选择 **GitHub Actions**。
4. Actions → Parcel tracking and Pages → Run workflow。首次运行会尝试注册此运单，可能消耗服务额度；承运商记录准备可能需要几分钟，之后再运行一次检查。
5. 默认每小时第17、47分钟自动查件并部署，GitHub 调度可能延迟，并非 GPS 实时定位。公开仓库长期无活动时计划任务可能被平台停用。

缺少密钥时页面显示待接通，不伪造轨迹。查询失败保留上次数据并提示失败。重量、预计到达日期、包裹尺寸未获得可靠来源，因此不显示。地图位置来自扫描城市或承运商坐标；城市中心点是近似位置，连线不是实际运输路线。无法确定位置时不猜测海上坐标。

韩文界面有承运商韩文译文时显示译文；否则显示韩文提示，并将承运商原文放在可展开的原文区域。

当前上线数据尚未通过真实 API 查询验证。完成密钥设置后，应核对网页记录与官方查询结果，再确认自动查询已接通。

API 文档：https://api.17track.net/en/doc
