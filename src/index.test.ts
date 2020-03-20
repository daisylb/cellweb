import test from 'ava'
import C from './index'

test('A data cell contains its value', t => {
  const data = C(1)
  t.is(data(), 1)
})

test('A computation cell contains its result', t => {
  const comp = C(() => 1)
  t.is(comp(), 1)
})

test('A data cell can have its value changed', t => {
  const data = C(1)
  data(2)
  t.is(data(), 2)
})