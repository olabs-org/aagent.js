# aagent.js
### What's it?
It is CLI and library to work with Autonomous Agents on Obyte

## CLI
Init
```bash
npm i -g aagent.js
aagent --help
```

Create project from [template](template) (with AA example, tests and library)
```bash
aagent init .
```
<br>

Validating AA
```bash
aagent validate aa.oscript
```
<br>

Open GUI Wallet to deploy
```bash
aagent deploy aa.oscript
```
This command supports argument **--testnet** to deploy script through the testnet or mainnet wallet.

<br>

Start tests
```bash
yarn test
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
        console.log('new request', request);
    });

    aa.events.on('new_response', (err, response, vars) => {
        console.log('new response', response, vars);
    });

    aa.events.on('new_aa_definition', (definition) => {
        console.log('new aa definition', definition);
    });

    aa.events.on('new_aa_definition_saved', (definition) => {
        console.log('new aa definition saved', definition);
    });

    aa.newResponseFilter((err, params, vars) => {        
        return true;
      }, (err, params, vars) => {
        console.log(err, params, vars);
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

##### newRequestFilter
```javascript
aa.newRequestFilter((request, body) => {
    return true;
  }, (request, body) => {
    console.log(request, body);
  });
```
A series of this methods is triggered by events and if the first function returns true, it calls the second function.
Other methods from series:
<br>**More about arguments in events.**

```javascript
aa.newResponseFilter((err, params, vars, body) => {
    return true;
  }, (err, params, vars, body) => {
    console.log(err, params, vars, body);
  });
```
```javascript
aa.newDefinitionFilter((definition, body) => {
    return true;
  }, (definition, body) => {
    console.log(definition, body);
  });
```
```javascript
aa.newDefinitionSavedFilter((definition, body) => {
    return true;
  }, (definition, body) => {
    console.log(definition, body);
  });
```
<br>

#### And events:
##### new_request
```javascript
aa.events.on('new_request', (request, body) => {
  console.log('new request', request, body);
});
```
Arguments:
- request - {address: aa_address, messages: unit.messages}
- body - raw body from event

<br>

##### new_response
```javascript
aa.events.on('new_response', (err, params, vars, body) => {
  console.log('new response', err, params, vars, body);
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
  console.log('new aa definition', definition, body);
});
```
Arguments:
- definition - definition from messages
- body - raw body from event

<br>

##### new_aa_definition_saved 
```javascript
aa.events.on('new_aa_definition_saved', (definition, body) => {
  console.log('new aa definition saved', definition, body);
});
```
Arguments:
- definition - definition from messages
- body - raw body from event

---
### AAs
All events applies to the specified addresses in the constructor.
##### constructor  
```javascript
const aas = new AAs(['address'])
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
**Methods**: newRequestFilter, newResponseFilter <br>
**Events**: new_request, new_response<br><br>
**Arguments are identical to AA class**

<br>

#### If you want to start developing on Obyte and you need help, write to us on [discord](https://obyte.org/discord) or on telegram: @xJeneK
