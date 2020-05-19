const EventEmitter = require('events');
const network = require('ocore/network');
const eventBus = require('ocore/event_bus');

class AA {
  constructor(address) {
    this.address = address;
    this.__listen();
    this.arrRequestCBs = [];
    this.arrResponseCBs = [];
    this.arrDefinitionCBs = [];
    this.arrDefinitionSavedCBs = [];

    this.events = new EventEmitter();

    eventBus.on('message_for_light', async (ws, subject, body) => {
      if (subject === 'light/aa_request' && body.aa_address === this.address) {
        const params = {address: body.aa_address, messages: body.unit.messages};
        this.events.emit('new_request', params, body);
        this.arrRequestCBs.forEach(obj => {
          if (obj.func(params, body)) {
            obj.cb(params, body);
          }
        });
      } else if (subject === 'light/aa_response' && body.aa_address === this.address) {
        const err = body.bounced ? body.response.error : false;
        let vars = !err ? await AA.getAAVars(this.address) : undefined;

        const params = { address: body.aa_address, response: body.response };
        this.events.emit('new_response', err, params, vars, body);
        this.arrResponseCBs.forEach(obj => {
          if (obj.func(err, params, vars, body)) {
            obj.cb(err, params, vars, body);
          }
        });
      } else if (subject === 'light/aa_definition') {
        let def = body.messages.find(v => v.app === 'definition');
        if(def) def = def.payload;

        this.events.emit('new_aa_definition', def, body);
        this.arrDefinitionCBs.forEach(obj => {
          if (obj.func(def, body)) {
            obj.cb(def, body);
          }
        });
      } else if (subject === 'light/aa_definition_saved') {
        let def = body.messages.find(v => v.app === 'definition');
        if (def) def = def.payload;
        this.events.emit('new_aa_definition_saved', def, body);
        this.arrDefinitionSavedCBs.forEach(obj => {
          if (obj.func(def, body)) {
            obj.cb(def, body);
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

  addDefinitionEventHandler(func, cb) {
    this.arrDefinitionCBs.push({ func, cb });
  }

  addDefinitionSavedEventHandler(func, cb) {
    this.arrDefinitionSavedCBs.push({ func, cb });
  }

  __listen() {
    network.addLightWatchedAa(this.address, undefined, err => {
      if (err)
        throw new Error(err);
    });
  }


  static getAAVars(address) {
    return new Promise(resolve => {
      network.requestFromLightVendor('light/get_aa_state_vars',
        { address },
        (ws, request, response) => {
          return resolve(response);
        });
    });
  }
}

module.exports = AA;
