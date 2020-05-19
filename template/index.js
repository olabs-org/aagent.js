require('headless-obyte');
const eventBus = require('ocore/event_bus');

const { AA } = require('aagent.js-lib');

eventBus.on('headless_wallet_ready', () => {
  const aa = new AA('CI7TYDWQXJNP7IW5UJHHMO6FBULJHTDH');

  aa.events.on('new_request', (request) => {
    console.error('new request', request);
  });

  aa.events.on('new_response', (err, response, vars) => {
    console.error('new response', response, vars);
  });
});