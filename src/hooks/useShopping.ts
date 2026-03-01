import { useStore } from '@/store';
import type { ShopCategory } from '@/types';

/** Shopping list CRUD + toggle + grouping by category. */
export function useShopping() {
  const shoppingList = useStore((s) => s.shoppingList);
  const addShoppingItem = useStore((s) => s.addShoppingItem);
  const editShoppingItem = useStore((s) => s.editShoppingItem);
  const removeShoppingItem = useStore((s) => s.removeShoppingItem);
  const toggleShoppingItem = useStore((s) => s.toggleShoppingItem);

  /** Items grouped by category, only including non-empty groups. */
  const grouped = shoppingList.reduce<Record<ShopCategory, typeof shoppingList>>(
    (acc, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    },
    {} as Record<ShopCategory, typeof shoppingList>
  );

  const doneCount = shoppingList.filter((i) => i.checked).length;
  const totalCount = shoppingList.length;

  return {
    shoppingList,
    grouped,
    doneCount,
    totalCount,
    addShoppingItem,
    editShoppingItem,
    removeShoppingItem,
    toggleShoppingItem,
  };
}
