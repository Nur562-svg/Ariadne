/**
 * 键盘环共用判定：可编辑目标静默（客户端安全，无任何依赖）。
 * 同时看事件 target 与 document.activeElement——合成键盘事件（自动化/无焦点派发）
 * target 可能是 body，activeElement 兜底避免误触发练/核快捷键。
 */
export function isEditableTarget(target: EventTarget | null): boolean {
  function check(el: Element | null): boolean {
    if (!(el instanceof HTMLElement)) return false;
    return (
      el.tagName === "INPUT" ||
      el.tagName === "TEXTAREA" ||
      el.tagName === "SELECT" ||
      el.isContentEditable
    );
  }
  if (check(target instanceof Element ? target : null)) return true;
  if (typeof document !== "undefined") {
    if (check(document.activeElement)) return true;
  }
  return false;
}

/**
 * CitePeek「摘」浮层打开时置位（CitePeek 在 open effect 里 set / cleanup 清；
 * 旗标本体挂 document.body.dataset.ariadnePeek）。会话级键盘环
 * （StudySession / HeYeSession / StickyPageLoopKeys / ChapterPageReader 纸面键）
 * 开头读它让路：浮层开着不评分、不切题/章/页，关掉即恢复。
 */
export function isPeekOpen(): boolean {
  return typeof document !== "undefined" && document.body.dataset.ariadnePeek === "1";
}
