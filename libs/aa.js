const EventEmitter = require('events');
const network = require('ocore/network');
const eventBus = require('ocore/event_bus');
const conf = require('ocore/conf');
const { getAllAuthorsAndOutputAddresses } = require('./utils');

class AA {
  constructor(address) {
    this.address = address;
    this.__listen();
    this.arrRequestCBs = [];
    this.arrResponseCBs = [];
    this.arrDefinitionCBs = [];
    this.arrDefinitionSavedCBs = [];

    this.events = new EventEmitter();

    function aa_request(body) {
      const params = { address: body.aa_address, messages: body.unit.messages };
      this.events.emit('new_request', params, body);
      this.arrRequestCBs.forEach(obj => {
        if (obj.func(params, body)) {
          obj.cb(params, body);
        }
      });
    }

    async function aa_response(body) {
      const err = body.bounced ? body.response.error : false;
      let vars = !err ? await AA.getAAVars(this.address) : undefined;

      const params = { address: body.aa_address, response: body.response };
      this.events.emit('new_response', err, params, vars, body);
      this.arrResponseCBs.forEach(obj => {
        if (obj.func(err, params, vars, body)) {
          obj.cb(err, params, vars, body);
        }
      });
    }

    function aa_definition(body) {
      let def = body.messages.find(v => v.app === 'definition');
      if (def) def = def.payload;

      this.events.emit('new_aa_definition', def, body);
      this.arrDefinitionCBs.forEach(obj => {
        if (obj.func(def, body)) {
          obj.cb(def, body);
        }
      });
    }

    function aa_definition_saved(body) {
      let def = body.messages.find(v => v.app === 'definition');
      if (def) def = def.payload;
      this.events.emit('new_aa_definition_saved', def, body);
      this.arrDefinitionSavedCBs.forEach(obj => {
        if (obj.func(def, body)) {
          obj.cb(def, body);
        }
      });
    }

    aa_request = aa_request.bind(this);
    aa_response = aa_response.bind(this);
    aa_definition = aa_definition.bind(this);
    aa_definition_saved = aa_definition_saved.bind(this);

    if (!conf.bLight) {
      const storage = require('ocore/storage');
      const db = require('ocore/db');
      eventBus.on('new_joint', objJoint => {
        const objUnit = objJoint.unit;
        const objAddresses = getAllAuthorsAndOutputAddresses(objUnit);
        if (!objAddresses) // voided unit
          return;
        const arrOutputAddresses = objAddresses.output_addresses;
        const arrBaseAAAddresses = objAddresses.base_aa_addresses;
        const arrAllAAAddresses = arrOutputAddresses.concat(arrBaseAAAddresses);
        if (arrAllAAAddresses.includes(this.address) && arrOutputAddresses.length > 0) {
          aa_request({ aa_address: this.address, unit: objUnit });
        }
        if (arrBaseAAAddresses.includes(this.address)) {
          aa_definition(objUnit);
        }
      });

      eventBus.on('aa_response', objAAResponse => {
        if(objAAResponse.aa_address === this.address)
          aa_response(objAAResponse)
      });

      eventBus.on('aa_definition_saved', (payload, unit) => {
        const base_aa = payload.definition[1].base_aa;
        if (!base_aa)
          return;
        if(base_aa !== this.address)
          return;

        storage.readJoint(db, unit, {
          ifNotFound: function () {
            console.log('recently saved unit ' + unit + ' not found');
          },
          ifFound: function (objJoint) {
            aa_definition_saved(objJoint.unit);
          }
        })
      })
    } else {
      eventBus.on('message_for_light', (ws, subject, body) => {
        if (subject === 'light/aa_request' && body.aa_address === this.address) {
          aa_request(body);
        } else if (subject === 'light/aa_response' && body.aa_address === this.address) {
          aa_response(body);
        } else if (subject === 'light/aa_definition') {
          aa_definition(body);
        } else if (subject === 'light/aa_definition_saved') {
          aa_definition_saved(body);
        }
      });
    }
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
    if (conf.bLight) {
      network.addLightWatchedAa(this.address, undefined, err => {
        if (err)
          throw new Error(err);
      });
    }
  }


  static getAAVars(address, params = {}) {
    const _params = Object.assign({ address }, params);
    return new Promise(resolve => {
      if (conf.bLight) {
        network.requestFromLightVendor('light/get_aa_state_vars',
          _params,
          (ws, request, response) => {
            return resolve(response);
          });
      } else {
        const storage = require('ocore/storage');
        storage.readAAStateVars(_params.address, _params.var_prefix_from || '', _params.var_prefix_to || '', _params.limit || 2000, (objStateVars) => {
          return resolve(objStateVars);
        });
      }
    });
  }
}

module.exports = AA;
