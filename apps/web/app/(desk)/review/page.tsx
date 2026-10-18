import Link from "next/link";

export const dynamic = "force-dynamic";

/**
 * /review stub（desk-ia 已定独立路由）：DueCard 占位。
 * 无 FSRS 调度、无评分写入——诚实展示「今天没有到期卡」，链回书桌与学习环。
 */
export default function ReviewPage() {
  return (
    <div className="mx-auto w-full max-w-2xl px-8 py-16">
      <h1 className="brand-rule pb-2 text-3xl font-bold">复习</h1>
      <p className="mt-6 text-lg leading-8 text-foreground/90">今天没有到期卡。</p>
      <p className="mt-3 text-sm leading-7 text-muted">
        FSRS 复习调度尚未接入（后续版本）。当前的自评进度保存在本浏览器，可在学习环继续「认识 / 不熟」。
      </p>
      <div className="mt-10 flex flex-wrap items-center gap-5">
        <Link
          href="/desk"
          className="rounded-md bg-cinnabar px-5 py-2.5 text-white no-underline"
        >
          回书桌 →
        </Link>
        <Link
          href="/study"
          className="text-sm text-cinnabar no-underline hover:underline underline-offset-4"
        >
          去学习环 /study →
        </Link>
      </div>
    </div>
  );
}
