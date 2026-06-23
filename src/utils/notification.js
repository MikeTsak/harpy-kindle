let listeners = [];

export function subscribe(listener) {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter(l => l !== listener);
  };
}

export function publish(notification) {
  listeners.forEach(listener => listener(notification));
}
