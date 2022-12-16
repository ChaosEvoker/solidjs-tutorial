import { Accessor, createSignal, For, onCleanup, onMount, Show } from "solid-js";

import styles from './bindings.module.css';
import './bindings.css';

/**
 * Bindings notes
 * 
 * As you would expect, Solid has familiar ways of handling various types of binding to
 * HTML elements like events, refs, and other common HTML properties. This tutorial
 * section goes over the various types of bindings available in Solid. 
 */

/******************************
 *     SECTION 1 - Events     *
 ******************************/

/**
 * Basic Events
 * 
 * As already demonstrated in a few other tutorials, Solid (unsurprisingly) has event binding.
 * Here's a basic example which tracks the mouse position as long as the mouse is over the
 * area of the component.
 * 
 */
function MouseTracker() {
  const [pos, setPos] = createSignal({x: 0, y: 0});
  function handleMouseMove(event:MouseEvent) {
    setPos({
      x: event.clientX,
      y: event.clientY
    });
  }

  return (
    <div onMouseMove={handleMouseMove} style={{ border: '1px dashed black', padding: '24px' }}>
      The mouse position is {pos().x} x {pos().y}
    </div>
  );
}

/**
 * Conditional Event Behavior- Bad Implementation
 * 
 * A key important piece of information is to remember that Solid components *only execute
 * one time* which means that event handlers *do not get rebound*. Here's a somewhat normal
 * way of implementing a Login/Logout button that would work in React but does not in Solid.
 * 
 */
function BadLoginButton() {
  const [loggedIn, setLoggedIn] = createSignal(false);
  // Login function
  const login = () => {
    console.log('Bad Login Button - Logged in: ', loggedIn())
    setLoggedIn(true)
  }
  // Logout function
  const logout = () => {
    console.log('Bad Logout Button - Logged in: ', loggedIn())
    setLoggedIn(false)
  }
  // Conditional Button text (spoiler: this doesn't work)
  const buttonText = loggedIn() ? 'Log Out' : 'Log In';

  /**
   * The failure of this implementation is that it fails to account for the fact that Solid
   * components only execute once and then update in the ractive system. That means when this
   * initially get rendered, the onClick is bound with the login function (since loggedIn
   * defaults to false) and then never rebound. You can see this in the console with this example,
   * If you click on the button over and over you will see the console message shows the user as
   * logged out the first time, but every time after that the user is logged in. The state is updating
   * correctly but because the component does not get re-executed the handler is never rebound based
   * on that state change and so the button is stuck.
   * 
   * This is the big distinction between Events and Signals in Solid. Events are not part of the reactive
   * system by default, which means you need to intentionally tie them in with your implementation. This
   * is pretty easy to do without difficulty, and the next example will show how.
   */
  return (
    <button onClick={loggedIn() ? logout : login}>{buttonText}</button>
  );
};

/**
 * Conditional Event Behavior - Good Implementation
 * 
 * Obviously we accomplised this successfully with the <Show> component in a previous tutorial.
 * Still, I wanted to highlight how you might do this without <Show> to make clear some of the
 * nuances of Events in Solid. Here's an implementation of the toggling logout button without
 * <Show> that works. 
 * 
 * Note that this implementation is "good" only in that it works unlike the previous one. It's
 * implemented in a way that highlights some things about how events and signals work in Solid, 
 * but the <Show> example is a much better implementation of this concept in general.
 * 
 */
function GoodLoginButton() {
  const [loggedIn, setLoggedIn] = createSignal(false);
  // Small note: because text is also an HTML Element, if we don't make the text a signal, then
  // it will not change, even with the improvements to the event handler
  const [buttonText, setButtonText] = createSignal('Log In');

   // Login function
   const login = () => {
    setLoggedIn(true)
  }
  // Logout function
  const logout = () => {
    setLoggedIn(false)
  }

  /** Button click handler - notice that we have this wrapper that contains the logic of which
   * function to call based on the current value of the loggedIn signal. This is required since
   * we only have one chance to bind to the onClick event of the button - when the component
   * initially renders.
   */
  const handleClick = () => {
    if (loggedIn()) {
      logout();
    } else {
      login();
    }
    setButtonText(loggedIn() ? 'Log Out' : 'Log In');
  }

  // With the changes we've made this works just like we'd want!
  return (
    <button onClick={handleClick}>{buttonText()}</button>
  );
};

/**
 * Data Binding with Event Handlers
 * 
 * Sometimes you want some data passed into a particular event handler to provide needed contextual
 * data to the logic of the handler. In React you'd often accomplish this with a handler that returned
 * a closure function something like:
 * 
 * const handleChange = (data) => (event) => <Do something with data and event>
 * 
 * Then in the various inputs that use that handler:
 * 
 * <button onClick={handleChange(dataForThisButton)}>Click Me</button>
 * 
 * In Solid, there is a nice syntax to handle this without the creation of closures. Here's an example.
 */

interface ColorInfo {
  color: string,
  info: string
}

function DataEventBindingExample() {
  // Just some data about colors
  const [data, setData] = createSignal<ColorInfo[]>([
    { color: 'red', info: 'Red is a primary color of light.'},
    { color: 'green', info: 'Green is a primary color of light.'},
    { color: 'blue', info: 'Blue is a primary color of light'},
    { color: 'pink', info: 'Pink is a secondary color of light - a mix of red and blue'},
    { color: 'yellow', info: 'Yellow is a secondart color of light - a mix of red and green'},
    { color: 'cyan', info: 'Cyan is a secondary color of light - a mix of green and blue'}
  ])
  const [lastSelected, setLastSelected] = createSignal('red');

  /**
   * When using this feature of Solid, event handler functions are written to accept the bound
   * data as the first argument and the event as the second argument.
   */
  const printColorInfo = (colorInfo:ColorInfo, event:MouseEvent) => {
    setLastSelected(colorInfo.color);
    console.log(colorInfo.info);
    console.log(`The button was clicked at (${event.clientX}, ${event.clientY})`);
  }

  /**
   * Any basic event can accept an array with the first item being the event handler and the second being the data. 
   */
  return (
    <>
      <For each={data()}>{
        colorInfo => <button onClick={[printColorInfo, colorInfo]}>{colorInfo.color}</button>
      }</For>
      <div>The last color clicked is: {lastSelected()}</div>
    </>
  )
}

/******************************
 *     SECTION 2 - Styles     *
 ******************************/

/**
 * Basic Styling
 * 
 * As has been shown in a few previous examples, HTML elements in Solid have a style
 * property that can accept a string or object of CSS styles. Unlike in React, the CSS
 * properties are not in camel case but remain dashed.
 */
function BasicStyleExample() {
  return (
    <div style={{
      color: 'rgb(80, 180, 80)',
      'font-weight': 800,
      'font-size': '80px'}}
    >
      Some Text
    </div>
  );
}

/**
 * Animations
 * 
 * While you can obviously use CSS animations as well, you can use the signals
 * in Solid to do them as well. Since Solid doesn't re-render the entire component
 * on each change this is actually very performant.
 */
function AnimatedStyleExample() {
  const [num, setNum] = createSignal(0);
  setInterval(() => setNum((num() + 1) % 255), 30)

  return (
    <div style={{
      color: `rgb(${num()}, 180, ${num()})`,
      'font-weight': 800,
      'font-size': `80px`}}
    >
      Some Animated Text
    </div>
  );
}

/**
 * Using Stylesheets - Classes
 * 
 * Solid can use baseline CSS using the class attribute of HTML elements. Where
 * React uses the className prop, Solid returns to using class.
 * 
 * The styles here are defined in the bindings.css stylesheet imported above.
 */
function ClassExample() {
  return (
    <div class='basic-class-example'>
      Some Text Styled With Class
    </div>
  );
}

/**
 * Using Stylesheets - Class List
 * 
 * Solid has dynamic classes built in. By using the classList property, you can provide
 * an object where the keys are the name of the class and the values are booleans. When the
 * value is true, the class name is added. Otherwise, it's left off.
 * 
 * The styles here are defined in the bindings.css stylesheet imported above.
 */
function ClassListExample() {
  const [numbers, setNumbers] = createSignal([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  return (
    <div>
      <For each={numbers()}>{
        number => (
          <span classList={{ 
            isEven: number % 2 === 0, 
            isOdd: number % 2 !== 0 
          }}>{number}</span>
        )
      }</For>
    </div>
  );
}

/**
 * Using Stylesheets - CSS Modules
 * 
 * The final way to use stylesheets in Solid is by modularizing your CSS files.
 * This allows you do something like styled-components does for React - having CSS
 * that is more clearly scoped and that won't cause namespace collisions. To do this,
 * you end your stylesheet with .module.css rather than .css
 */
function CSSModuleExample() {
  return (
    <div class={styles.greenText}>
      Some Text Styled With Modules
    </div>
  );
}

/**
 * Some additional notes on styling:
 * 
 * Obviously there's a lot of ways to do styling in every framework, and it's always been
 * a struggle both finding a good way of doing it that's clear, avoids pitfalls, and that
 * developers will stick to. I find the modularization idea interesting, but to me it lacks
 * some of the robustness of styled-components, for example.
 * 
 * Saying that, I did some poking around and there's already some good support for Solid on a
 * number of these solutions. I've found what looks to be a complete port of styled-components
 * as well as support for compiled CSS languages like SCSS. So, it looks like Solid has plenty
 * of good solutions for styling even if you find their out of the box solution is still lacking.
 */

/******************************
 *      SECTION 3 - Refs      *
 ******************************/

/**
 * Refs
 * 
 * Sometimes it's useful to have references to DOM elements. Like React, Solid can do that too.
 * Passing an empty variable into an element's ref attribute will assign that element to the variable.
 * 
 * You can also give a callback function to the ref attribute like this:
 * 
 * <div ref={el => (Do something with el here)}>My Element</div>
 */
function RefAnimation() {
  // Declare an empty variable to hold our ref
  let canvas:HTMLCanvasElement | undefined;
  // Nothing special here really, just some code to animate the SVG, nothing
  // here is relevant to the refs bit except to note that the function is using
  // the canvas variable successfully (showing the assignment below works)
  onMount(() => {
    if (!canvas) {
      return;
    }
    const ctx = canvas.getContext("2d");
    let frame = requestAnimationFrame(loop);

    function loop(t:number) {
      if (!ctx || !canvas) {
        return;
      }
      frame = requestAnimationFrame(loop);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      for (let p = 0; p < imageData.data.length; p += 4) {
        const i = p / 4;
        const x = i % canvas.width;
        const y = (i / canvas.height) >>> 0;

        const r = 64 + (128 * x) / canvas.width + 64 * Math.sin(t / 1000);
        const g = 64 + (128 * y) / canvas.height + 64 * Math.cos(t / 1000);
        const b = 128;

        imageData.data[p + 0] = r;
        imageData.data[p + 1] = g;
        imageData.data[p + 2] = b;
        imageData.data[p + 3] = 255;
      }

      ctx.putImageData(imageData, 0, 0);
    }

    onCleanup(() => cancelAnimationFrame(frame));
  });
  // Here by passing the undefined variable as ref to canvas, the canvas element itself is assigned to the variable
  return <canvas class='ref-animation-example' ref={canvas} width="256" height="256" />;
}

/**
 * Ref Forwarding
 * 
 * You can expose refs to a component's parents by using props.ref. Both the variable
 * and callback versions work for this purpose.
 */

function Canvas(props:{ref: HTMLCanvasElement | undefined}) {
  return <canvas class='ref-animation-example' ref={props.ref} width="256" height="256" />;
}

function ForwardRefAnimation() {
  // Declare an empty variable to hold our ref
  let canvas:HTMLCanvasElement | undefined;
  // Nothing special here really, just some code to animate the SVG, nothing
  // here is relevant to the refs bit except to note that the function is using
  // the canvas variable successfully (showing the assignment below works)
  onMount(() => {
    if (!canvas) {
      return;
    }
    const ctx = canvas.getContext("2d");
    let frame = requestAnimationFrame(loop);

    function loop(t:number) {
      if (!ctx || !canvas) {
        return;
      }
      frame = requestAnimationFrame(loop);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      for (let p = 0; p < imageData.data.length; p += 4) {
        const i = p / 4;
        const x = i % canvas.width;
        const y = (i / canvas.height) >>> 0;

        const r = 64 + (128 * x) / canvas.width + 64 * Math.sin(t / 1000);
        const g = 64 + (128 * y) / canvas.height + 64 * Math.cos(t / 1000);
        const b = 128;

        imageData.data[p + 0] = r;
        imageData.data[p + 1] = g;
        imageData.data[p + 2] = b;
        imageData.data[p + 3] = 255;
      }

      ctx.putImageData(imageData, 0, 0);
    }

    onCleanup(() => cancelAnimationFrame(frame));
  });
  // Here by passing the undefined variable as ref to canvas, the canvas element itself is assigned to the variable
  return <Canvas ref={canvas} />;
}

/*******************************
 *     SECTION 4 - Spreads     *
 *******************************/
/**
 * Spreads
 * 
 * Just like in React, you can use the spread operator (...) to unpack props into components.
 */
interface PackageInfo {
  name: string,
  version: number,
  speed: string,
  website: string
}

const pkg:PackageInfo = {
  name: "solid-js",
  version: 1,
  speed: "⚡️",
  website: "https://solidjs.com",
};

function Info(props:PackageInfo) {
  return (
    <p>
      The <code>{props.name}</code> package is {props.speed} fast. Download
      version {props.version} from{" "}
      <a href={`https://www.npmjs.com/package/${props.name}`}>npm</a> and{" "}
      <a href={props.website}>learn more here</a>
    </p>
  );
}

function SpreadExample() {
  return <Info {...pkg} />;
}

/**********************************
 *     SECTION 4 - Directives     *
 **********************************/
/**
 * Directives
 * 
 * Solid has the concept of a Directive. As far as I can tell from past experience
 * and research, React has no comparable concept. This is syntactic sugar around refs 
 * that allow for more easily reuseable DOM behavior. Essentially, you can implement a
 * function defining some kind of generic behavior and then use those on any
 * element. You do this by using the `use:` namespace.
 * 
 * Importantly, since `use:` is detected by the compiler to be transformed, and \
 * the function is required to be in scope: it cannot be part of spreads or 
 * applied to a component.
 */

// Here's how you have to register your Directives with Typescript so that
// it doesn't get angry at you.
declare module "solid-js" {
  namespace JSX {
    interface Directives {
      clickOutside: () => any;
    }
  }
}

/**
 * Each custom directive takes two arguments: 
 * 1) the DOM element with the `use:` attribute
 * 2) A getter function that retrieves the value of the attribute
 * 
 * So for example if you had:
 * <div use:someCustomDirective={'Hello!'}>
 * 
 * Then in your implementation of someCustomDirective the first argument
 * would be the <div> element itself and the second argument would be a
 * getter function that returns the string 'Hello!'
 * 
 * In our example, el will be the <div> element acting as a modal and
 * accessor will be a function that returns a function that sets the
 * show signal to false - hiding the modal.
 */
function clickOutside(el:HTMLElement, accessor:Accessor<() => void>) {
  const onClick = (e:MouseEvent) => {
    if (!el.contains(e.target as Node)) {
      accessor()();
    }
  }
  document.body.addEventListener("click", onClick);
  // Since this directive is added to DOM elements and tracked in the reactive system
  // of Solid, we can use the onCleanup to make sure that any element using this
  // Directive also cleans up its event listener when it's destroyed.
  onCleanup(() => document.body.removeEventListener("click", onClick));
}

function DirectiveExample() {
  const [show, setShow] = createSignal(false);

  /**
   * Here is where we use the custom directive. The larger benefits of this
   * approach are not obvious in a single example. However, with the clickOutside
   * function defined, we could now put `use:clickOutside` on *any* DOM element
   * and have a ready-made way to handle the logic of detecting clicks outside that
   * element and reacting with whatever function we pass into it without having to do
   * a custom implementation each time.
   */
  return (
    <Show
      when={show()}
      fallback={<button onClick={(e) => setShow(true)}>Open Modal</button>}
    >
      <div class="modal" use:clickOutside={() => setShow(false)}>
        Some Modal
      </div>
    </Show>
  );
}

function BindingsTutorial() {
  const [tutorials, setTutorials] = createSignal([
    { name: 'Basic Events - Mouse Tracker', component: <MouseTracker /> },
    { name: 'Conditional Events - Bad Login Button', component: <BadLoginButton /> },
    { name: 'Conditional Events - Good Login Button', component: <GoodLoginButton /> },
    { name: 'Binding Data to Events - Click a Color', component: <DataEventBindingExample /> },
    { name: 'Basic Styles - Styling Some Text', component: <BasicStyleExample /> },
    { name: 'Animations - Animating Some Text', component: <AnimatedStyleExample /> },
    { name: 'CSS Classes - Using Classes for Blue Text', component: <ClassExample /> },
    { name: 'CSS Class List - Alternate Colors', component: <ClassListExample /> },
    { name: 'CSS Modules - Green Text', component: <CSSModuleExample /> },
    { name: 'Refs - Animated SVG ', component: <RefAnimation /> },
    { name: 'Forward Refs - Animated SVG ', component: <RefAnimation /> },
    { name: 'Spread - Display Some Info ', component: <SpreadExample /> },
    { name: 'Directives - Close Modal on Outside Click', component: <DirectiveExample /> },
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

export default BindingsTutorial;