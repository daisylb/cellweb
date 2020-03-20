import test from "ava"
import C from "./index"

test("A data cell contains its value", t => {
  const data = C(1)
  t.is(data(), 1)
})

test("A computation cell contains its result", t => {
  const comp = C(() => 1)
  t.is(comp(), 1)
})

test("A data cell can have its value changed", t => {
  const data = C(1)
  data(2)
  t.is(data(), 2)
})

test("A computation reacts to a change in a dependency", t => {
  const data = C(1)
  const comp = C(() => data() * 2)
  t.is(comp(), 2)
  data(2)
  t.is(comp(), 4)
})

test("Computations drop dependencies not reused on update", t => {
  const a = C("a")
  const b = C("b")
  const switch_ = C(true)
  var callCount = 0
  const comp = C(() => (callCount++, switch_() ? a() : b()))
  // called once in the computation's constructor
  t.is(callCount, 1)
  t.is(comp(), "a")
  b("bb")
  t.is(callCount, 1)
  a("aa")
  t.is(callCount, 2)
  t.is(comp(), "aa")
  switch_(false)
  t.is(callCount, 3)
  t.is(comp(), "bb")
  a("aaa")
  t.is(callCount, 3)
  b("bbb")
  t.is(callCount, 4)
  t.is(comp(), "bbb")
})
