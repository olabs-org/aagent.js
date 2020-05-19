const { Testkit } = require('aa-testkit');
const { Network } = Testkit();
const { Utils } = require('aa-testkit/main');
const fsp = require('fs').promises;
const path = require('path');

const test = require('ava');

const isValidAddress = Utils.isValidAddress;
const isValidUnit = function (unit) {
  return Utils.isValidBase64(unit, 44) && unit.endsWith('=')
}

const pathToAA = path.join(__dirname, '..', 'aa.oscript');
const self = {};

test.before(async t => {
  self.aa = (await fsp.readFile(pathToAA)).toString();
  self.network = await Network.create().run()
})

test('init', async t => {
  const network = self.network
  const genesis = await network.getGenesisNode().ready()

  const deployer = await network.newHeadlessWallet().ready()
  const deployerAddress = await deployer.getAddress()

  const wallet = await network.newHeadlessWallet().ready()
  const walletAddress = await wallet.getAddress()

  const { unit: u1 } = await genesis.sendBytes({ toAddress: deployerAddress, amount: 100000000 })
  t.true(isValidUnit(u1));
  await network.witnessUntilStable(u1);

  const { unit: u2 } = await genesis.sendBytes({ toAddress: walletAddress, amount: 100000000 })
  t.true(isValidUnit(u2));
  await network.witnessUntilStable(u2);

  self.deployer = deployer;
  self.deployerAddress = deployerAddress;
  self.wallet = wallet;
  self.walletAddress = walletAddress;
})

test('deploy aa', async t => {
  const { address: aa_address, unit: aa_unit } = await self.deployer.deployAgent(self.aa);
  t.true(isValidAddress(aa_address));
  t.true(isValidUnit(aa_unit))
  await self.network.witnessUntilStable(aa_unit);
  self.aa_address = aa_address;
});

test('set var', async t => {
  const { unit, error } = await self.wallet.triggerAaWithData({
    toAddress: self.aa_address,
    amount: 10000,
    data: {
      key: 'test_key',
      value: 'test_value'
    },
  });
  t.falsy(error);
  t.true(isValidUnit(unit));

  await self.network.witnessUntilStable(unit);
  const { response } = await self.network.getAaResponseToUnit(unit);
  t.is(response.response.responseVars.status, 'ok');
});

test('get var', async t => {
  const { vars } = await self.deployer.readAAStateVars(self.aa_address);
  t.is(vars['test_key'], 'test_value');
});

