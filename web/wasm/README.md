# 高性能版客户端（EaglercraftX 1.8.8 WASM）

本目录存放**编译后的** WASM 客户端静态文件，通过站点 `/wasm/` 访问。

仓库**不提交** `bootstrap.js`、`assets.epw`、`*.wasm` 等大文件。请基于子模块 `eaglerx/` 自行编译：

```bash
git submodule update --init --recursive
./scripts/build-eaglerx.sh --wasm-only
```

## 编译来源

- 子模块：`eaglerx/`
- Gradle 任务：`target_teavm_wasm_gc:makeMainWasmClientBundle`
- 输出：`eaglerx/target_teavm_wasm_gc/javascript_dist/` → 复制到本目录

电脑 Chrome 可试本目录；iPad / 手机请用普通 JS 版（`/js/`）。

## 已内置的二改

与 JS 版相同（默认服、标题、`/cn-chat.js`），见 `eaglerx-custom/`。

## Nginx

- `.wasm` 必须 `Content-Type: application/wasm`
- 若需 SharedArrayBuffer，按 `eaglerx` 文档加 COOP/COEP 头

详见仓库根 `README.md`「编译 EaglercraftX 1.8 客户端」。
