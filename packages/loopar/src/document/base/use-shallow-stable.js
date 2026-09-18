import { useRef } from "react";

/** Keeps the previous object while every value is shallow-equal (stable identity for memo deps). */
export function useShallowStable(next) {
  const ref = useRef(next);
  const prev = ref.current;
  const same = prev === next || (
    Object.keys(prev).length === Object.keys(next).length &&
    Object.keys(next).every((k) => Object.is(prev[k], next[k]))
  );
  if (!same) ref.current = next;
  return ref.current;
}
