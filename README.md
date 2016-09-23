# babel-plugin-react-intl

Fork of [yahoo/babel-plugin-react-intl](https://github.com/yahoo/babel-plugin-react-intl ) which adds support for `require` React Intl instead of `import` it.

> This Babel plugin only visits ES6 modules which import React Intl.

Node.js version 6 doesn't support ES6 modules. `import` is not available and `require` is the way to get installed modules into a node module file.
This fork enables you to require the react-intl package:

```js
const { defineMessages } = require('react-intl')
const {errorMessage} = defineMessages({
    errorMessage:{
        id:'errorMessageId',
        defaultMessage:'An error occured!',
        description:'general error message text'
    }
})
```

