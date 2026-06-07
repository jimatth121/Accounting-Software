export type ToastKind = "success" | "error" | "info" | "warning";

export interface ToastMessage {
  id: string;
  kind: ToastKind;
  title: string;
  description?: string;
  duration?: number;
}

type Listener = (toasts: ToastMessage[]) => void;

class ToastBus {
  private toasts: ToastMessage[] = [];
  private listeners = new Set<Listener>();

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.toasts);
    return () => this.listeners.delete(listener);
  }

  private emit() {
    this.listeners.forEach((listener) => listener([...this.toasts]));
  }

  push(toast: Omit<ToastMessage, "id">): string {
    const id = `t_${Math.random().toString(36).slice(2, 10)}`;
    const message: ToastMessage = { id, duration: 4500, ...toast };
    this.toasts = [...this.toasts, message];
    this.emit();
    if (message.duration && message.duration > 0) {
      setTimeout(() => this.dismiss(id), message.duration);
    }
    return id;
  }

  dismiss(id: string) {
    this.toasts = this.toasts.filter((toast) => toast.id !== id);
    this.emit();
  }

  clear() {
    this.toasts = [];
    this.emit();
  }
}

const bus = new ToastBus();

export const toast = {
  success(title: string, description?: string) {
    return bus.push({ kind: "success", title, description });
  },
  error(title: string, description?: string) {
    return bus.push({ kind: "error", title, description, duration: 6500 });
  },
  info(title: string, description?: string) {
    return bus.push({ kind: "info", title, description });
  },
  warning(title: string, description?: string) {
    return bus.push({ kind: "warning", title, description });
  },
  dismiss(id: string) {
    bus.dismiss(id);
  },
  clear() {
    bus.clear();
  },
  subscribe(listener: Listener) {
    return bus.subscribe(listener);
  }
};
