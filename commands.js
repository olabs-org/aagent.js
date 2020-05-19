const fs = require('fs');
const fsp = fs.promises;
const fse = require('fs-extra');
const path = require('path');
const open = require('open');
const rp = require('request-promise');

async function init(folder) {
  if (!folder) folder = 'aa-project';
  const _path = path.join(process.cwd(), folder);
  try {
    await fsp.mkdir(_path, { recursive: true });
    await fse.copy(path.join(__dirname, 'template'), _path);
    console.log('Initialization Successful. Execute:');
    if (folder !== '.') console.log('cd ' + folder);
    console.log('yarn');
    console.log('If you want to work with a testnet network, rename .env.testnet file to .env');
    console.log('-------------------------');
  }
  catch (e) {
    console.error(e);
  }
}

async function validate(path) {
  if (!path) return console.error('Path not found. Please use command: aagent validate file.oscript');
  try {
    await fsp.access(path, fs.F_OK);
  }
  catch (err) {
    console.error('file not found. Please use command: aagent validate file.oscript')
  }

  let data;
  try {
    data = await fsp.readFile(path);
  }
  catch (err) {
    return console.error(err);
  }

  const parse_ojson = require('ocore/formula/parse_ojson');
  const aa_validation = require('ocore/aa_validation.js');
  return await new Promise(resolve => {
    parse_ojson.parse(data.toString(), function (err, arrDefinition) {
      if (err) {
        console.error(err);
        return resolve({ err });
      }
      aa_validation.validateAADefinition(arrDefinition, function (err) {
        if (err) {
          console.error(err);
          return resolve({ err });
        }
        console.log('validate: ok');
        return resolve({ aa: data.toString() });
      });
    });
  });
}

async function deploy(path, testnet) {
  const result = await validate(path);
  if (!result.err) {
    const program = testnet ? 'obyte-tn' : 'obyte';
    let url = program + ':data?app=definition&definition=' + encodeURIComponent(result.aa);
    if (url.length > 2000) {
      console.log('upload to server...');
      const response = await rp({
        method: 'POST',
        uri: 'https://olabs.org/aa/add',
        body: {
          aa: result.aa
        },
        json: true
      });
      if (response.err) {
        return console.error(response.err);
      }
      url = program + ':data?app=definition&definition=' + response.url;
    }
    await open(url);
  }
}


module.exports = {
  init,
  validate,
  deploy
}