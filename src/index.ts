import Callable from "./callable"

const value = Symbol("value")
type value = typeof value

class Clock {
  ticking = false
  queue: [Cell<any>, any, Iterable<(value: any) => void>][] = []
  tick<T>(cell: Cell<T>, newValue: T, listeners: Iterable<(value: T) => void>) {
    this.queue.push([cell, newValue, listeners])
    if (!this.ticking) {
      this.ticking = true
      for (var i = 0; ; i++) {
        const oldQueue = this.queue
        this.queue = []
        for (const [cell, newValue, _] of oldQueue) cell[value] = newValue
        for (const [cell, newValue, listeners] of oldQueue)
          for (const listener of listeners) listener(newValue)
        if (!this.queue.length) break
        if (i > 50)
          throw new Error(
            "Maximum number of ticks exceeded, do you have a circular dependency?",
          )
      }
      this.ticking = false
    }
  }
}

const clock = new Clock()

var currentReadObserver: ((cell: Cell<unknown>) => void) | undefined = undefined

type Listener<T> = (value: T) => void
interface Cell<T> {
  [value]: T
  (this: unknown): T
  on(listener: Listener<T>): () => void
  off(listener: Listener<T>): void
}

abstract class BaseCell<T, TArgs extends any[], TReturn> extends Callable<
  TArgs,
  TReturn
> {
  [value]!: T
  protected listeners = new Set<Listener<T>>()
  on(listener: Listener<T>): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }
  off(listener: Listener<T>) {
    this.listeners.delete(listener)
  }
  protected update(newValue: T) {
    clock.tick(this as any, newValue, this.listeners)
  }
}

class Data<T> extends BaseCell<T, [T?], T | void> implements Cell<T> {
  constructor(initialValue: T) {
    super()
    this[value] = initialValue
  }
  _call(newValue?: T) {
    if (arguments.length) this.update(newValue!)
    else {
      currentReadObserver && currentReadObserver(this)
      return this[value]
    }
  }
}
interface Data<T> extends Cell<T> {
  (): T
  (newValue: T): void
}

class Computation<T> extends BaseCell<T, [], T> implements Cell<T> {
  private func: () => T
  private dependencies = new Set<Cell<unknown>>()
  constructor(func: () => T) {
    super()
    this.func = func
    this.recalculate = this.recalculate.bind(this)
    this.recalculate()
  }
  private recalculate() {
    const dependencies = new Set<Cell<unknown>>()
    const oldReadObserver = currentReadObserver
    currentReadObserver = dep => {
      dependencies.add(dep)
      dep.on(this.recalculate)
    }
    const newValue = this.func()
    currentReadObserver = oldReadObserver
    // unsubscribe from deps that weren't read from
    for (const oldDep of this.dependencies)
      if (!dependencies.has(oldDep)) oldDep.off(this.recalculate)
    this.dependencies = dependencies
    this.update(newValue)
  }
  _call(this: this): T {
    currentReadObserver && currentReadObserver(this)
    return this[value]
  }
}

function C<T>(value: () => T): Computation<T>
function C<T>(value: T): Data<T>
function C(value: any): Computation<any> | Data<any> {
  if (value instanceof Function) return new Computation(value)
  return new Data(value)
}

export default C

// type PromiseState<T> =
//   | { state: "waiting" }
//   | { state: "success"; data: T }
//   | { state: "error"; error: any }

// function get<T>(func: () => Promise<T>): Cell<PromiseState<T>> {
//   var latestPromiseGeneration = 0
//   const promise = C(func)
//   const output = C<PromiseState<T>>({ state: "waiting" })
//   promise.on(prom => {
//     const thisGeneration = ++latestPromiseGeneration
//     prom.then(
//       v => output({ state: "success", data: v }),
//       e => output({ state: "error", error: e }),
//     )
//   })
//   return output
// }
