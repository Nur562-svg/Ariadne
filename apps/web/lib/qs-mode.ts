/**
 * T36 A 共用小 helper：把 href 的 ?mode= 换成指定档（无则补上），其余 qs 原样保留。
 * 只动 mode 一个参数——绝不重写/再解析 book/chapter/card/page（那是各页 qs helper 的职责），
 * 供 study/review 页头、书桌书头/Quiz、卡枢纽、书架、Clew Queue/Changes 从同一对
 * progress* 与 strip* href 派生分段深链，不出现第二套 scope 解析。
 * 放 lib（无 "use client"）：server component（study/review/书架/卡详情页）与
 * client 岛（DocumentPane/ClewPane）都能直接调用——挂进 client 组件文件会被
 * App Router 当 client reference，server 侧调用即报错。
 */
export function withQsMode(href: string, mode: string): string {
  const i = href.indexOf("?");
  const params = new URLSearchParams(i >= 0 ? href.slice(i + 1) : "");
  params.set("mode", mode);
  return `${i >= 0 ? href.slice(0, i) : ""}?${params.toString()}`;
}
