import type { HeYeItem } from "@/lib/heye";
import type { PageDoc } from "@/lib/entities";
import type { HeYeMode } from "@/lib/heye-store";

/**
 * T78 机械抽出：原 HeYeSession.tsx 内联 props 类型段（逐 prop JSDoc）整段迁此——
 * 零语义改（结构类型等价；HeYeSession 签名引 HeYeSessionProps，props 全表不变）。
 */
export type HeYeSessionProps = {
  /** 全池待核队列（服务端 collectCiteQueue，已按页码排序；本机态过滤在客户端）。 */
  items: HeYeItem[];
  /** 队列涉及的 OCR 页（真 loadAllChapterPages 子集，按 page 索引）。 */
  pages: PageDoc[];
  /** 范围说明（全书库 / 某书书名 / 单卡卡名 / 章），用于副文。 */
  scopeLabel: string;
  /** 档位：待核｜已对｜存疑（本机态，非到期调度）。 */
  mode: HeYeMode;
  /** 单卡范围（/review?card=）：空队列/全部对过时链回本卡。 */
  cardHref?: string;
  /** 跨环学习链（有卡带 ?card=，否则 /study）。 */
  studyHref?: string;
  /**
   * T52 C/E：服务端池空分型（review 页推导，对齐 study 的 orphan / cardOutOfRange / 真空
   * 三型）——'orphan'=合法 pageNum · 非单卡 · 池空（页无 cite 或未解析 OCR）；
   * 'card-out'=单卡在宽范围有待核、当前 book/chapter/page 过滤交集为空（越界）；
   * 'true-empty'=真无待核数据（引导 /ingest · 书架，不装假池）。缺省 null → 通用句。
   */
  emptyKind?: "orphan" | "card-out" | "true-empty" | null;
  /**
   * T51 J：交叉练链（去学习环 / 去学习本卡）的对侧真池——父页按 studyHref 同范围
   * collectStudyAtoms 装配（review 页：单卡=卡池、有效页非孤儿=页池、无页=章/书池）；
   * 缺省 0（fail-closed）。===0 时空/完成态练链降 muted 纯文不可点、不写
   * leaveReturnTo；>0 保持链 + leaveReturnTo（T42 接线不拆）。
   */
  atomCount?: number;
  /** 单页范围（/review?page=）：空队列/全部对过时优先链回书桌本页（/desk?book=&page=）。 */
  deskPageHref?: string;
  /** 空档「回待核」链（同范围 ?mode=open）。 */
  openHref?: string;
  /** 档位芯片「已对」目标：同范围 ?mode=checked（T25 A）。 */
  checkedHref?: string;
  /** 档位芯片「存疑」目标：同范围 ?mode=doubt（T25 A）。 */
  doubtHref?: string;
  /** 章范围清章回全书核页（/review?chapter=null 等价）——池空/档空时限宽范围。 */
  clearChapterHref?: string;
  /**
   * T28 A：本页过滤放宽链（/review?book=&chapter= 只删 page，留书/章/档）——
   * 池空/档内空两处次级「清本页 →」；仅有效 pageNum 时由父页传入，不新增第二颗实心主按钮。
   * T29 C：孤儿核（合法 page · 非单卡 · 池空）时它升为唯一朱红主 CTA，不再重复列次级。
   */
  clearPageHref?: string;
  /**
   * T29 C：孤儿核标志（父页服务端判定：合法 pageNum · 非单卡 · items.length===0）——
   * 池空态主 CTA 换「清本页，换到本章核」，「去学习环」降次级（studyHref 父页已消毒无 page）。
   */
  orphanPage?: boolean;
  /**
   * T58 F/I：孤儿核**旁挂**暗页判定（父页 loadPageExaminable(pageNum).hint==='dark'）——
   * 只在既有 orphan 句后补一句琥珀，**勿**新增 emptyKind:'dark'、**勿**改 orphan 主 CTA /
   * 清本页契约、**勿**吞 card-out / true-empty；非暗/未检出不吵。
   */
  orphanDark?: boolean;
  /**
   * T60 F/I：匹配中 / sticky 页**旁挂**浅判定（父页 loadPageExaminable(pageNum)
   * .hint==='shallow'，非 orphan 主题——浅页有 cite 才浅）——会话顶一句琥珀「本页
   * 已抽出但原子偏稀（浅）」。**勿**新增 emptyKind:'shallow' / 'dark'、**勿**吞
   * orphan×dark（T58 F）/ card-out / true-empty 分型；非浅不吵。只提示：本页 cite
   * 核得完 ≠ 本页可考密度够。
   */
  pageShallow?: boolean;
  /**
   * T29 E：父页算好的本页环键（g 清本页 / ⇧[ ⇧] 切章；与 sticky 键岛同源 stickyKeys）——
   * 仅当前真可用时传入；无本页过滤不列 g，无章芯片不列 ⇧[]，题内键恒保留。
   */
  loopKeys?: [string, string][];
  /** 续位作用域（与父级 remount key 一致）：`${book|all}:${card|all}:${page|all}:${chapter|all}:${mode}`。 */
  scopeKey: string;
  /**
   * T42 C/D：离面进练链（去学习环 / 去学习本卡 + 核中卡名开卡 / 在书桌打开 p.N）点前的
   * return payload——父传 reviewReturnTo（与页头 Strip / sticky CrossScope 同一份，禁第二套）；
   * 缺省不写。回本卡 / 回书桌本页 / 回书桌**不写**（那是回程不是进环，避免互谎）。
   * key 仍 ariadne.desk.return.v1。
   */
  leaveReturnTo?: { href: string; label: string };
};
