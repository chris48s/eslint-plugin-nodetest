# eslint-plugin-nodetest

ESLint rules for node:test

## Installation

You'll first need to install [ESLint](https://eslint.org/):

```sh
npm i eslint --save-dev
```

Next, install `eslint-plugin-nodetest`:

```sh
npm install eslint-plugin-nodetest --save-dev
```

## Usage

In your [configuration file](https://eslint.org/docs/latest/use/configure/configuration-files#configuration-file), import the plugin `eslint-plugin-nodetest` and add `nodetest` to the `plugins` key:

```js
import { defineConfig } from "eslint/config";
import nodetest from "eslint-plugin-nodetest";

export default defineConfig([
    {
        plugins: {
            nodetest
        }
    }
]);
```


Then configure the rules you want to use under the `rules` key.

```js
import { defineConfig } from "eslint/config";
import nodetest from "eslint-plugin-nodetest";

export default defineConfig([
    {
        plugins: {
            nodetest
        },
        rules: {
            "nodetest/rule-name": "warn"
        }
    }
]);
```



## Configurations

<!-- begin auto-generated configs list -->
TODO: Run eslint-doc-generator to generate the configs list (or delete this section if no configs are offered).
<!-- end auto-generated configs list -->



## Rules

<!-- begin auto-generated rules list -->

| Name |
| :--- |

<!-- end auto-generated rules list -->


