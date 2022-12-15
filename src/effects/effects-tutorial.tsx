import { render } from 'solid-js/web';
import { createSignal, createEffect } from 'solid-js';

/**
 * Effects notes
 * 
 * Next up is createEffect. This is most similar to useEffect from React. However, unlike in React
 * you do *not list dependencies* for the effect. All Solid Effects are automatically subscribed
 * to any Signal called inside their function body and will rerun if the value of that Signal changes.
 */
function EffectsTutorial() {
  // Creating a signal for the count like in the previous tutorial
  const [count, setCount] = createSignal(0);

  // Here we establish an effect that logs out the current count. Since we call count() inside the
  // Effect's function, this effect is automatically subscribe to the count Signal and the effect will
  // rerun whenever count changes.
  createEffect(() => {
    console.log("The count is now", count());
  });

  // Then we just make a button with an onClick that increments the count just like the previous example
  // did on an interval. If you look in the console you will see the console logs the updated count each time
  // the button is clicked.
  return <button onClick={() => setCount(count() + 1)}>Click Me</button>;
}

export default EffectsTutorial;
