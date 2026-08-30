# CQ 服 EaglercraftX 1.8 二改配置（由 scripts/apply-eaglerx-custom.sh 读取）

# 浏览器标签页 / og:title
export MC_PAGE_TITLE_JS="CQ 网页版 Minecraft 1.8"
export MC_PAGE_TITLE_WASM="CQ 网页版 Minecraft 1.8 WASM"

# 游戏内主菜单品牌（EaglercraftVersion.java）
export MC_FORK_NAME="CQ Minecraft"
export MC_FORK_VERSION="1.8"
export MC_FORK_VENDOR="mc.cq.je"
export MC_FORK_URL="https://mc.cq.je"

# 默认多人服务器（与 web/launcher/servers.json 一致；现网核对为同域根路径 wss）
export MC_SERVER_NAME="CQ 创造服"
export MC_SERVER_ADDR="wss://mc.cq.je/"
