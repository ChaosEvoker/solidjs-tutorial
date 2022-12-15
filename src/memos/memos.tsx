import { createSignal, createMemo } from 'solid-js';

/**
 * Memos Notes
 * 
 * Memos are basically the same as React's useMemo. It can cache calculations such that
 * repeated calls to the function it returns aren't recalculated as long as the dependency
 * doesn't change. The only distinction between React and Solid here is that just like createEffect,
 * createMemo doesn't require you to register the dependencies with the function. Solid derives it
 * from the content of the Memo function.
 * 
 */

// Just a standard fibonacci number implementation
const fibonacci = (num:number):number => {
  if (num <= 1) return 1;

  return fibonacci(num - 1) + fibonacci(num - 2);
};

function Memos() {
  // Create a signal for a count (start at 10 this time)
  const [count, setCount] = createSignal(10);

  // createMemo here returns a function that does the same thing as the function passed to it.
  // The data dependency and caching is all done by Solid. From Solid's perspective Memos are
  // both observers (like an Effect) and a read-only Signal. Memos in particular are better to
  // use than Effects that write to Signals (aka call a Signal's setter function)
  const fib = createMemo(() => {
    console.log('Calculating Fibonacci');
    return fibonacci(count());
  });

  // You can see that each time we click the button the count increases, like previously.
  // But you can see that fib is called here 50 times per render. Had we done this with 
  // a derived signal that calculation would be done 50 times. But if you look at the
  // console you'll notice the 'Calculating Fibonacci' message only appears once per click!
  return (
    <>
      <button onClick={() => setCount(count() + 1)}>Count: {count()}</button>
      <div>1. {fib()} {fib()} {fib()} {fib()} {fib()}</div>
      <div>2. {fib()} {fib()} {fib()} {fib()} {fib()}</div>
      <div>3. {fib()} {fib()} {fib()} {fib()} {fib()}</div>
      <div>4. {fib()} {fib()} {fib()} {fib()} {fib()}</div>
      <div>5. {fib()} {fib()} {fib()} {fib()} {fib()}</div>
      <div>6. {fib()} {fib()} {fib()} {fib()} {fib()}</div>
      <div>7. {fib()} {fib()} {fib()} {fib()} {fib()}</div>
      <div>8. {fib()} {fib()} {fib()} {fib()} {fib()}</div>
      <div>9. {fib()} {fib()} {fib()} {fib()} {fib()}</div>
      <div>10. {fib()} {fib()} {fib()} {fib()} {fib()}</div>
    </>
  );
}

export default Memos;
