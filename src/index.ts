export type ThreadSortableItem = {
  id: string;
  parent?: string;
  order?: string;
};

export type ThreadSortOptions = {
  endOfRecord: string,
  delimiter: string,
}

const defaults: ThreadSortOptions = {
  endOfRecord: '.',
  delimiter: '/',
};

/**
 * Given any items with `id`, `parent`, and `order` properties, build a thread-sensitive
 * sort property that keeps you from having to rebuild the whole tree every time.
 *
 * Note that the top-level items in the thread will remain in the same overall order
 * they were sorted in when the function is called; only the sort order of child items
 * is changed. So: sort the in the 'correct' order (by date, popularity, etc) then pass
 * them into this function to be thread-ified.
 *
 * @see {@link https://git.drupalcode.org/project/drupal/-/blob/11.x/core/modules/comment/src/Entity/Comment.php | Drupal's comment module }
 */
export function sortThread<T extends ThreadSortableItem>(items: T[], options: Partial<ThreadSortOptions> = {}) {
  const opt: ThreadSortOptions = { ...defaults, ...options };
  const startNum = -1;

  for (const c of items) {
    populateThreadForItem(c);
  }

  return items.sort(compareThread);

  function populateThreadForItem(c: ThreadSortableItem) {
    let thread = c.order;
    let max: string | undefined = undefined;
    let parts = [];
    let n: number | undefined = undefined;
    let prefix = '';

    if (thread === undefined) {
      if (c.parent === undefined || !items.find(i => i.id === c.parent)) {
        // This is an item with no parent (depth 0): we start by retrieving the
        // maximum thread level.
        max = stripEor(getMaxThread());
        parts = max?.split(opt.delimiter) ?? [];
        n = max ? Number.parseInt(parts[0], 36) : startNum;
        prefix = '';
      } else {
        // This is an item with a parent, so grab its parent's thread value to use as a
        // prefix, then increment the largest existing sibling thread value

        // Get the parent item:
        const parent = items.find(i => i.id == c.parent);

        if (!parent) {
          throw new Error('Comment parent not found');
        }

        // If the parent hasn't been handle yet, handle it.
        populateThreadForItem(parent);

        prefix = stripEor(getThread(parent!)) + opt.delimiter;

        // Get the max value in *this* thread.
        max = stripEor(getMaxThreadPerThread(c.parent));

        if (max === undefined) {
          // First child of this parent. As the other two cases do an
          // increment of the thread number before creating the thread
          // string set this to 0 so it requires an increment too.
          n = startNum;
        } else {
          // Strip the "/" at the end of the thread.
          max = stripEor(max);

          // Get the value at the correct depth.
          parts = max?.split(opt.delimiter) ?? [];

          const parent_depth = (parts ?? []).length;
          n = Number.parseInt(parts[parent_depth - 1], 36);
        }
      }

      thread = prefix + (++n).toString(36).padStart(2, '0') + opt.endOfRecord;
      setThread(c, thread);
    }
  }

  function stripEor(thread?: string) {
    if (thread && thread.endsWith(opt.endOfRecord)) {
      return thread.slice(0, -1);
    }
    return thread;
  }

  function setThread(node: ThreadSortableItem, value?: string) {
    node.order = value;
  }

  function getThread(node: ThreadSortableItem) {
    return node.order;
  }

  /*
   * The maximum encoded thread value among the top level comments of the
   * node $comment belongs to. NULL is returned when the commented entity has
   * no comments.
   */
  function getMaxThread() {
    return items
      .filter(t => !!t.order)
      .toSorted(compareThread)
      .pop()?.order;
  }

  /*
   * The maximum encoded thread value among all replies of $comment. NULL is
   * returned when the commented entity has no comments.
   */
  function getMaxThreadPerThread(id: string) {
    const justChildren = items
      .filter(i => i.parent === id && !!i.order)
      .toSorted(compareThread);
    return justChildren.pop()?.order;
  }

  function compareThread(a: ThreadSortableItem, b: ThreadSortableItem) {
    if (a.order !== undefined && b.order !== undefined) {
      return a.order.localeCompare(b.order);
    } else {
      return 0;
    }
  }
}

/**
 * Return a simple string representation of the item tree
 */
export function formatThread<T extends ThreadSortableItem>(items: T[]) {
  const indented = items.map(
    i =>
      '  '.repeat((i.order?.split('/')?.length ?? 1) - 1) +
      ' - item ' +
      `${i.id} ${i.parent ? '(parent ' + i.parent + ')' : ''}` ,
  );
  return indented.join('\n');
}
