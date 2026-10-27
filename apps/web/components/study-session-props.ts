import type { StudyAtom } from "@/lib/entities";
import type { StudyMode } from "@/lib/study";

/**
 * T79 机械抽出：原 StudySession.tsx 内联 props 类型段（逐 prop JSDoc）整段迁此——
 * 零语义改（结构类型等价；StudySession 签名引 StudySessionProps，props 全表不变）。
 */
export type StudySessionProps = {
  /** 当前范围全池（未按档位过滤；档位在客户端按本机评分过滤）。 */
  atoms: StudyAtom[];
  scopeLabel: string;
  diffLabel: Record<string, string>;
  /** 队列档位：all 全部｜ungraded 未评｜unknown 不熟再练。 */
  mode: StudyMode;
  /** 当前 ?book=（有值时 CiteChip 优先深链书桌章页）。 */
  activeBookId?: string;
  /** 章 → 书反查（books.json）：无 ?book= 时按 atom 所在章找书。 */
  bookByChapter: Record<string, string>;
  /** 完成态 / 空队列回链：书桌与核页（有书带 book 参数）。 */
  deskHref: string;
  reviewHref: string;
  /**
   * T51 I：交叉核链（核本卡 / 去核页）的对侧真池——父页按 reviewHref 同族
   * collectCiteQueue 装配（study 页 = heyeItems.length，与 progressReview 同范围）；
   * 缺省 0（fail-closed）。===0 时空/完成态核链降 muted 纯文不可点、不写
   * leaveReturnTo；>0 保持链 + leaveReturnTo（T42 接线不拆）。
   */
  pendingCount?: number;
  /** 单卡范围（/study?card=）：完成/空态改为「回本卡」「核本卡」，回书桌让位为次要链。 */
  cardHref?: string;
  /** 「只练不熟」与空队列回链：同范围切档 URL。 */
  allHref: string;
  unknownHref: string;
  /** 档位芯片「未评」目标：同范围 ?mode=ungraded（T25 A）。 */
  ungradedHref: string;
  /**
   * T28 C：本页档空的放宽链（清 page + mode=all，服务端拼好）——空档区次级文字链
   * 「清本页，看本章全部 →」；仅有效 pageNum 时传入。仍只保留一颗实心主 CTA。
   */
  widenPageHref?: string;
  /** 单卡首个有页 cite 页码（服务端给）：完成/空态回书桌本页的页来源之一。 */
  deskPageHint?: number | null;
  /** 当前范围书 id（scopeBook，含单卡反查）：回书桌本页 / last-opened 回落以它为准。 */
  deskBookId?: string;
  /**
   * T29 E：父页算好的本页环键（g 清本页 / ⇧[ ⇧] 切章；与 sticky 键岛同源 stickyKeys）——
   * 仅当前真可用时传入；无本页过滤不列 g，无章芯片不列 ⇧[]。题内裸 [ / ] 仍是回看/前进。
   */
  loopKeys?: [string, string][];
  /** 续位作用域（与父级 remount key 一致）：`${card|all}:${book|all}:${chapter|all}:${mode}`。 */
  scopeKey: string;
  /**
   * T32 E：该书已解析印刷页[]（服务端装配）——完成/空态「回书桌本页」的 lastOpened
   * 回落页消毒：仅当 lo.page 在表内才采用；无表 / 脏页 → 不采用（与 ReturnNav 同真，
   * 不盲信 localStorage）。页源优先级不变：lastAtomPage ?? deskPageHint ?? lastOpenedPage。
   */
  validPages?: number[];
  /**
   * T42 B/D：离面链（去核页/核本卡交叉 + 题头卡名开卡）点前的 return payload——
   * 父传 studyReturnTo（与页头 Strip / sticky CrossScope 同一份，禁第二套）；缺省不写，
   * 行为与前同。回书桌/回本卡链**不写**（那是回程不是进环，避免互谎）。
   * key 仍 ariadne.desk.return.v1。
   */
  leaveReturnTo?: { href: string; label: string };
  /**
   * T58 E/I：scope 可考覆盖旁挂（父页消费 T57 装配；单卡/未检出省略 → 缺省 false/0）——
   * 池非空且当前档评完时，完成卡下方琥珀一行「评完池 ≠ 材料已覆盖」。只提示；
   * 不改完成主 CTA（不做成「去补暗」强推），不写 verified / 不 PATCH entities。
   */
  examinableWeak?: boolean;
  /** T58 E：scope 暗页数（examinableWeak 为 true 时点名 暗{darkCount}）。 */
  darkCount?: number;
  /**
   * T60 E/I：scope 浅密度旁挂（父页消费 T59 装配；单卡/未检出省略 → 缺省 false/0）——
   * 池非空且当前档评完时，完成卡下方琥珀一句「评完池 ≠ 可考够」（浅页已 cite 但原子
   * 极稀）。与 T58 暗句**并列不互吞**；只提示，不改完成主 CTA（不做成「去补浅」
   * 强推），不写 verified / 不 PATCH entities。
   */
  densityWeak?: boolean;
  /** T60 E：scope 浅页数（densityWeak 为 true 时点名 浅{shallowCount}）。 */
  shallowCount?: number;
};
