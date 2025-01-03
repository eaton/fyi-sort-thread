type ParentSortableItem = {
    id: string;
    parent?: string;
    thread?: string;
};
/**
 * Given any items with `id`, `parent`, and `thread` properties, build thread-sensitive
 * sort properties that keep you from having to rebuild the whole tree every time.
 *
 * Note that the top-level comments in the thread will remain in the same overall order
 * they were sorted in when the function is called; only the sort order of child items
 * is changed. So: sort the in the 'correct' order (by date, popularity, etc) then pass
 * them into this function to be thread-ified.
 *
 * @see {@link https://git.drupalcode.org/project/drupal/-/blob/11.x/core/modules/comment/src/Entity/Comment.php | Drupal's comment module }
 */
declare function sortByParents(items: ParentSortableItem[]): ParentSortableItem[];
/**
 * Return a simple string representation of the item tree
 */
declare function formatThread(items: ParentSortableItem[]): string;

export { type ParentSortableItem, formatThread, sortByParents };
