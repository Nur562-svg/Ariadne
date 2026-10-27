/**
 * 本机草稿原子字段编辑器存取（T61 atom-local-draft-01；客户端专用，与 lib/study.ts /
 * lib/heye-store.ts 对称，只跑在浏览器）。本模块不 import 任何含 fs 的模块（类型
 * import 编译期擦除，同 lib/cite-ocr-quality.ts 的引用方式），保证客户端安全引入。
 *
 * 五禁（T61 合同，写死在此 · 任何改动不得触碰）：
 * 1. 新键 only：ariadne.atom-draft.v1。永不改名 / 迁移 / 复用 ariadne.study.v1 ·
 *    ariadne.heye.v1 · ariadne.desk.return.v1 · session / view / last-opened / recent-books。
 * 2. 永不写 verified:true——草稿里没有 verified 字段，导出 patch 也不含 verified 翻改；
 *    「本机草稿」不等于 seed 抽查 verified，不等于 heye 本机已对，不等于 study 练分。
 * 3. 永不 auto PATCH / fetch / fs 写 data/cards/*.entities.json 或 blocks——seed 服务端
 *    读路径只读不变；导出只进剪贴板，人核后自行改 seed / 开 PR。
 * 4. 永不 Clew LLM 真写 / 提案自动落盘——本模块与 Clew 写路径无关。
 * 5. 永不改名既有 storage keys；progress-port 不吞草稿键（草稿不进 study/heye 导出包）。
 *    T62：草稿可移植走独立 ariadne.atom-draft-port.v1（lib/atom-draft-port.ts），
 *    永不并进 ProgressPayload / progress-port.ts 的 study/heye 包。
 */

/*
 * T83 desk-atom-draft-lib-split-01：本文件收口为 barrel——五禁 header 留此，消费者入口不变
 * （一律 `from "@/lib/atom-draft"`，不直连深路径）。实现按既有分区机械抽出，全部既有
 * named exports 经此 re-export 守恒：
 *   lib/atom-draft-store.ts    键 / 类型 / load·persist·subscribe·set·merge·clear·clearCard·saveWhole
 *   lib/atom-draft-overlay.ts  显示 = seed ⊕ draft overlay（Draftable* / apply* / incomplete* / *Differs / 计数 / 列卡）
 *   lib/atom-draft-patch.ts    剪贴板 patch 导出 · T62 pack / 摘要 / 人核落盘清单 · T67 粘贴解析·校验·应用
 * 三处 re-export 用带 .ts 扩展名的相对路径：scripts/clew-suggest-check.mjs 以 Node 原生
 * type-strip 直接 import 本文件，Node ESM 既不解析 tsconfig 的 @/ 别名也不补扩展名
 * （tsconfig 相应开启 allowImportingTsExtensions；noEmit 下合法）。
 */
export * from "./atom-draft-store.ts";
export * from "./atom-draft-overlay.ts";
export * from "./atom-draft-patch.ts";
