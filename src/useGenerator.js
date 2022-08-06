import { useEffect, useState } from "react";

export default function useGenerator(initialState, generator) {
  const [currentState, setCurrentState] = useState(initialState);
  useEffect(() => {
    let isMounted = true;
    setCurrentState(initialState);
    async function generate() {
      while (true) {
        const nextState = await generator.next();
        if (!isMounted) {
          // while (true) break; lets us resume the generator.
          // `generator.return()` or `for (x of generator)` consumes the generator preventing resumption.
          break;
        }
        setCurrentState(nextState.value);
      }
    }
    generate();
    return () => {
      isMounted = false;
    };
  }, [initialState, generator]);

  return currentState;
}
