
export class Snackbar {
  /**
   * /
   * @param message
   * @param delay
   * Show snackBar on project
   */
  static show(message: string, delay: number) {
    const snackbar = document.getElementById('snackbarV2');
    if (snackbar) snackbar.innerHTML = message;
    if (snackbar) {
      if (snackbar.className == 'show') return;
      snackbar.className = '';
      snackbar.className = 'show';
      (async () => {
        await this.delay(delay);
        snackbar.className = '';
      })();
    }
  }

  static delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

