export default class GenericUtils {
  static toArray<T>(el: T | Array<T> | undefined) {
    if (!el) return [];
    return Array.isArray(el) ? el : [el];
  }
}
