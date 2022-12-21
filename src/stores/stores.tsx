import { For, createSignal, Setter, Accessor } from "solid-js";
import { createMutable, createStore, produce, reconcile } from "solid-js/store";

/**
 * Stores notes
 * 
 * Stores are a very important feature of Solid. Stores are very
 * similar to Signals in a lot of ways, but there are some significant
 * differences that make Stores much better for handling more complex
 * state objects than signals.
 */

/**
 * Nested Reactivity
 * 
 * Before we get into stores it's important that we understand more details
 * about how the reactive system of Solid works - especially around reactive
 * pieces that are nested in other reactive pieces.
 * 
 * Solid is unique in that nested updates are handled independently. If an item
 * in a list is updated, only the DOM items that use that particular item in the
 * list will be updated, without diffing the list itself. For example, let's look
 * at this Todo List:
 */
interface TodoItem {
  id: number;
  text: string;
  completed: boolean;
}

const BadTodoList = () => {
  const [todos, setTodos] = createSignal<TodoItem[]>([])
  let input:HTMLInputElement | undefined;
  let todoId = 0;

  const addTodo = (text:string) => {
    setTodos([...todos(), { id: ++todoId, text, completed: false }]);
  }
  /**
   * This is how you would typically implement toggling a Todo item as
   * completed in React. Here, we just find the id of the clicked list
   * item and mark it as completed. However, when implemented like this,
   * the Todo list item that changes is completely recreated.
   */
  const toggleTodo = (id:number) => {
    setTodos(todos().map((todo) => (
      todo.id !== id ? todo : { ...todo, completed: !todo.completed }
    )));
  }

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
      <For each={todos()}>
        {(todo) => {
          const { id, text } = todo;
          // Pay attention to the console message here in particular. This message
          // appears both when creating new items *and toggling their checkbox*.
          // In Solid, the second part can be avoided, in the next example we'll see how
          console.log(`Creating ${text}`)
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
 * In this version of the Todo List, the implementation uses Solid's nested
 * reactivity to avoid doing a re-creation of the updated Todo item. Comments will
 * highlight important changes to note.
 */

// We have to adjust the typing of the Todo Item to include Signal reactivity - namely
// the completed value is an Accessor function now and there is an additional Setter
// function added.
interface ReactiveTodoItem {
  id: number;
  text: string;
  completed: Accessor<boolean>;
  setCompleted: Setter<boolean>;
}

const GoodTodoList = () => {
  const [todos, setTodos] = createSignal<ReactiveTodoItem[]>([])
  let input:HTMLInputElement | undefined;
  let todoId = 0;

  /**
   * Here we establish the reactive signals for each Todo item that is added.
   * A signal is created to track the completed state of each item and then attached
   * to each item in the list. This is nested reactivity - each of these `completed`
   * signals are being stored inside of the `todos` signal.
   */
  const addTodo = (text:string) => {
    const [completed, setCompleted] = createSignal(false); 
    setTodos([...todos(), { id: ++todoId, text, completed, setCompleted }]);
  }
  /**
   * Here is where the reactivity is utilized. Instead of just creating a new item
   * for the target id, we reach into the todo item and use its `setCompleted` and
   * `completed` signal methods to update the boolean directly. Thanks to this, Solid
   * avoids recreating the DOM element and instead merely updates the state of the checkbox
   */
  const toggleTodo = (id:number) => {
    const todo = todos().find((t) => t.id === id);
    if (todo) todo.setCompleted(!todo.completed())
  }

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
      <For each={todos()}>
        {(todo) => {
          const { id, text } = todo;
          // Again, the console is important to pay attention to in order to
          // see this in action. Notice that in this example, you see this message
          // when items are created *but the message does NOT appear when clicking
          // the checkboxes*, unlike the previous example.
          console.log(`Creating ${text}`)
          return <div>
            <input
              type="checkbox"
              checked={todo.completed()}
              onchange={[toggleTodo, id]}
            />
            <span
              style={{ "text-decoration": todo.completed() ? "line-through" : "none"}}
            >{text}</span>
          </div>
        }}
      </For>
    </>
  );
};

/**
 * Stores - The Real Answer to Nested Reactivity.
 * 
 * While the performance gains are significant, it's hard to not notice the cumbersome
 * feel of the nested reactive implementation above. It's alright for a TodoList, but 
 * manually creating a signal for each and every primitive value in a complex application 
 * would both require a lot of careful discipline and would bloat the code making it hard
 * to follow and read. Fortunately, Solid's real answer to nested reactivity offers a clean
 * answer to these issues: Stores.
 * 
 * Stores are proxy objects with properties that are tracked and can contain other objects
 * which automatically become wrapped in proxies themselves, etc. By only creating signals
 * for properties that are accessed under tracking scopes, Solid can lazily create these
 * signals as properties are requested. This is a big part of what contributes to Solid's speed.
 */

/**
 * createStore - creating and using a Store
 * 
 * Just like with createSignal, there is a createStore function. This function creates a store
 * and returns an array of two items: the value of the store and a setter function for it.
 * Unlike signals, the first value of the store is the read-only store proxy and not a getter
 * function. The setter function takes an object whose properties will be merged with the current
 * state. The setter function has several options for updates that we'll get into more detail in
 * later. For now, let's look at our Todo list example but using a Store to see how it changes:
 */
const StoreTodo = () => {
  let input:HTMLInputElement | undefined;
  let todoId = 0;
  // Initialize the store - very similar to createSignal so far
  const [todos, setTodos] = createStore<TodoItem[]>([]);

  /**
   * Notice here that we are no longer creating signals for each todo list item
   * The nested reactivity is being handled by the store. The signals for each
   * property of a Todo list item will be lazily created as needed.
   */
  const addTodo = (text:string) => {
    setTodos([...todos, { id: ++todoId, text, completed: false }]);
  }
   /**
    * Here we see some of the power of the setter function. The setter uses a sohpisticated
    * path syntax that gives a ton of flexibility once you have your head around it. It took
    * me a bit to fully get what's happening with these setter functions, and I'll show an
    * example later on that goes through a bunch of different options for it, but for now I'll
    * explain this example's use.
    */
  const toggleTodo = (id:number) => {
    setTodos(
      todo => todo.id === id, // First filter the todo list to include on ids that match the given id
      "completed", // Then select the completed keys of the objects in the filtered list
      completed => !completed // Finally update the values of those keys by flipping the boolean value
    );
  }

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
      <For each={todos}>
        {(todo) => {
          const { id, text } = todo;
          // Finally, just like the good todo list, this should only print on creation but not update.
          console.log(`Creating ${text}`)
          return <div>
            <input
              type="checkbox"
              checked={todo.completed}
              onchange={[toggleTodo, id]}
            />
            <span
              style={{ "text-decoration": todo.completed ? "line-through" : "none" }}
            >{text}</span>
          </div>
        }}
      </For>
    </>
  );
};

/**
 * Store Setters - Basic Ways to Update a Store
 */
const BasicStoreUpdatesExample = () => {
  // Generally I wouldn't recommend using any type for these things, but for the sake
  // of the example, I'm doing it so I don't have to define a type with a million
  // optional keys while I'm writing examples.
  const [state, setState] = createStore<any>({
    firstName: 'Phillip',
    lastName: 'Sipe'
  });

  // This just resets to the original state, we'll get into `reconcile` in a future example
  const reset = () => {
    setState(reconcile({ firstName: 'Phillip', lastName: 'Sipe' }));
  };
  
  // Basic setter usage - passing in an object. Existing keys updated, new keys added
  const changeNameAndAddJob = () => {
    setState({ firstName: 'Gerald', jobTitle: 'Software Developer' });
  };

  // Callback option - use previous value
  const addPreferredName = () => {
    setState((prevState:any) => ({ preferredName: prevState.firstName }));
  }

  return (
    <div>
      <pre style={{ 'background-color': 'lightgrey', 'border': '1px solid black', 'padding': '12px' }} id='json'>{JSON.stringify(state, null, 2)}</pre>
      <For each={[
        reset,
        changeNameAndAddJob,
        addPreferredName,
      ]}>{(action) => <button style={{ 'margin-right': '6px' }} onClick={action}>{action.name}</button>}</For>
    </div>
  );
}

/**
 * A very important way to update a Store in Solid is using the path system.
 * The path system offers a powerful way to manipulate complex objects with
 * many keys, values, and nesting. There's a lot of ways to do that, so we'll
 * go through a couple examples. This first one will go over the most basic
 * usages of the path system.
 */
const BasicPathStoreUpdatesExample = () => {
  const [animalList, setAnimalList] = createStore<any>({
    counter: 2,
    list: [
      { id: 23, title: 'Birds' },
      { id: 27, title: 'Fish' }
    ]
  });

  // This just resets to the original state, we'll get into `reconcile` in a future example
  const reset = () => {
    setAnimalList(reconcile({counter: 2, list: [ { id: 23, title: 'Birds '}, { id: 27, title: 'Fish' } ] }));
  };
  
  /**
   * The basic idea of path based updates is using a chain of arguments to the setter
   * function that step progressively deeper into an object until you pintpoint the
   * update you want to make and provide the new value.
   * 
   * Paths most often begin with a string that names a key in the object.
   * The last argument in a path is either the value to set or a callback function
   * that recieves the current value of your target and returns the new one.
   * 
   * Here's a few examples:
   */
  const addAndSeeMarsupials = () => {
    // Start with the key `counter` then update it with a callback
    setAnimalList('counter', (currentCount:number) => currentCount + 1);
    /**
     * animalList after this change (assuming you start with the default state):
     * {
          counter: 3,
          list: [
            { id: 23, title: 'Birds' },
            { id: 27, title: 'Fish' }
          ]
        }
     */

    // Start with the key `list` then update it with a callback.
    // Important note: When updating via path object values are merged together but other values
    // *including Arrays* are not. This update fully replaces the previous array.
    setAnimalList('list', (list:any) => [...list, { id: 43, title: 'Marsupials' }]);
    /**
     * animalList after this change (assuming you start with the default state 
     * and with previous updates in this function):
     * {
          counter: 3,
          list: [
            { id: 23, title: 'Birds' },
            { id: 27, title: 'Fish' },
            { id: 43, title: 'Marsupials' }
          ]
        }
     */

    // Start with the key `list`, go to index 2, go to key `seen`, and set it to true
    setAnimalList('list', 2, 'seen', true);
     /**
     * animalList after this change (assuming you start with the default state 
     * and with previous updates in this function):
     * {
          counter: 3,
          list: [
            { id: 23, title: 'Birds' },
            { id: 27, title: 'Fish' },
            { id: 43, title: 'Marsupials', seen: true }
          ]
        }
     */
  };

  return (
    <div>
      <pre style={{ 'background-color': 'lightgrey', 'border': '1px solid black', 'padding': '12px' }} id='json'>{JSON.stringify(animalList, null, 2)}</pre>
      <For each={[
        reset,
        addAndSeeMarsupials,
      ]}>{(action) => <button style={{ 'margin-right': '6px' }} onClick={action}>{action.name}</button>}</For>
    </div>
  );
}

/**
 * The path system allows for more robust and powerful updates than merely
 * drilling down to a single value and updating. This set of examples will
 * go over a handful of the more powerful updating abilities included in the
 * path system for Stores.
 */
const AdvancedPathStoreUpdatesExample = () => {
  const [taskList, setTaskList] = createStore<any>({
    todos: [
      { task: 'Finish work', completed: false },
      { task: 'Go grocery shopping', completed: false },
      { task: 'Make dinner', completed: false },
    ]
  });

  // This just resets to the original state, we'll get into `reconcile` in a future example
  const reset = () => {
    setTaskList(reconcile({
      todos: [
        { task: 'Finish work', completed: false },
        { task: 'Go grocery shopping', completed: false },
        { task: 'Make dinner', completed: false },
      ]
    }));
  };

  /**
   * Paths can use more than just strings and callback functions to select parts
   * of an object for updating, these actions will demonstrate some other ways to
   * update Stores.
   */

  // Paths allow you to use arrays of keys, this allows you to pinpoint
  // several different items and updated them all in the same way.
  const markFirstAndThirdFinished = () => {
    // Start with the key `todos`, select indexes 0 and 2, 
    // select the `completed` key in each, and set them to true
    setTaskList('todos', [0, 2], 'completed', true);
  }

  // You can also use an object defining iteration parameters
  // The paramters are each of the three components of a for loop:
  // `from` - The index to begin with (default: 0)
  // `to` - The index to end with (default: list length - 1)
  // `by` - The amount to itterate by (default: 1)
  const toggleFirstTwoCompleted = () => {
    // Select `todos`, itterate from index 0 to 1, select `completed` in each, and swap the boolean
    setTaskList('todos', { from: 0, to: 1 }, 'completed', (c:boolean) => !c);
  }

  /**
   * Here's an example using `by` in an itterable object. I had a hard time finding documentation 
   * or examples of how `by` works, and eventually just dug into the source of Solid. Ultimately,
   * the answer was simple but it's sort of hard to explain clearly with words. So, the best way I 
   * have to describe the itterable object is that they are the three parts of a traditional for loop:
   * 
   * // Example itterableObject you would use in path
   * const itterableObject = { from: 0, to: list.length -1, by: 1 };
   * 
   * // How that translates into a for loop
   * for(var i = itterableObject.from; i < itterableObject.to; i += itterableObject.by) {
   *   // Do stuff...
   * }
   */
  const toggleOddTasksCompleted = () => {
    // Select `todos`, itterate by 2 over the whole list, select `completed` in each, and swap the boolean
    setTaskList('todos', { by: 2 }, 'completed', (c:boolean) => !c);
  }

  // Since all the itterable object keys have default values, you can do a simple forEach by passing
  // in an empty object
  const addDifficultyToAllTasks = () => {
    // Updates aren't restricted to existing keys, you can add new keys with path as well
    setTaskList('todos', {}, 'difficulty', 'medium');
  }

  // Paths can also use filter functions
  const finishAllIncompleteTasks = () => {
    // Select `todos`, filter out completed tasks, selected `completed` in each, and set them to true
    setTaskList('todos', (todo:any) => !todo.completed, 'completed', true);
  }

  // Another example of filter functions
  const getExcitedAboutMundaneTasks = () => {
    // Add an exclamation mark to all tasks that don't have them
    setTaskList('todos', (todo:any) => !todo.task.endsWith('!'), 'task', (t:string) => t + '!');
  }

  return (
    <div>
      <pre style={{ 'background-color': 'lightgrey', 'border': '1px solid black', 'padding': '12px' }} id='json'>{JSON.stringify(taskList, null, 2)}</pre>
      <For each={[
        reset,
        markFirstAndThirdFinished,
        toggleOddTasksCompleted,
        addDifficultyToAllTasks,
        finishAllIncompleteTasks,
        getExcitedAboutMundaneTasks
      ]}>{(action) => <button style={{ 'margin-right': '6px' }} onClick={action}>{action.name}</button>}</For>
    </div>
  );
}

/**
 * Mutable Stores using produce
 * 
 * Stores are immutable by default and can only be updated through setter functions.
 * While it's recommended not to break this pattern, occasionally it can be much cleaner,
 * simpler, or otherwise easier to use mutation style logic. Solid provides a way to do this
 * without fully abandoning immutable Stores via the `produce` function.
 * 
 * Here's an implementation of the Todo List using `produce`
 */
const ProduceMutableExample = () => {
  let input:HTMLInputElement | undefined;
  let todoId = 0;
  const [todos, setTodos] = createStore<TodoItem[]>([]);

  /**
   * `produce` takes a callback function whose only argument is a mutable
   * version of the Store value. `produce` itself then returns the mutated 
   * object, which you can pass into a setter function. For example, here we 
   * get a mutable version of our todo list and then push the new task onto 
   * the end of the list. 
   */
  const addTodo = (text:string) => {
    setTodos(
      produce((todoList) => {
        todoList.push({ id: ++todoId, text, completed: false });
      }),
    );
  };
  
  /**
   * You can also use the output of a `produce` call as part of a path chain.
   * Here we use that to implement the toggle functionality
   */
  const toggleTodo = (id:number) => {
    setTodos(
      todo => todo.id === id, // Filter out todo items that don't match the id
      produce((todo) => (todo.completed = !todo.completed)), // Toggle their completed state
    );
  };

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
      <For each={todos}>
        {(todo) => {
          const { id, text } = todo;
          console.log(`Creating ${text}`)
          return <div>
            <input
              type="checkbox"
              checked={todo.completed}
              onchange={[toggleTodo, id]}
            />
            <span
              style={{ "text-decoration": todo.completed ? "line-through" : "none" }}
            >{text}</span>
          </div>
        }}
      </For>
    </>
  );
};

/**
 * Mutable Stores using createMutable
 * 
 * While Solid discourages using this pattern as a baseline, sometimes having a fully
 * mutable store is helpful - particularly for integrating with 3rd Party systems. So,
 * Solid provides an alternative to `createStore` in `createMutable`.
 * 
 * Solid still retains the reactivity through intercepting property access and tracks deep
 * nesting via proxy. That said, using `createMutable` is discouraged for an important reason:
 * A mutable Store can be passed around and mutated anywhere which can make it hard to follow
 * updates and easier to break the unidirectional flow of Solid. This can make it easy to
 * accidentally change state as a side effect without meaning to. Basically, if you are going
 * to use `createMutable` do so with care and intentionality.
 * 
 * Here's what the todo list looks like with `createMutable`:
 */
const CreateMutableExample = () => {
  let input:HTMLInputElement | undefined;
  let todoId = 0;
  const todos = createMutable<TodoItem[]>([]);

  // Nothing special here, just some basic JS at this point.
  const addTodo = (text:string) => {
    todos.push({ id: ++todoId, text, completed: false });
  };
  
  // Same here, nothing to note except that we can now modify the Store directly
  const toggleTodo = (id:number) => {
    todos
      .filter(todo => todo.id === id)
      .forEach((todo) => todo.completed = !todo.completed);
  };

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
      <For each={todos}>
        {(todo) => {
          const { id, text } = todo;
          console.log(`Creating ${text}`)
          return <div>
            <input
              type="checkbox"
              checked={todo.completed}
              onchange={[toggleTodo, id]}
            />
            <span
              style={{ "text-decoration": todo.completed ? "line-through" : "none" }}
            >{text}</span>
          </div>
        }}
      </For>
    </>
  );
};

function StoresTutorial() {
  const [tutorials, setTutorials] = createSignal([
    { name: 'Nested Reactivity - Bad Todo List', component: <BadTodoList /> },
    { name: 'Nested Reactivity - Good Todo List', component: <GoodTodoList /> },
    { name: 'Stores - Todo List 2, Electric Boogaloo', component: <StoreTodo /> },
    { name: 'Stores - Basic Updating a Store', component: <BasicStoreUpdatesExample /> },
    { name: 'Stores - Basic Using Path to Update a Store', component: <BasicPathStoreUpdatesExample /> },
    { name: 'Stores - Advanced Using Path to Update a Store', component: <AdvancedPathStoreUpdatesExample /> },
    { name: 'Temporary Mutability - Todo List 3, Immutable Free', component: <ProduceMutableExample /> },
    { name: 'Permanent Mutability - Todo List 4, By Now It\'s a Chore', component: <CreateMutableExample /> },
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

export default StoresTutorial;

