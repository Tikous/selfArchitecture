// 写hooks常用的几个api，useMemo useCallback useState

import { useCallback, useState } from "react"
import { Draft, freeze, produce } from 'immer'

export type DraftFunction<S> = (draft: Draft<S>) => void
export type Updater<S> = (arg: S | DraftFunction<S>) => void
export type ImmerHook<S> = [S, Updater<S>]
// ts函数签名
export function useImmer<S = unknown>(initialValue: S | (() => S)) : ImmerHook<S>

export function useImmer<T>(initialValue: T) {
  const [state, setState] = useState(
    // 使用freeze冻结对象，防止原始对象被修改
    freeze(typeof initialValue === 'function' ? initialValue() : initialValue, true)
  )

  return [state, useCallback((updater: T | DraftFunction<T>) => {
    if (typeof updater === 'function') {
      setState(produce(updater as DraftFunction<T>))
    } else {
      setState(freeze(updater))
    }
  }, [])]
}

// const [state, setState] = useImmer({
//   a: 123
// });
// const [state, setState] = useImmer(function() {
//   return {a : 123}
// });
// setState((darft) => {
//   darft.a = 456
// })
// console.log(state, setState);