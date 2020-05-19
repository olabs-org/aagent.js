# aagent.js
### What's it?
It is CLI and [library](https://github.com/olabs-org/aagent.js-lib) to work with Autonomous Agents on Obyte

## CLI
Init
```bash
npm i -g aagent.js
aagent --help
```

Create project from [template](template) (with AA example, tests and library)
```bash
aagent init folder
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
*If the file is too large it will be uploaded to the server and transferred to the client in the link.* <br>
This command supports argument **--testnet** to deploy script through the testnet or mainnet wallet.

<br>

Start tests
```bash
yarn test
```

<br>

#### If you want to start developing on Obyte and you need help, write to us on [discord](https://obyte.org/discord) or on telegram: @xJeneK
