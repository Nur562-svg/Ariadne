import { collectStudyAtoms, loadCards } from "@/lib/entities";
import { collectCiteQueue } from "@/lib/heye";

/**
 * T50：书级/页级练核池装配（服务端单一口径，书架续开 / footer / 继续上次 / 侧栏在读共用）。
 * 全部派生自既有池工具（collectStudyAtoms / collectCiteQueue / cardsCitingPage 卡级口径），
 * 禁止第二套「待核」定义、禁止造假正数；客户端消费时缺省/缺 key 一律当 0（fail-closed）。
 */
export type BookPools = {
  /** 书级可练原子数（collectStudyAtoms({bookId}).length 同池）。 */
  atomCount: number;
  /** 书级待核 cite 数（collectCiteQueue({bookId}).length 同池）。 */
  pendingCount: number;
  /** 印刷页 → 该页可练原子数；与 collectStudyAtoms({bookId, page}).length 逐页等价（见下）。 */
  pageAtomByPage: Record<number, number>;
  /** 印刷页 → 该页待核 cite 数；与 collectCiteQueue({bookId, page}).length 逐页等价（见下）。 */
  pagePendingByPage: Record<number, number>;
};

/**
 * 一书宽收集再按页分组（brief 允许的实现，避免逐页全库扫描）：
 * - 待核：collectCiteQueue 的 ?page= 语义就是「收集后按 item.page 过滤」，故一书宽收集后
 *   按 it.page 分组与逐页调用逐字等价——与 /desk 页服务端 pendingByPage 同一写法。
 * - 原子：collectStudyAtoms({bookId, page}) = cardsCitingPage(page,{bookId}) 命中卡的
 *   全部 atoms——卡级命中（cites / fields[].cite / atoms[].cite 任一 page 命中即整卡入池），
 *   故「每卡算出自己命中的页集合，页集合内每页 += 该卡 atoms.length」与逐页调用等价。
 * map 里出现而 validPages 没有的页（如 cite 指向未解析页）只是多余 key，查表无害；
 * 反之未被任何卡引用的合法页不在 map，消费端 ?? 0 兜住（真实就是 0）。
 */
export function collectBookPools(bookId: string): BookPools {
  const bookQueue = collectCiteQueue({ bookId });
  const pagePendingByPage: Record<number, number> = {};
  for (const it of bookQueue) {
    pagePendingByPage[it.page] = (pagePendingByPage[it.page] ?? 0) + 1;
  }

  const pageAtomByPage: Record<number, number> = {};
  for (const c of loadCards({ bookId })) {
    const cited = new Set<number>();
    for (const x of c.cites) if (x.page != null) cited.add(x.page);
    for (const f of c.fields) if (f.cite?.page != null) cited.add(f.cite.page);
    for (const a of c.atoms) if (a.cite?.page != null) cited.add(a.cite.page);
    for (const p of cited) {
      pageAtomByPage[p] = (pageAtomByPage[p] ?? 0) + c.atoms.length;
    }
  }

  return {
    atomCount: collectStudyAtoms({ bookId }).length,
    pendingCount: bookQueue.length,
    pageAtomByPage,
    pagePendingByPage,
  };
}
