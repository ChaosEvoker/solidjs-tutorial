import { createSignal } from "solid-js";

/**
 * Signals Notes
 * 
 * Signals are essentially Solid's version of React's state. createSignal is conceptually almost
 * identical to useState from react, but it differs in a few important ways. 
 * 
 * This demo is counter that increments itself once a second and displays it in the DOM to demonstrate
 * the basics of Signals in SolidJS.
 *
 */

function SignalTutorial() {
  /**
   * So here's a createSignal example. Just like useState from React, this can be destructured
   * into two values, the second of which is a setter function for the state value.
   * 
   * However, in Solid the first value is a *getter function* and not the value itself.
   */
  const [count, setCount] = createSignal(0);

  // Here you can see the use of both the getter and the setter function returned from createSignal
  // setCount works just as you'd expect from React, when called it updates the state value with what it is passed
  // Notice that unlike React, count is a *function* and not a number. When called it returns the state value.
  setInterval(() => setCount(count() + 1), 1000);

  // Setter fuctions also have a neat feature where instead of passing a new value you can pass a function whose
  // first argument is the current value of the state and returns the new value of the state.
  // The code below does the same thing as the previous line of code.
  // setInterval(() => setCount(c => c + 1), 1000);

  return <div>Count: {count()}</div>;
}

export default SignalTutorial;