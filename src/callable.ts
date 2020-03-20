abstract class Callable<TArgs extends any[], TReturn> extends Function {
  constructor(){
    super()
    return new Proxy(this, {
      apply: (target, thisArg, args) => target._call.apply(this, args)
    })
  }
  abstract _call(this: this, ...args: TArgs): TReturn
}
interface Callable<TArgs extends any[], TReturn> {
  (this: unknown, ...args: TArgs): TReturn
}
export default Callable