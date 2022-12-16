import { render } from "solid-js/web";
import { createSignal, onMount, For, onCleanup } from "solid-js";

/**
 * Lifecycle notes
 * 
 * Solid's lifecycle is fairly simple. Solid operates on a reactive system, which means the
 * component lifecycle is stripped down by comparison to React. Still, a lifecycle exists and
 * there are functions to interact with them. This file goes over the variety of lifecycle
 * functions which are available in Solid.
 * 
 * As a side note, lifecycles exist only in the browser , so lifecycle functions will not run
 * during a server side rendering process, meaning they can be used to help coordinate the
 * server and browser activities.
 */

interface Photo {
  thumbnailUrl: string,
  title: string
}

/**
 * Doing things once with onMount
 */
function OnMountExample() {
  const [photos, setPhotos] = createSignal<Photo[]>([]);

  /**
   * onMount is a convienience function that's very useful but relatively simple. At its core
   * a call to onMount is a non-tracking call to createEFfect. Since it doesn't track (i.e.
   * it isn't subscribed to any signals) that means that onMount will run *exactly once*, after
   * the initial rendering is done.
   * 
   * Here, we use onMount to get a variety of photo placeholder images put them into our photos
   * signal, causing them to render to the page.
   */
  onMount(async () => {
    const res = await fetch(`https://jsonplaceholder.typicode.com/photos?_limit=20`);
    setPhotos(await res.json());
  });

  return (
    <div style={{
      'display': 'grid',
      'grid-template-columns':' repeat(5, 1fr)',
      'grid-gap': '8px'
    }}>
      <For each={photos()} fallback={<p>Loading...</p>}>{ photo =>
        <figure>
          <img src={photo.thumbnailUrl} alt={photo.title} />
          <figcaption>{photo.title}</figcaption>
        </figure>
      }</For>
    </div>
  );
}

/**
 * Handling dismounting with onCleanup
 */
function CleanCounter() {
  const [count, setCount] = createSignal(0);
  const timer = setInterval(() => setCount(count() + 1), 1000);
  /**
   * While React hooks do technically have a way of accomplishing a task on unmount, 
   * it's sort of unintuitive. In Solid this has been made into a first-class fuction.
   * The onCleanup function can be placed at any scope and will run whenver that scope
   * is re-evaluated or disposed. It can be placed anywhere in the synchronous execution
   * of Solid's reactive system.
   * 
   * In this example, we take the auto-counter from a while back and add a little cleanup
   * to clear the interval whenever the component is unmounted.
   */
  onCleanup(() => clearInterval(timer));

  return <div>Count: {count()}</div>;
}

function LifecycleTutorial() {
  const [tutorials, setTutorials] = createSignal([
    { name: 'onMount - Some photo placeholders', component: <OnMountExample /> },
    { name: 'onCleanup - A Clean Counter', component: <CleanCounter /> }
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

export default LifecycleTutorial;