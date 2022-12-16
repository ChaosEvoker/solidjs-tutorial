import type { Component } from 'solid-js';

import logo from './logo.svg';
import styles from './App.module.css';
import SignalTutorial from './signals/signals-tutorial';
import EffectsTutorial from './effects/effects-tutorial';
import DerivedSignals from './derived-signals/derived-signals';
import Memos from './memos/memos';
import ControlFlowTutorial from './control-flow/control-flow';
import LifecycleTutorial from './lifecycle/lifecycle';
import BindingsTutorial from './bindings/bindings';

const App: Component = () => {
  /**
   * 1. SIGNALS
   */
  // return <SignalTutorial />

  /**
   * 2. EFFECTS
   */
  // return <EffectsTutorial />
  /**
   * 3. DERIVED SIGNALS
   */
  // return <DerivedSignals />

  /**
   * 4. MEMOS
   */
  // return <Memos />

  /**
   * 5. CONTROL FLOW
   */
  // return <ControlFlowTutorial />

   /**
   * 5. LIFECYCLE
   */
  //  return <LifecycleTutorial />

   /**
   * 5. BINDINGS
   */
   return <BindingsTutorial />


  /**
   * ORIGINAL DEFAULT APP FROM TEMPLATE
   */
  // return (
  //   <div class={styles.App}>
  //     <header class={styles.header}>
  //       <img src={logo} class={styles.logo} alt="logo" />
  //       <p>
  //         Edit <code>src/App.tsx</code> and save to reload.
  //       </p>
  //       <a
  //         class={styles.link}
  //         href="https://github.com/solidjs/solid"
  //         target="_blank"
  //         rel="noopener noreferrer"
  //       >
  //         Learn Solid
  //       </a>
  //     </header>
  //   </div>
  // );
};

export default App;
