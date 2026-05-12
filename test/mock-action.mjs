import * as fs from 'node:fs/promises';
import yaml from 'js-yaml';

import esmock from 'esmock';

export const mockAction = async (action, module) => {
  let outputs;
  let inputs;
  let paths;
  let failed;
  const actionConfig = yaml.load(await fs.readFile(action, 'utf8'));

  const getInput = (key, { required } = {}) => {
    const inputConfig = actionConfig.inputs[key];
    if (!inputConfig) {
      throw new Error(`invalid input ${key}`);
    }
    if (Object.hasOwn(inputs, key)) {
      return inputs[key];
    }
    else if (required) {
      throw new Error(`input ${key} is required but was not provided!`);
    }
    else if (Object.hasOwn(inputConfig, 'default')) {
      const def = inputConfig['default'];
      return def.replace(/\$\{\{(.*?)\}\}/, (...[, inner]) => {
        inner = inner.trim();
        if (inner == 'github.token') {
          return process.env['GITHUB_TOKEN'] || '';
        }
        return '';
      });
    }
    else {
      return '';
    }
  };

  const main = await esmock(module, {}, {
    '@actions/core': {
      getInput:        (key, ...rest) => (getInput(key, ...rest) || '').trim(),
      getBooleanInput: (key, ...rest) => {
        const value = getInput(key, ...rest);
        if (value === true || value === false) {
          return value;
        }
        else if (value === 'true' || value === 'True' || value === 'TRUE') {
          return true;
        }
        else if (value === 'false' || value === 'False' || value === 'FALSE') {
          return false;
        }
        else {
          throw new Error(`invalid value for ${key}`);
        }
      },
      getMultilineInput: (key, ...rest) => (getInput(key, ...rest) || '').split(/\n/).map(t => t.trim()),
      setOutput:         (key, value) => { outputs[key] = value; },
      setFailed:         (message) => { failed = message; },
      addPath:           (path) => { paths.push(path); },
      debug:             () => { },
      info:              () => { },
    },
  });

  return async (input) => {
    outputs = {};
    paths = [];
    inputs = input;
    failed = undefined;
    await main();
    if (failed) {
      throw new Error(failed);
    }
    return {
      outputs,
      paths,
    };
  };
};

export default mockAction;
