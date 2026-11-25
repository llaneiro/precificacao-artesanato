// Cursor baseado exclusivamente no timestamp do servidor, sem relógio do aparelho.
export type SyncCursor = {seconds:number;nanoseconds:number};
export type SyncCursors = Record<string,SyncCursor>;
export function validCursor(value:unknown):value is SyncCursor {
  if(!value||typeof value!=='object')return false;
  const v=value as SyncCursor;
  return Number.isSafeInteger(v.seconds)&&v.seconds>=0&&Number.isInteger(v.nanoseconds)&&v.nanoseconds>=0&&v.nanoseconds<1_000_000_000;
}
export function laterCursor(a:SyncCursor|undefined,b:SyncCursor):SyncCursor{
  return !a||b.seconds>a.seconds||(b.seconds===a.seconds&&b.nanoseconds>a.nanoseconds)?b:a;
}
