import { Accessor, createContext, createSignal, JSX, onCleanup, useContext } from "solid-js";
import { createStore, reconcile } from "solid-js/store";
import { For } from "solid-js/web";
import reduxStore from './redux-store';
import externalCounter from './counter';

/**
 * Data Flow in Solid notes
 * 
 * An important part of any framework is how data can flow through the application.
 * We've seen all the ways state data can be created and maniuplated in Solid and
 * how the rective system responds to that. But, pushing data only through props
 * is extremely cumbersome - especially in larger applications.
 * 
 * Fortunately Solid has a couple ways of managing data flow in the application.
 */

/**
 * Data Flow using Context
 * 
 * We'll start with one way of doing data flow that should be very familiar to
 * React developers: Context. Solid's Context API works virtually identically to
 * React's Context API. Solid's Context API is fully integrated with their reactive
 * system. Here's a simple counter button app showing how to use Context in Solid:
 */
interface CounterProps {
  count: number;
  children: JSX.Element;
}
interface CounterContext {
  count: Accessor<number>;
  increment: () => void;
  decrement: () => void;
}

// Just like React, `createContext` returns an object with a Provider component
// Whatever you pass into `createContext` is the default value
const CounterContext = createContext<CounterContext>({
  count: () => 0,
  increment: () => {},
  decrement: () => {}
});

/**
 * This just wraps the default Provider component with another component
 * that is specifically configured for the specific Context.
 */
export function CounterProvider(props:CounterProps) {
  const [count, setCount] = createSignal(props.count || 0);

  return (
    <CounterContext.Provider value={{
      count,
      increment() { setCount(c => c + 1) },
      decrement() { setCount(c => c - 1) }
    }}>
      {props.children}
    </CounterContext.Provider>
  );
}

// Same here, it's common practice to wrap up the consumer to make it easier to use.
export function useCounter() { return useContext(CounterContext); }

/**
 * Here we are finally consuming the context. You can see that the data provided in
 * the value prop of the Provider is returned from the consumer function (`useCounter`).
 * `count` is a signal getter function, and `increment` and `decrement` are derived
 * signals that use the `setCount` setter function to change the value.
 */
function Nested() {
  const { count, increment, decrement } = useCounter();
  return (
    <>
      <div>{count()}</div>
      <button onClick={increment}>+</button>
      <button onClick={decrement}>-</button>
    </>
  );
};

/**
 * This wrapper is here to show how Context lets you pull in data at the point
 * of consumption rather than needing to be pushed down through the application
 * manually.
 */
function Counter() {
  return <>
    <h1>Welcome to Counter App</h1>
    <Nested />
  </>
};

/**
 * Here we initialize the Provider at the top level of the example, allowing everything
 * underneath the provider to access the counter context.
 */
function ContextExample() {
  return (
    <CounterProvider count={1}>
      <Counter />
    </CounterProvider>
  )
}

/**
 * Handling Data Flow with Immutable Libraries using `reconcile`
 * 
 * Sometimes we might prefer or have to integrate with data flow libraries that are
 * immutable like Redux, Apollo, or XState. Since Solid doesn't diff by default this
 * can result in some undesirable results. The `reconcile` function provides us a way
 * to avoid these issues. The full details of `reconcile` are too complex to fully
 * cover in this tutorial, especially since the use cases for these more advanced uses
 * of `reconcile` tend to be a need to handle specific needs of complex interactions.
 * However, this tutorial should give you a basic idea of what `reconcile` does and how
 * it can solve some problems.
 * 
 * Here's a simple example of a Redux integration with Solid using `reconcile`:
*/
interface TodoItem {
  id: number;
  text: string;
  completed: boolean;
}

let nextTodoId = 0;
const actions = {
  addTodo: (text:string) => ({ type: "ADD_TODO", id: ++nextTodoId, text }),
  toggleTodo: (id:number) => ({ type: "TOGGLE_TODO", id })
};

// Normally, it'd be better to type the stores/actions but since we are just
// trying to make an example, we'll just use any for now.
function useRedux(store:any, actions:any) {
  const [state, setState] = createStore<TodoItem[]>(store.getState());
  const unsubscribe = store.subscribe(
    /**
     * This line here is where most of the lesson here is. Here we connect up
     * the Redux store (store.getState()) with the Solid store (setState).
     * However, how we go about this matters.
     * 
     * Solid doesn't diff by default. So, when Redux returns its immutable state to 
     * Solid, Solid assumes the item is new and replaces it. As a result, if you pay
     * attention to the console, you'll notice that we again have the issue where
     * the components are re-rendered when the checkboxes are toggled.
     * 
     */
    () => setState(store.getState())
    /**
     * If you comment out the line above and uncomment the line below the extra renders
     * problem is solved. The `reconcile` function essentially performs a diff between
     * the two immutable stores and performs only the granular updates.
     */
    // () => setState(reconcile(store.getState()))
  );
  onCleanup(() => unsubscribe());
  return [
    state,
    mapActions(store, actions)
  ];
};

// This is just some Redux stuff, nothing relevant to Solid here.
// If you need an overview of Redux, I'd recommend following a tutorial
// on that specifically. Anyway, nothing here is relevant for our learning
// about Solid
function mapActions(store:any, actions:any) {
  const mapped:any = {};
  for (const key in actions) {
    mapped[key] = (...args: any) => store.dispatch(actions[key](...args));
  }
  return mapped;
}

const ReduxTodo = () => {
  const [store, { addTodo, toggleTodo }] = useRedux(
    reduxStore,
    actions
  );
  let input:HTMLInputElement | undefined;
  return (
    <>
      <div>
        <input ref={input} />
        <button
          onClick={(e) => {
            if (!input?.value.trim()) return;
            addTodo(input.value);
            input.value = "";
          }}
        >
          Add Todo
        </button>
      </div>
      <For each={store.todos}>
        {(todo:TodoItem) => {
          const { id, text } = todo;
          console.log("Create", text)
          return <div>
            <input
              type="checkbox"
              checked={todo.completed}
              onchange={[toggleTodo, id]}
            />
            <span
              style={{ "text-decoration": todo.completed ? "line-through" : "none"}}
            >{text}</span>
          </div>
        }}
      </For>
    </>
  );
};

/**
 * Simple Data Flow - No Context
 * 
 * Context is extremely useful, and it handles a lot for us (like injection, 
 * tying ownership to the reactive graph, and automatically managing disposal).
 * That said, Context isn't always neccesary and can be too much for a need. It
 * is possible in Solid to build a reactive data store but creating a signal at a
 * global scope and exporting it. 
 * 
 * In counter.tsx (imported at the top of this file), we do exactly this. It's a
 * simple counter signal that we export and is used in this example. You can see
 * that even though the signal is created in its own module, the reactivity still
 * works just as intended.
 * 
 * The only restriction on this is that all computations (EFfects and Memos) need to
 * be under a reactive root. You can create this with Solid's `createRoot`, but Solid's
 * `render` does this automatically as well.
 * 
 * Ultimately, if you're going to do anything complex you're probably better off creating
 * a Context, but this is an option to consider.
 */
function ExternalSignalExample() {
  const { count, doubleCount, increment } = externalCounter;

  return (
    <button type="button" onClick={increment}>
      {count()} {doubleCount()}
    </button>
  );
}

function DataFlowTutorial() {
  const [tutorials, setTutorials] = createSignal([
    { name: 'Context API - A Simple Counter', component: <ContextExample /> },
    { name: 'reconcile and Redux - Yet Another Todo List', component: <ReduxTodo /> },
    { name: 'External Signal - Another Counter', component: <ExternalSignalExample /> },
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

export default DataFlowTutorial;