import { createSignal, Show, For, Index, Switch, Match, Component, ErrorBoundary } from 'solid-js';
import { Dynamic, Portal } from 'solid-js/web';

/**
 * Control Flow notes
 * 
 * These are a handful of examples demostrating how to do control flow tasks in Solid.
 * This is stuff like conditional display of components or rendering components based on a list.
 * 
 * Here Solid diverges from React in a significant way. Since it doesn't have a virtual DOM, using
 * techniques like Array.map() to render components based on a list would fully recreate those DOM
 * elements on every update. However, Solid has some special components that allow you to do that
 * in a more "Solid" way that prevents these sorts of wasteful operations. The examples below go 
 * through these Control Flow components.
 * 
 */

/**
 * Conditional Display - The Show Component
 */
function LogInOutButton() {
  const [loggedIn, setLoggedIn] = createSignal(false);
  const toggle = () => setLoggedIn(!loggedIn())
  
  /**
   * Solid is capable of handling basic conditionals like ternaries (a ? b : c) and booleans (a && b).
   * That said, using Show probably helps keep the pattern consistent across all the control flow options.
   * 
   * Show renders its children whenever the `when` prop is true. Otherwise it renders the `fallback` prop
   * if it exists. So below "Log out" is shown when the user is logged in, but "Log in" is shown when the
   * user is logged out.
   */
  return (
    <Show
      when={loggedIn()}
      fallback={<button onClick={toggle}>Log in</button>}
    >
      <button onClick={toggle}>Log out</button>
    </Show>
  );
};

/**
 * Rendering Lists - The For Component
 */
function ForExample() {
  const [cats, setCats] = createSignal([
    { id: 'J---aiyznGQ', name: 'Keyboard Cat' },
    { id: 'z_AbfPXTKms', name: 'Maru' },
    { id: 'OUtn3pvWmpg', name: 'Henri The Existential Cat' }
  ]);

  /**
   * Unlike with Show where using basic JS tools accomplishes more or less the same thing, For is significantly
   * more important to use. Using Array.map or similar tools is going to result in full recreation of those DOM Elements,
   * even if nothing has updated. However, when using the For component this is avoided as it can use Solid's signals to
   * render only when something has changed.
   * 
   * For's syntax is like a mixture of Array.forEach and Array.map - it has an `each` prop that takes an array. For's only child
   * should be a callback function that is basically just like the callback for Array.map - it is called once per element of the
   * array passed into the `each` props and has two arguments: the element of the array and the index. This callback should return
   * a node to render based on each element of the array.
   * 
   * Interestingly the index is a *signal* and not a constant number. For is apparently "keyed by reference" meaning that each node
   * that For renders is coupled to a specific element of the array.So, if the element changes places in the array the corresponding
   * node *moves with it* and the index is changed rather than being destroyed and recreated.
   */
  return (
    <ul>
      <For each={cats()}>{(cat, i) =>
        <li>
          <a target="_blank" href={`https://www.youtube.com/watch?v=${cat.id}`}>
            {i() + 1}: {cat.name}
          </a>
        </li>
      }</For>
    </ul>
  );
};

/**
 * Rendering Lists #2 - Index
 */
function IndexExample() {
  const [cats, setCats] = createSignal([
    { id: 'J---aiyznGQ', name: 'Keyboard Cat' },
    { id: 'z_AbfPXTKms', name: 'Maru' },
    { id: 'OUtn3pvWmpg', name: 'Henri The Existential Cat' }
  ]);
  
  /**
   * Index is identical in syntax to For. And it does more or less the same thing. So what's the point?
   * It's a bit complicated and if you want the longer explanation there's an excellent Stack Overflow
   * thread here: https://stackoverflow.com/questions/70819075/solidjs-for-vs-index
   * 
   * The jist of it is: For uses some more careful logic when determining if something should be re-rendered 
   * that saves a lot of time when you are rendering complex elements. However, the checking is somewhat wasteful
   * if the elements you are rendering are simple primatives like numbers or strings. 
   * 
   * Index does *not use this careful check*. This means that, in the best case, Index is faster. But in the 
   * average case Index will re-render more often. Index exists for when you are confident that the array you are 
   * rendering elements over are primitive values (like string and numbers) and that the DOM elements are relatively
   * simple. To quote the very helpful Stack Overflow user:
   * 
   * "In short, if you have an array of objects, use <For>. If you have and array of strings, and the array is short 
   * or you don't ever insert or remove elements in the middle of the array, use <Index>. Otherwise use <For>. If you 
   * are not sure, always use <For>."
   * 
   * This example is identical to the For example, other than using Index.
   */
  return (
    <ul>
      <Index each={cats()}>{(cat, i) =>
        <li>
          <a target="_blank" href={`https://www.youtube.com/watch?v=${cat().id}`}>
            {i + 1}: {cat().name}
          </a>
        </li>
      }</Index>
    </ul>
  );
}

/**
 * Complex Conditionals - Switch & Match
 */
function SwitchMatchExample() {
  const [x] = createSignal(11);

  /**
   * This is one that I like quite a bit. I've definitely experience the frustration of doing a series
   * of nested ternaries that are hard to follow or having to pull out the logic into an awkward switch
   * statement that then sort of breaks up the readability of the code. Solid solves that with the Switch
   * and Match components.
   * 
   * Working very similarly to a vanilla Switch statement in concept, Switch takes one prop, `fallback`,
   * which is what it renders if nothing else renders. The children of Switch are a series of Match components
   * that each have a `when` props that is a boolean. In order, Switch will check each Match and render the
   * first one that has a true `when` prop.
   * 
   * Note that if the x signal above is set to a number bigger than 10, the app will render the "greater than 10"
   * paragraph but will not render the "greater than Bob" paragraph. So, in comparing the Switch component to the
   * switch statement in vanilla JS - the Switch component can be thought of as automatically having a `break` after
   * each `case` (i.e. Match).
   */
  return (
    <Switch fallback={<p>{x()} is between 5 and 10</p>}>
      <Match when={x() > 10} >
        <p>{x()} is greater than 10</p>
      </Match>
      <Match when={x() > 10} >
        <p>{x()} is greater than Bob</p>
      </Match>
      <Match when={x() < 5}>
        <p>{x()} is less than 5</p>
      </Match>
    </Switch>
  );
}

/**
 * Complex Conditionals - Dynamic
 */
interface DynamicColorOptions {
  [key: string]: Component
}

const RedThing = () => <strong style="color: red">Red Thing</strong>;
const GreenThing = () => <strong style="color: green">Green Thing</strong>;
const BlueThing = () => <strong style="color: blue">Blue Thing</strong>;

const options:DynamicColorOptions = {
  red: RedThing,
  green: GreenThing,
  blue: BlueThing
}

function DynamicExample() {
  const [selected, setSelected] = createSignal("red");
  /**
   * Dynamic offers a slightly more concise way of making a decision on which components to show based
   * on a signal. Here, instead of using three different <Show> components in a row, we can use the
   * Dynamic component to pick the one we want (in this case from the options config). 
   */
  return (
    <>
      <select value={selected()} onInput={e => setSelected(e.currentTarget.value)}>
        <For each={Object.keys(options)}>{
          color => <option value={color}>{color}</option>
        }</For>
      </select>
      <Dynamic component={options[selected()]} />
    </>
  );
}

/**
 * Breaking the Normal Flow of Elements - Portal
 */
function PortalExample() {
  /**
   * Often when you want to make a modal or tooltip or something of the sort, you want to insert
   * the DOM element outside of the normal flow for ease of positioning, but would like to keep 
   * the component code in the appropriate context. This is where Portal comes in.
   * 
   * Anything placed inside a Portal component is inserted into a location of your choosing. By
   * default, Solid places your element in document.body, but you can change this using the
   * `mount` prop on Portal.
   */
  return (
    <div>
      <p>Just some text in the normal position, nothing to see here</p>
      <Portal>
        <div>
          <h1>This text was Portaled somewhere else!</h1>
          <p>That's crazy how'd this get here?</p>
        </div>
      </Portal>
    </div>
  );
}

/**
 * Capturing Errors - ErrorBoundary
 */
const Broken = () => {
  throw new Error("Oh No");
  return <>Never Getting Here</>
}

function ErrorExample() {
  /**
   * ErrorBoundary provides a straightforward wrapper for capturing unexpected errors. If no errors happen,
   * the children of ErrorBoundary are rendered normally. If a JS error happens that is otherwise uncaught,
   * ErrorBoundary will instead render its `fallback` prop.
   * 
   * This seems pretty useful as a tool for error handling, often this has to be manually implemented in some
   * way. I like that there's a simple way to capture these things in Solid.
   */
  return (
    <>
      <div>Before</div>
      <ErrorBoundary fallback={err => err}>
        <Broken />
      </ErrorBoundary>
      <div>After</div>
    </>
  );
}


function ControlFlowTutorial() {
  const [tutorials, setTutorials] = createSignal([
    { name: 'Show - Log In / Log Out Button', component: <LogInOutButton /> },
    { name: 'For - A List of Cat Videos', component: <ForExample /> },
    { name: 'Index - A List of Cat Videos', component: <IndexExample /> },
    { name: 'Switch & Match - Greater or Less Than', component: <SwitchMatchExample /> },
    { name: 'Dynamic - Color Things', component: <DynamicExample /> },
    { name: 'Portal - Unexpected Text Location', component: <PortalExample /> },
    { name: 'ErrorBoundary - Handling Unexpected Errors', component: <ErrorExample /> }
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

export default ControlFlowTutorial;
