import Callable from './callable'

const PRIVATE = Symbol("PRIVATE")
type PRIVATE = typeof PRIVATE

type Tick = {count: number}
const currentTick: Tick = {count: 0}

type VoidFunction = () => void

var currentReadObserver: ((cell: Cell<unknown>) => void) | undefined = undefined

type Listener<T> = (value: T) => void
interface Cell<T> {
  (this: unknown): T
  on(listener: Listener<T>): () => void
  off(listener: Listener<T>): void
}

abstract class BaseCell<T, TArgs extends any[], TReturn> extends Callable<TArgs, TReturn>{
  protected listeners = new Set<Listener<T>>()
  on(listener: Listener<T>): () => void{
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }
  off(listener: Listener<T>){
    this.listeners.delete(listener)
  }
  protected update(){

  }
}

class Data<T> extends BaseCell<T, [T?], T|void> implements Cell<T> {
  private value: T
  constructor(initialValue: T){
    super()
    this.value = initialValue
  }
  _call(newValue?: T){
    if (arguments.length) this.value = newValue as T
    else {
      currentReadObserver && currentReadObserver(this)
      return this.value
    }
  }
}
interface Data<T> extends Cell<T> {
  (newValue: T): void
}

class Computation<T> extends BaseCell<T, [], T> implements Cell<T> {
  private value!: T
  private func: () => T
  private dependencies = new Set<Cell<unknown>>()
  constructor(func: () => T){
    super()
    this.func = func
    this.recalculate()
  }
  private recalculate(){
    const dependencies = new Set<Cell<unknown>>()
    currentReadObserver = (dep) => {dependencies.add(dep)
    dep.on(this.recalculate)
    }
    this.value = this.func()
    currentReadObserver = undefined
    // unsubscribe from deps that weren't read from
    for (const oldDep of this.dependencies)
      if (!dependencies.has(oldDep)) oldDep.off(this.recalculate)
    
  }
  _call(this: this): T {
    currentReadObserver && currentReadObserver(this)
    return this.value
  }
}

function C<T>(value: () => T): Computation<T>
function C<T>(value: T): Data<T>
function C(value: any): Computation<any> | Data<any> {
  if (value instanceof Function) return new Computation(value)
  return new Data(value)
}

export default C

type PromiseState<T> = {state: 'waiting'} | {state: 'success', data: T} | {state: 'error', error: any}

function get<T>(func: () => Promise<T>): Cell<PromiseState<T>>{
  var latestPromiseGeneration = 0
  const promise = C(func)
  const output = C<PromiseState<T>>({state: 'waiting'})
  promise.on(prom => {
    const thisGeneration = ++latestPromiseGeneration
    prom.then(v => output({state: 'success', data: v}), e => output({state: 'error', error: e}))
  })
  return output
}