import { createResource, createSignal, For, lazy, Match, Suspense, SuspenseList, Switch, useTransition } from "solid-js";
import fetchProfileData, { Post, User } from "./mock-api";
import "./styles.css";

/**
 * Async notes
 * 
 * When writing modern web applications, the ability to do tasks
 * asynchronously is extremely important for performance. This
 * tutorial goes over various tools that Solid has to accomplish
 * various tasks in async ways that can help improve performance,
 * particularly in larger applications.
 */

/**
 * Lazy - Loading components only when rendered
 * 
 * Just like many bundlers handle code splitting to only load code when
 * it will be used via dynamic imports, Solid offers a way to lazy load
 * components and have them only load when rendered. `lazy` returns a component
 * that can be used normally, except that it dynamically loads the underlying
 * code only when it is rendered for the first time, halting that branch of
 * rendering until the underlying code is available.
 */

// Instead of: import Greeting from "./greeting"
const Greeting = lazy(() => import("./greeting"));

// Probably this lazy load still goes too fast to notice the difference. If you
// want to "see" the lazy load in action - you can use this version which
// artificially slows it down by a couple seconds:
// const Greeting = lazy(async () => {
//   // simulate delay
//   await new Promise(r => setTimeout(r, 2000))
//   return import("./greeting")
// });

function LazyLoadExample() {
  return (
    <>
      <h1>Welcome</h1>
      <Greeting name="Jake" />
    </>
  );
}

/**
 * createResource - Signals for async loading
 * 
 * Pretty much all modern web applications interact with some kind of
 * async resource, like a REST API. Solid has a way of wrapping up these
 * resources to use in a way that makes them easy to use in Solid's
 * distributed execution model. This is somewhat in contrast to the idea
 * behind async/await where the idea is to force async into a sequential
 * execution. The goal is to not block execution while still maitaining
 * clear and understandable code. Solid has a special signal creator to
 * accomplish this goal: createResource.
 * 
 * createResource creates a Signal that is provided an async fetcher of some
 * kind that returns a promise. As long as it returns a promise, the fetcher
 * function can be anything. The resulting signal has not just the value, but
 * various special values to check the state of the async resource. This includes
 * `loading`, `error`, and `state` (which has more granular descriptions of 
 * the current state of an async call - see the offical docs for more details).
 * 
 * Also, the resource returns 2 functions to help with the use of this resource:
 * 
 * mutate  - This is essentially the setter function for the signal which allows us
 *           to directly change the value with our own changes.
 * refetch - This allows us to re-run the fetcher function directly.
 * 
 * Finally there are two ways to create a resource. The first is to simply use a
 * fetching function:
 * 
 * const [data, { mutate, refetch }] = createResource(fetchData);
 * 
 * This immediately fetches the data when created initially. From there, it will be up
 * to us to handle the data, including any need to call `refetch` to pull down the latest
 * data from that resource.
 * 
 * The second way to create a resource is to also provide it with a source signal:
 * 
 * const [sourceSignal, setSourceSignal] = createSignal();
 * const [data, { mutate, refetch }] = createResource(sourceSignal, fetchData);
 * 
 * When a source signal is provided the fetcher will not be called until the sourceSignal
 * has value other than `false`, `null`, or `undefined`. If the initial value for the signal
 * is not one of those, the fetcher will be called immediately. Additionally, the fetcher is
 * called whenever the value of the source signal is updated. This allows us to automatically
 * retrieve data from the async endpoint reactively if a change in the data would mean we
 * would need to refetch data.
 * 
 * This example uses the second method of creating a resource:
 * 
 */

// This is our fetcher function. It's a fairly basic async call using `fetch`
// to get some data from a REST API and return it as json
const fetchUser = async (id:string) =>
  (await fetch(`https://swapi.dev/api/people/${id}/`)).json();

const FetchExample = () => {
  // Create a basic signal that is just the userId of the input
  const [userId, setUserId] = createSignal<string>();
  // Create a resource with a the userId as the source signal. This
  // means whenever the userId source signal changes, Solid will 
  // automatically refetch the data using the fetchUser fetcher function
  const [user, { mutate, refetch }] = createResource(userId, fetchUser);

  return (
    <>
      <input
        type="number"
        min="1"
        placeholder="Enter Numeric Id"
        onInput={(e) => setUserId(e.currentTarget.value)}
      />
      {/** 
       * Here we use the `mutate` function returned by createResource to 
       * clear the data from the screen by directly changing the value of 
       * the resource to be undefined.
       */}
      <button onClick={() => mutate(undefined)} style={{'margin-left': '6px'}}>Clear Data</button>
      {/** 
       * Here we use the `refetch` function to provide a button to manually retrieve the data from
       * the API. The functionality of this can mainly be seen after using the Clear Data button. This
       * button will immediate retrieve the data again using the current value of userId
       */}
      <button onClick={() => refetch()} style={{'margin-left': '6px'}}>Fetch Data</button>
      {/** 
       * Here we use the `loading` property of the resource to show
       * a loading message while we wait for the API to respond
       */}
      <div>{user.loading && "Loading..."}</div>
      <div>
        <pre>{JSON.stringify(user(), null, 2)}</pre>
      </div>
    </>
  );
};

/**
 * Suspense - Handling display of async tasks
 * 
 * Solid has a built in component for managing the UI display of elements which
 * are dependent on an async resource. The <Suspense> component automatically
 * detects any async reads in its descendants and displays a fallback view until
 * all of its descendants are resolved.
 * 
 * <Suspense> components can be nested. When nested, only the nearest ancestor will
 * detect loading states and display its fallback. Suspense components higher up the
 * tree will ignore any loading states underneath a descendant Suspense.
 * 
 * Importantly, it is the read of an async value that triggers Suspense. If a resource
 * signal isn't read, it will not suspend. This means that if you fetch a resource without
 * reading it, Suspense will not trigger and will not show the fallback. 
 * 
 * Here's an example:
 */
const SlowGreeting = lazy(async () => {
  // simulate delay
  await new Promise(r => setTimeout(r, 2000))
  return import("./greeting")
});

function SuspenseExample() {
  return (
    <>
      <h1>Welcome</h1>
      <Suspense fallback={<p>Loading...</p>}>
        <SlowGreeting name="Greg" />
      </Suspense>
    </>
  );
}

/**
 * SuspenseList - Handling mulitple async tasks
 * 
 * Solid has a new-ish feature to handle the complexity of dealing with multiple async
 * tasks running in parallel and resolving those in the UI in a clear way. The
 * <SuspenseList> component gives you the ability to control when and how those tasks
 * resolve in their display, allowing you to keep the UI always displaying in a clear
 * state and without tons of different loading messages and spinners everywhere.
 * 
 * This is still considered a bit of an experimental feature, and as such is not fully
 * support by server side rendering. Use it with caution if you are using something like
 * Next.js
 */

// Here we just set up a few simple display components
const ProfileDetails = (props:{ user: User | undefined }) => <h1>{props.user?.name}</h1>;
const ProfileTimeline = (props:{ posts: Post[] | undefined }) => (
  <ul>
    <For each={props.posts}>{(post) => <li>{post.text}</li>}</For>
  </ul>
);
const ProfileTrivia = (props:{ trivia: Post[] | undefined }) => (
  <>
    <h2>Fun Facts</h2>
    <ul>
      <For each={props.trivia}>{(fact) => <li>{fact.text}</li>}</For>
    </ul>
  </>
);

/**
 * This component utilizes the SuspenseList to organize how it displays the various
 * async resources as they resolve. There are two props used to control their display:
 * revealOrder and tail. Here's their possible values and how each works:
 * 
 * revealOrder controls the order in which any <Suspense> components are shown:
 * 
 *     forwards  - Components appear in the order they appear in the tree.
 * 
 *     backwards - Components appear in the reverse order of how they appear in the tree.
 * 
 *     together  - Each component waits until all the components have finished loading.
 * 
 * tail controls how each Suspense components renders based on the order given from revealOrder:
 * 
 *     collapsed - The fallback is only displayed for the next component in order. Once it is 
 *                 finished, the next in the order shows its fallback (if still loading)
 *                 or is displayed immediately (if it has already finished). This continues
 *                 down the chain until all Suspense components have resolved.
 * 
 *     hidden    - Identical to collapsed but rather than displaying the fallback of the next
 *                 unfinished component, instead completely hide unfinished components.
 * 
 *     undefined - tail is an optional prop. When not provided all components display their
 *                 fallback options until they finish loading.
 * 
 * Feel free to change them up in the example here and see how that changes the behavior of the example.
 */
const ProfilePage = (props:{ user: User | undefined, posts: Post[] | undefined, trivia: Post[] | undefined }) => (
  <SuspenseList revealOrder="together" tail="collapsed">
    <ProfileDetails user={props.user} />
    <Suspense fallback={<h2>Loading posts...</h2>}>
      <ProfileTimeline posts={props.posts} />
    </Suspense>
    <Suspense fallback={<h2>Loading fun facts...</h2>}>
      <ProfileTrivia trivia={props.trivia} />
    </Suspense>
  </SuspenseList>
);

/**
 * Notice this is also a decent example of how nested Suspenses work. You'll notice
 * in the example that the fallback of the top level Suspense below displays at first
 * until the `user` async call finishes. Since the ProfileDetails component is not wrapped
 * in a Suspense, and the others are, the top level suspense ignores all the Suspense wrapped
 * descendants, and only watches for the user task to resolve before displaying normally.
 */
const SuspenseListExample = () => {
  const { user, posts, trivia } = fetchProfileData();
  return (
    <Suspense fallback={<h1>Loading...</h1>}>
      <ProfilePage user={user()} posts={posts()} trivia={trivia()} />
    </Suspense>
  );
};

/**
 * Transitions - Handling async tasks in a larger UI context
 * 
 * Suspense offers a lot of excellent control on how we display things on initial loading.
 * However, espeically in more complex UIs, it can be jarring to return to a fallback state
 * any time a small async task is triggered. For these situations, Solid has the `useTransition`
 * function. This function provides us a pending indicator and a wrapper function. The wrapper
 * puts all downstream updates in a transaction that doesn't commit until all async actions
 * inside of it are done.
 * 
 * This means that while its running, it shows the current render while rendering the next
 * branch off-screen until its completed. This lets you then more seamlessly move between
 * render states and show a loading indicator of some kind while the task is pending using the
 * provided pending indicator. Let's look at this example using tabs of content: 
 */

// Just some hard coded content for the tabs
type ContentKey = 'Uno' | 'Dos' | 'Tres';
const CONTENT = {
  Uno: `Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.`,
  Dos: `Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem. Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur? Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse quam nihil molestiae consequatur, vel illum qui dolorem eum fugiat quo voluptas nulla pariatur?`,
  Tres: `On the other hand, we denounce with righteous indignation and dislike men who are so beguiled and demoralized by the charms of pleasure of the moment, so blinded by desire, that they cannot foresee the pain and trouble that are bound to ensue; and equal blame belongs to those who fail in their duty through weakness of will, which is the same as saying through shrinking from toil and pain. These cases are perfectly simple and easy to distinguish. In a free hour, when our power of choice is untrammelled and when nothing prevents our being able to do what we like best, every pleasure is to be welcomed and every pain avoided. But in certain circumstances and owing to the claims of duty or the obligations of business it will frequently occur that pleasures have to be repudiated and annoyances accepted. The wise man therefore always holds in these matters to this principle of selection: he rejects pleasures to secure other greater pleasures, or else he endures pains to avoid worse pains.`
};

/**
 * This adds a bit of random delay for the tab loading. If you
 * want to have a chance to really see the loading state of the
 * transition, change the number being added to the random amount
 * to something in the thousands.
 */
function createDelay() {
  return new Promise<number>((resolve) => {
    const delay = Math.random() * 420 + 160;
    setTimeout(() => resolve(delay), delay);
  });
}

const Child = (props:{ page: ContentKey }) => {
  const [time] = createResource(createDelay);

  return (
    <div class="tab-content">
      This content is for page "{props.page}" after {time()?.toFixed()}ms.
      <p>{CONTENT[props.page]}</p>
    </div>
  );
};

/**
 * Because of some of the magic of Solid this can be a little hard to follow
 * exactly why everything here works the way it does. I'll do my best to break
 * it down but it took me going over it a few times to really understand.
 */
const TransitionExample = () => {
  // A basic signal for which tab we are on
  const [tab, setTab] = createSignal(0);
  // Here we create a transition to use for switching tabs. This transition is
  // generic so it could be re-used in theory. However, any actions that use the
  // same wrapper function (`start`) would all be tied together, so if you do
  // re-use a transition do so only if you intend to tie transitions together
  const [pending, start] = useTransition();

  // Here is the use of the wrapper function provided by the transition. The nested
  // function here is just so that we can generate different onClicks for the
  // various tabs. Since the `setTab` function is called inside of this transition,
  // `start` will notice the async delay built into the Child component and set its
  // pending state to `true` while it waits for the delay. Until that delay is over,
  // the app will continue to show the old tab, except that the pending indicator will
  // be `true`, allowing us to display an intermediate loading state.
  const updateTab = (index:number) => () => start(() => setTab(index));

  return (
    <div id='app'>
      {/** This is just a simple tab implementation. */}
      <ul class="inline">
        <li classList={{ selected: tab() === 0 }} onClick={updateTab(0)}>
          Uno
        </li>
        <li classList={{ selected: tab() === 1 }} onClick={updateTab(1)}>
          Dos
        </li>
        <li classList={{ selected: tab() === 2 }} onClick={updateTab(2)}>
          Tres
        </li>
      </ul>
      {/** 
       * Here we use the pending indicator from the transition to add the "pending" 
       * class to this div so we can style a loading state on the tab contents while
       * we wait for the next tab to load.
       */}
      <div class="tab" classList={{ pending: pending() }}>
        {/** 
         * Here the initial load will be controlled by Suspense, but since we wrap
         * the tab updates in the transition wrapper, Suspense will not see the
         * async tasks beyond the initial load.
         */}
        <Suspense fallback={<div class="loader">Loading...</div>}>
          <Switch>
            <Match when={tab() === 0}>
              <Child page="Uno" />
            </Match>
            <Match when={tab() === 1}>
              <Child page="Dos" />
            </Match>
            <Match when={tab() === 2}>
              <Child page="Tres" />
            </Match>
          </Switch>
        </Suspense>
      </div>
    </div>
  );
};


function AsyncTutorial() {
  const [tutorials, setTutorials] = createSignal([
    { name: 'Batching - Update a name without batching', component: <LazyLoadExample /> },
    { name: 'Resources - Getting Async user info', component: <FetchExample /> },
    { name: 'Suspense - Display loading message while waiting', component: <SuspenseExample /> },
    { name: 'SuspenseList - Display multiple loading messages while waiting', component: <SuspenseListExample /> },
    { name: 'Transition - Switching between tabs', component: <TransitionExample /> },
  ])
  return (
    <div>
      <For each={tutorials()}>
        {(tutorial) => 
          <>
            <div style={{ "border-bottom": '1px solid black', width: '100%', margin: '24px' }}>{tutorial.name}</div>
            <div style={{ margin: '24px' }}>{tutorial.component}</div>
          </>
        }
      </For>
    </div>
    
  );
}

export default AsyncTutorial;