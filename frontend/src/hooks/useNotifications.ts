export function useNotifications() {
  function addNotification(message: string, type: 'task' | 'comment' | 'mention' = 'task') {
    window.dispatchEvent(
      new CustomEvent('add-notification', {
        detail: { message, type },
      })
    );
  }

  return { addNotification };
}
