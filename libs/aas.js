const EventEmitter = require('events');
const network = require('ocore/network');
const eventBus = require('ocore/event_bus');
const conf = require('ocore/conf');
const { getAllAuthorsAndOutputAddresses } = require('./utils');

class AAs {
  constructor(startAddresses) {
    if (typeof startAddresses !== 'object') throw Error('parameter must be an array');
    this.addresses = startAddresses;
    this.__listenAllAddresses();

    this.arrRequestCBs = [];
    this.arrResponseCBs = [];

    this.events = new EventEmitter();

    function aa_request(body){
      const params = { address: body.aa_address, messages: body.unit.messages };
      this.events.emit('new_request', params, body);
      this.arrRequestCBs.forEach(obj => {
        if (obj.func(params, body)) {
          obj.cb(params, body);
        }
      });
    }

    async function aa_response(body){
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

    aa_request = aa_request.bind(this);
    aa_response = aa_response.bind(this);

    if(!conf.bLight) {
      eventBus.on('new_joint', objJoint => {
        const objUnit = objJoint.unit;
        const objAddresses = getAllAuthorsAndOutputAddresses(objUnit);
        if (!objAddresses) // voided unit
          return;
        const arrOutputAddresses = objAddresses.output_addresses;
        const arrBaseAAAddresses = objAddresses.base_aa_addresses;
        const arrAllAAAddresses = arrOutputAddresses.concat(arrBaseAAAddresses);
        this.addresses.forEach(address => {
          if (arrAllAAAddresses.includes(address) && arrOutputAddresses.length > 0) {
            aa_request({ aa_address: address, unit: objUnit });
          }
        });
      });

      eventBus.on('aa_response', objAAResponse => {
        this.addresses.forEach(address => {
        if (objAAResponse.aa_address === address)
          aa_response(objAAResponse)
        });
      });
    }else {
      eventBus.on('message_for_light', async (ws, subject, body) => {
        if (subject === 'light/aa_request' && this.addresses.includes(body.aa_address)) {
          aa_request(body);
        } else if (subject === 'light/aa_response' && this.addresses.includes(body.aa_address)) {
          aa_response(body);
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

  addAddress(address) {
    this.addresses.push(address);
    this.__listen(address);
  }

  __listen(address) {
    if(conf.bLight) {
      network.addLightWatchedAa(address, undefined, err => {
        if (err)
          throw new Error(err);
      });
    }
  }

  __listenAllAddresses() {
    if(conf.bLight) {
      this.addresses.forEach(address => {
        network.addLightWatchedAa(address, undefined, err => {
          if (err)
            throw new Error(err);
        });
      })
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

module.exports = AAs;
