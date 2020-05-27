const EventEmitter = require('events');
const network = require('ocore/network');
const eventBus = require('ocore/event_bus');

class AAs {
  constructor(startAddresses) {
    if (typeof startAddresses !== 'object') throw Error('parameter must be an array');
    this.addresses = startAddresses;
    this.__listenAllAddresses();

    this.arrRequestCBs = [];
    this.arrResponseCBs = [];

    this.events = new EventEmitter();

    eventBus.on('message_for_light', async (ws, subject, body) => {
      if (subject === 'light/aa_request' && this.addresses.includes(body.aa_address)) {
        const params = { address: body.aa_address, messages: body.unit.messages };
        this.events.emit('new_request', params, body);
        this.arrRequestCBs.forEach(obj => {
          if (obj.func(params, body)) {
            obj.cb(params, body);
          }
        });
      } else if (subject === 'light/aa_response' && this.addresses.includes(body.aa_address)) {
        const err = body.bounced ? body.response.error : false;
        let vars = !err ? await AAs.getAAVars(body.aa_address) : undefined;

        const params = { address: body.aa_address, response: body.response };
        this.events.emit('new_response', err, params, vars, body);
        this.arrResponseCBs.forEach(obj => {
          if (obj.func(err, params, vars, body)) {
            obj.cb(err, params, vars, body);
          }
        });
      }
    });
  }

  addRequestEventHandler(func, cb) {
    this.arrRequestCBs.push({ func, cb });
  }

  addResponseEventHandler(func, cb) {
    this.arrResponseCBs.push({ func, cb });
  }

  addAddress(address) {
    this.addresses.push(address);
    this.__listen(address);
  }

  __listen(address) {
    network.addLightWatchedAa(address, undefined, err => {
      if (err)
        throw new Error(err);
    });
  }

  __listenAllAddresses() {
    this.addresses.forEach(address => {
      network.addLightWatchedAa(address, undefined, err => {
        if (err)
          throw new Error(err);
      });
    })
  }


  static getAAVars(address, params = {}) {
    const _params = Object.assign({ address }, params);
    return new Promise(resolve => {
      network.requestFromLightVendor('light/get_aa_state_vars',
        _params,
        (ws, request, response) => {
          return resolve(response);
        });
    });
  }
}

module.exports = AAs;
