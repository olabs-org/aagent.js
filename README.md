# aagent.js

### What's it?
It is [CLI](https://github.com/olabs-org/aagent-cli) and library to work with Autonomous Agents on Obyte

### Quick start
You can create a new project using [CLI](https://github.com/olabs-org/aagent-cli)
```bash
npm i -g aagent-cli
aagent init folder
```
Or add to an existing project
```bash
yarn add aagent.js
```
```javascript
require('headless-obyte');
const eventBus = require('ocore/event_bus');
const { AA, AAs } = require('aagent.js');
```

## Library
### AA
Example: 
```javascript
require('headless-obyte');
const eventBus = require('ocore/event_bus');

const { AA } = require('aagent.js');

eventBus.on('headless_wallet_ready', () => {
    const aa = new AA('address');

    aa.events.on('new_request', (request) => {
        console.error('new request', request);
    });

    aa.events.on('new_response', (err, response, vars) => {
        console.error('new response', response, vars);
    });

    aa.events.on('new_aa_definition', (definition) => {
        console.error('new aa definition', definition);
    });

    aa.events.on('new_aa_definition_saved', (definition) => {
        console.error('new aa definition saved', definition);
    });

    aa.newResponseFilter((err, params, vars) => {        
        return true;
      }, (err, params, vars) => {
        console.error(err, params, vars);
      });

});
```
<br>

#### AA class contains the following methods:
All events are applied to the specified address in the constructor.
##### constructor  
```javascript
const aa = new AA('address')
```
one argument - aa_address(string)

static method **getAAVars**:
```javascript
AA.getAAVars('address');
```
will return variables from AA. 

<br>

#### Event handlers:
The handler triggers an event, passes it to the first function, and if it returns true, calls the second function. You can use them to process specific data(like a router).
<br>**More about arguments in events.**

<br>

```javascript
aa.addRequestEventHandler((request, body) => {
    return true;
  }, (request, body) => {
    console.error(request, body);
  });
```
```javascript
aa.addResponseEventHandler((err, params, vars, body) => {
    return true;
  }, (err, params, vars, body) => {
    console.error(err, params, vars, body);
  });
```
```javascript
aa.addDefinitionEventHandler((definition, body) => {
    return true;
  }, (definition, body) => {
    console.error(definition, body);
  });
```
```javascript
aa.addDefinitionSavedEventHandler((definition, body) => {
    return true;
  }, (definition, body) => {
    console.error(definition, body);
  });
```
<br>

#### And events:
##### new_request
```javascript
aa.events.on('new_request', (request, body) => {
  console.error('new request', request, body);
});
```
Arguments:
- request - {address: aa_address, messages: unit.messages}
- body - raw body from event

<br>

##### new_response
```javascript
aa.events.on('new_response', (err, params, vars, body) => {
  console.error('new response', err, params, vars, body);
});
```
Arguments:
- err - if *bounced* return error message
- params - { address: aa_address, response: body.response }
- vars - new vars from AA
- body - raw body from event

<br>

##### new_aa_definition
```javascript
aa.events.on('new_aa_definition', (definition, body) => {
  console.error('new aa definition', definition, body);
});
```
Arguments:
- definition - definition from messages
- body - raw body from event

<br>

##### new_aa_definition_saved 
```javascript
aa.events.on('new_aa_definition_saved', (definition, body) => {
  console.error('new aa definition saved', definition, body);
});
```
*This event can be triggered twice with the same data (architectural features), please consider this.*<br>
Arguments:
- definition - definition from messages
- body - raw body from event

---
### AAs
All events applies to the specified addresses in the constructor.
##### constructor  
```javascript
const aas = new AAs(['address', 'address2'])
```
one argument - aa_addresses - array[string]

<br>

```javascript
aas.addAddress('address');
```
Adds a new address and subscribes to it

<br>

static method **getAAVars**:
```javascript
AAs.getAAVars('address');
```
will return variables from AA. 

This class supports only: <br>
**Methods**: addRequestEventHandler, addResponseEventHandler <br>
**Events**: new_request, new_response<br><br>
**Arguments are identical to AA class**

<br>

#### If you want to start developing on Obyte and you need help, write to us on [discord](https://obyte.org/discord) or on telegram: @xJeneK
