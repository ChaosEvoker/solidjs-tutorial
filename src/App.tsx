import type { Component } from 'solid-js';

import logo from './logo.svg';
import styles from './App.module.css';
import SignalTutorial from './signals/signals-tutorial';
import EffectsTutorial from './effects/effects-tutorial';
import DerivedSignals from './derived-signals/derived-signals';

const App: Component = () => {
  /**
   * 1. SIGNALS
   */
  // return (
  //   <SignalTutorial />
  // )

  /**
   * 2. EFFECTS
   */
  // return (
  //   <EffectsTutorial />
  // )

  /**
   * 3. DERIVED SIGNALS
   */
  return (
    <DerivedSignals />
  )


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
