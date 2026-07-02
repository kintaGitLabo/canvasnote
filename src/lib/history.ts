export class History<T> {
  private past: T[] = []
  private future: T[] = []
  constructor(private present: T, private readonly limit = 50) {}
  get current() { return this.present }
  push(next: T) { this.past.push(this.present); if (this.past.length > this.limit) this.past.shift(); this.present = next; this.future = [] }
  undo() { const item = this.past.pop(); if (!item) return this.present; this.future.push(this.present); this.present = item; return item }
  redo() { const item = this.future.pop(); if (!item) return this.present; this.past.push(this.present); this.present = item; return item }
  get canUndo() { return this.past.length > 0 }
  get canRedo() { return this.future.length > 0 }
}
