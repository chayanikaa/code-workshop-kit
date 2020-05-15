import isPlainObject from 'is-plain-object';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const deepmerge = require('deepmerge');

class CwkStateSingleton {
  constructor() {
    this.__data = {};
  }

  get state() {
    return this.__data;
  }

  set state(value) {
    this.__data = deepmerge(this.__data, value, { isMergeableObject: isPlainObject });
  }
}

const cwkState = new CwkStateSingleton();

export { cwkState };