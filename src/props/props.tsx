import { children, createEffect, createSignal, For, JSX, mergeProps, splitProps } from "solid-js";

/**
 * Props notes
 * 
 * Just like React, Solid components can be passed an object of props which
 * has the syntax of HTML attributes on JSX tags. However, props in Solid
 * differ in a couple important ways. This tutorial goes over props in Solid
 * and how they work.
 */

/**
 * Basic Props - Concepts and the mergeProps function
 * 
 * At the basic level, props in Solid work exactly like props in React.
 * However, it's important to note that in Solid props are part of the
 * reactive system for updates. This means we have to be careful about
 * how we treat them.
 * 
 * For example, in React it's very common to destructure props at the top
 * of a component function, like this:
 * 
 * function MyComponent(props) {
 *  const { prop1, prop2 } = props;
 *  // ...etc.
 * }
 * 
 * However, destructuring props in Solid is a mistake. Doing this can cause
 * the props to lose their reactivity if not done in a tracking scope. This
 * could mean that props changes would not trigger updates and then the UI would
 * not display correctly. This applies to spreads and functions like Object.assign
 * as well as destructuring.
 * 
 * That said, we are not without tools to accomplish similar tasks. The most common
 * use case for destructuring props is to create default values if a prop is optional
 * or not assigned. For this, we can use Solid's mergeProps function. This works like
 * a non-destructive Object.assign - meaning it preserves the props' reactivity. 
 */
interface GreetingProps {
  greeting?: string;
  name?: string;
}

function Greeting(props:GreetingProps) {
  /**
   * Here we use the mergeProps function to provide default values for the
   * optional props `greeting` and `name`. The function returns an object
   * that maintains the reactive property of the props so that changes will
   * still result in updates.
   */
  const merged = mergeProps({ greeting: "Hi", name: "John" }, props);

  return <h3>{merged.greeting} {merged.name}</h3>
}

function BadGreeting(props:GreetingProps) {
  /**
   * Here we use a React-like implementation of destructuring the props. This
   * is to demonstrate the issues with using this sort of implementation in Solid.
   */
  const { greeting = 'Hello', name = 'Jerkface' } = props;

  return <h3>{greeting} {name}</h3>
}

function BasicPropsExample() {
  const [name, setName] = createSignal<string>();
  /**
   * Here you can see the reactivity in action. Since we used mergeProps in
   * the Greeting component, when we click the button the Greeting component
   * changes the name properly, but the BadGreeting component does not.
   */
  return <>
    <Greeting greeting="Hello" />
    <Greeting name="Jeremy" />
    <Greeting name={name()} />
    <BadGreeting name={name()} />
    <button onClick={() => setName("Jarod")}>Set Name</button>
  </>;
}

/**
 * Splitting Props
 * 
 * For the rest of these I won't bother creating a failing example since
 * the failure is always the same: a lack of updating. But, in all cases
 * not using the props functions will result in the props losing their
 * reactivity.
 * 
 * Sometimes we want to split up props into two groups: the data we care
 * about directly in the component and another group we are simply passing
 * on to another element. In React we'd do this through destructuring and
 * spreading:
 * 
 * function MyComponent(props) {
 *   const { text, ...others } = props;
 *   return <p {...others}>{text}</p>
 * }
 * 
 * Since we can't do that in Solid, there is a function that can accomplish
 * this for us: splitProps
 * 
 * splitProps takes the props object and an array of strings that are keys in
 * the props object. It returns an array with the first element being an object
 * with the keys/values of the specified keys and the second element being an
 * object with the remaining key/value pairs.
 */

interface SplitGreetingProps extends JSX.HTMLAttributes<HTMLHeadingElement> {
  greeting: string;
  name: string;
}

function SplitGreeting(props:SplitGreetingProps) {
  const [local, others] = splitProps(props, ["greeting", "name"]);
  return <h3 {...others}>{local.greeting} {local.name}</h3>
}

function SplitPropsExample() {
  const [name, setName] = createSignal("Jakob");

  return <>
    <SplitGreeting greeting="Yo" name={name()} style="color: teal;" />
    <button onClick={() => setName("Jarod")}>Set Name</button>
  </>;
}

/**
 * Children
 * 
 * So, one of the significant preformance improvements in Solid comes from the fact
 * that the components are really just function calls. Updates are propogated through
 * the app by having the compiler wrap potentially reactive expressions in getters.
 * Basically, you can imagine it with this example straight from the official tutorial:
 * 
 * // this JSX
 * <MyComp dynamic={mySignal()}>
 *   <Child />
 * </MyComp>
 * 
 * // becomes
 * MyComp({
 *   get dynamic() { return mySignal() },
 *   get children() { return Child() }
 * });
 * 
 * This means props are evaluated lazily. Since they aren't accessed until they are used,
 * they can be reactive without additional wrappers or sync logic. The downside here is
 * that repeat access will lead to recreating child elements or components.
 * 
 * To avoid this Solid has a helper function named `children`.
 */

interface ColoredListProps {
  color: string;
  children: JSX.Element;
}

function ColoredList(props:ColoredListProps) {
  /**
   * Here the `children` function creates a memo around the children prop and handles any nested reactivity.
   * This means that although props.children is just the <For> component, the `children` function will resolve
   * all of that so that when we call the accessor function it gives us what we'll get is the actual elements
   * that <For> creates. This way, all we have to do is interact with the children without worrying about how
   * nested the reactive pieces are.
   */
  const c = children(() => props.children);
  /**
   * Now we create an Effect that subscribes to the children
   * memo we just created. This will let us track when something
   * about the children changes and update accordingly.
   * 
   */
  createEffect(() => {
    const kids = c() as HTMLElement[];
    if (!kids) {
      return;
    }
    kids.forEach(item => item.style.color = props.color)
  });
  return <>{c()}</>
}

function ChildrenExample() {
  const [color, setColor] = createSignal("purple");

  return <>
    <ColoredList color={color()}>
      <For each={["Most", "Interesting", "Thing"]}>{item => <div>{item}</div>}</For>
    </ColoredList>
    <button onClick={() => setColor("teal")}>Set Color</button>
  </>;
}



function PropsTutorial() {
  const [tutorials, setTutorials] = createSignal([
    { name: 'mergeProps - Several Greetings', component: <BasicPropsExample /> },
    { name: 'splitProps - Another Greeting', component: <SplitPropsExample /> },
    { name: 'children - Coloring a List of Words', component: <ChildrenExample /> },
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

export default PropsTutorial;