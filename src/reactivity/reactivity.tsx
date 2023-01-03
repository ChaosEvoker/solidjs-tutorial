import { batch, createEffect, createSignal, For, on, untrack } from "solid-js";

/**
 * Reactivity notes
 * 
 * Solid's reactive system is probably one of its most distiguishing features
 * seperating it from React. This tutorial will go over some differences as well
 * as ways to control the reactive system in Solid.
 */

/**
 * Batching
 * 
 * A major difference between Solid and React is that Solid's reactivity is
 * *synchronous*. This means that whenever a setter function is called, that
 * change will have taken place by the very next line of code. Normally, this
 * is fine because, as we have learned, Solid's updates are extremely granular
 * and multiple updates in a row updating different fields won't cause re-renders
 * of the same component. However, in some specific cases this won't be true and
 * updates to different signals will re-render the same component. For these cases,
 * Signal offers the `batch` function.
 */

/**
 * This first example demonstrates the problem. We have a button which
 * renders the full name of a person. However, this is a combination of
 * the `firstName` and `lastName` signals. Meaning, if we update both names
 * one after the other the button will render twice.
 */
const BadUpdateNameExample = () => {
  const [firstName, setFirstName] = createSignal("John");
  const [lastName, setLastName] = createSignal("Smith");
  const fullName = () => {
    // Watch for this log in particular. In this example you'll see this
    // log is run twice for each time we push the button. This means an
    // extra render is happening.
    console.log("Running FullName");
    return `${firstName()} ${lastName()}`
  } 
  const updateNames = () => {
    console.log("Button Clicked");
    setFirstName(firstName() + "n");
    setLastName(lastName() + "!");
  }
  
  return <button onClick={updateNames}>My name is {fullName()}</button>
};

/**
 * In this example, we fix the extra rendering issue by using the `batch`
 * function. This function will queue up changes and apply them all at the
 * same time before notifying any observers.
 */
const GoodUpdateNameExample = () => {
  const [firstName, setFirstName] = createSignal("John");
  const [lastName, setLastName] = createSignal("Smith");
  const fullName = () => {
    // Watch this console again, now it should only print once per button push
    console.log("Running FullName");
    return `${firstName()} ${lastName()}`
  } 
  const updateNames = () => {
    console.log("Button Clicked");
    // Here's the batch call, this waits and updates both names at once to avoid
    // the extra renders from the previous example.
    batch(() => {
      setFirstName(firstName() + "n");
      setLastName(lastName() + "!");
    })
  }
  
  return <button onClick={updateNames}>My name is {fullName()}</button>
};

/**
 * Read without subscribing
 * 
 * In some circumstances we may want to read a signal without subscribing to
 * it. This avoid creating a derived signal, for example, in a case where we might
 * not want to permanently tie in a function to the reactive system. For this, Solid has
 * the `untrack` function.
 */
const UntrackExample = () => {
  const [a, setA] = createSignal(1);
  const [b, setB] = createSignal(1);

  createEffect(() => {
    // Here is where untrack is used. It calls whatever function
    // is passed into it without causes the caller to be tied into
    // the reactive system. As a result, this createEffect does *not*
    // trigger on changes to b. So, while b is updated correctly when
    // the button is pushed, the numbers are only printed to the console
    // when a changes.
    console.log(a(), untrack(b));
  });

  return <>
    <button onClick={() => setA(a() + 1)}>Increment A</button>
    <button onClick={() => setB(b() + 1)}>Increment B</button>
  </>
};

/**
 * On - Refining control of reactive computations
 * 
 * There are some times where we want to be more explicit about the dependencies
 * of our computations. Also, there are times where we may want to run certain
 * computations only when a value changes but not on initial load. For these times,
 * Solid has a function called `on`. This function lets us more explicitly define our
 * dependencies for calculations (like effects) while also having them only run on
 * a change to the initial value.
 */
const OnExample = () => {
  const [a, setA] = createSignal(1);
  const [b, setB] = createSignal(1);

  /**
   * Similarly to the last example, this example prints the numbers when a changes
   * but not when b changes. This time, we accomplish this via `on`. When we call it,
   * we explicity subscribe to `a` and so updates to `b` do not trigger the callback
   * passed to the `on` function. 
   * 
   * The { defer: true } option also tells Solid not to run this calculation on initial 
   * load. So, unlike the previous example the numbers will not be printed to the screen 
   * when the app loads, only when A is updated from its starting value.
   */
  createEffect(on(a, (a) => {
    console.log('On example: ', a, b());
  }, { defer: true }));

  return <>
    <button onClick={() => setA(a() + 1)}>Increment A</button>
    <button onClick={() => setB(b() + 1)}>Increment B</button>
  </>
};


function ReactivityTutorial() {
  const [tutorials, setTutorials] = createSignal([
    { name: 'Batching - Update a name without batching', component: <BadUpdateNameExample /> },
    { name: 'Batching - Updating a name with batching', component: <GoodUpdateNameExample /> },
    { name: 'Untrack - Print on A but not on B', component: <UntrackExample /> },
    { name: 'On - Print on A but not on B (a different way)', component: <OnExample /> },
  ])
  return (
    <>
      <For each={tutorials()}>
        {(tutorial) => 
          <>
            <div style={{ "border-bottom": '1px solid black', width: '100%', margin: '24px' }}>{tutorial.name}</div>
            <div style={{ margin: '24px' }}>{tutorial.component}</div>
          </>
        }
      </For>
    </>
    
  );
}

export default ReactivityTutorial;