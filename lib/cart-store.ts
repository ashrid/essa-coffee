import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  image: string | null;
  slug: string;
  isAvailable: boolean;
  quantity: number;
}

interface CartStore {
  items: CartItem[];
  isDrawerOpen: boolean;
  addItem: (product: Omit<CartItem, "quantity">) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  openDrawer: () => void;
  closeDrawer: () => void;
  totalItems: number;
  subtotal: number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isDrawerOpen: false,

      addItem: (product) => {
        const items = get().items;
        const existing = items.find((item) => item.productId === product.productId);
        if (existing) {
          const newQty = existing.quantity + 1;
          const updatedItems = items.map((item) =>
            item.productId === product.productId
              ? { ...item, quantity: newQty }
              : item
          );
          set({
            items: updatedItems,
            totalItems: updatedItems.reduce((sum, i) => sum + i.quantity, 0),
            subtotal: updatedItems.reduce((sum, i) => sum + i.price * i.quantity, 0),
          });
        } else {
          const newItems = [...items, { ...product, quantity: 1 }];
          set({
            items: newItems,
            totalItems: newItems.reduce((sum, i) => sum + i.quantity, 0),
            subtotal: newItems.reduce((sum, i) => sum + i.price * i.quantity, 0),
          });
        }
      },

      removeItem: (productId) => {
        const newItems = get().items.filter((item) => item.productId !== productId);
        set({
          items: newItems,
          totalItems: newItems.reduce((sum, i) => sum + i.quantity, 0),
          subtotal: newItems.reduce((sum, i) => sum + i.price * i.quantity, 0),
        });
      },

      updateQuantity: (productId, quantity) => {
        const items = get().items;
        if (quantity <= 0) {
          const newItems = items.filter((item) => item.productId !== productId);
          set({
            items: newItems,
            totalItems: newItems.reduce((sum, i) => sum + i.quantity, 0),
            subtotal: newItems.reduce((sum, i) => sum + i.price * i.quantity, 0),
          });
        } else {
          const cappedQty = quantity;
          const newItems = items.map((item) =>
            item.productId === productId
              ? { ...item, quantity: cappedQty }
              : item
          );
          set({
            items: newItems,
            totalItems: newItems.reduce((sum, i) => sum + i.quantity, 0),
            subtotal: newItems.reduce((sum, i) => sum + i.price * i.quantity, 0),
          });
        }
      },

      clearCart: () => {
        set({ items: [], totalItems: 0, subtotal: 0 });
      },

      openDrawer: () => set({ isDrawerOpen: true }),
      closeDrawer: () => set({ isDrawerOpen: false }),

      totalItems: 0,
      subtotal: 0,
    }),
    {
      name: "essa-cafe-cart",
      storage:
        typeof window !== "undefined"
          ? createJSONStorage(() => localStorage)
          : undefined,
      partialize: (state) => ({
        items: state.items,
        totalItems: state.totalItems,
        subtotal: state.subtotal,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.totalItems = state.items.reduce(
            (sum, i) => sum + i.quantity,
            0
          );
          state.subtotal = state.items.reduce(
            (sum, i) => sum + i.price * i.quantity,
            0
          );
        }
      },
    }
  )
);
