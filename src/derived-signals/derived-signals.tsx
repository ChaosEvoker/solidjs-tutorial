import { createSignal } from "solid-js";

/**
 * Derived Signals notes
 * 
 * An important part of the performance of SolidJS is that component functions
 * will *only execute once*. Re-renders are accomplished through Signals and don't
 * re-execute the component functions. However, Solid still has a way to trigger
 * re-renders for values calculated from Signals.
 * 
 * Any new expression that depends on a Signal can be wrapped in a function. Any function
 * that accesses a Signal becomes a Signal itself. When called, these Derived Signals will
 * also update and re-render any readers that call them.
 * 
 * Note that "accessing" basically mean calling the getter function. Calling the setter function
 * will not cause something to become a signal.
 * 
 */

function DerivedSignals() {
  // Here is our base Signal, our count. Just like the previous examples.
  const [count, setCount] = createSignal(0);

  /**
   * This is a Derived Signal. doubleCount is a function that contains a call to the count
   * signal. As a result, Solid will recognize this and doubleCount becomes a Signal as well.
   * This means anything that calls doubleCount will also re-render if count changes.
   * 
   * Unlike Signals from createSignal, derived signals do not store a value or have a setter function.
   * They derive thier value from another signal and are tied to that signal's value.
   *
   */
  const doubleCount = () => count() * 2;
  
  // Just like in the first example, we'll auto increment the count once per second
  setInterval(() => setCount(count() + 1), 1000);

  // Finally, we display the count - but doubled. Just as a reminder, component with no signals will never
  // re-render or re-execute. This is why it's important that Solid creates a derived signal out of doubleCount.
  // If it didn't, then this view would never update, but since it converted doubleCount to a derived signal, this
  // view updates just like we'd expect it to.
  return <div>Count: {doubleCount()}</div>;
}

export default DerivedSignals;