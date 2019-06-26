const {assertRevert} = require('./helpers/assertRevert');


const HMREPSWAP = artifacts.require("HMREPSWAP");
let HMREP; //HaHMARKET REP reputation token

const HASHM = artifacts.require("HASHM");
let HMSEC;

let accounts = web3.eth.getAccounts(function(err, acc) {accounts = acc});


    beforeEach(async () => {
  //CONSTRUCTOR TOKEN ERC20   
      HMREP = await HMREPSWAP.new(10000, 'HASHMARKET REP', 'HMR', { from: accounts[0] });
      HMSEC = await HASHM.new(10000, 'HASH MARKET', 'HMS', { from: accounts[0] }); 
    });

    contract('HMREPSWAP', async accounts => {
  
    it('creation: should create an initial balance of 10000 for the creator', async () => {
      const balance = await HMREP.balanceOf.call(accounts[0]);
      assert.strictEqual(balance.toNumber(), 10000);
    });
  
  
  
    it('creation: test correct setting of vanity information', async () => {
      const name = await HMREP.name.call();
      assert.strictEqual(name, 'HASHMARKET REP');
  
      /*const decimals = await HMREP.decimals.call();
      assert.strictEqual(decimals.toNumber(), 1);*/
  
      const symbol = await HMREP.symbol.call();
      assert.strictEqual(symbol, 'HMR');

      const totalSupply = await HMREP.totalSupply.call();
      assert.strictEqual(totalSupply.toNumber(), 10000);
    });


    /*it('creation: should succeed in creating over 2^256 - 1 (max) tokens', async () => {
      // 2^256 - 1
      const HMREP2 = await HMREP.new('115792089237316195423570985008687907853269984665640564039457584007913129639935', 'HASH MARKET', 1, 'HMS', { from: accounts[0] });
      const totalSupply = await HMREP2.totalSupply();
      const match = totalSupply.equals('1.15792089237316195423570985008687907853269984665640564039457584007913129639935e+77');
      assert(match, 'result is not correct');
    }); */

    it('balanceAddress: Gets the balance of the specified address.', async () => {
      await HMREP.balanceAddress(accounts[0], { from: accounts[0] });
      const balance00 = await HMREP.balanceOf.call(accounts[0]);
      assert.strictEqual(balance00.toNumber(), 10000);

      await HMREP.balanceAddress(accounts[2], { from: accounts[1] });
      const balance02 = await HMREP.balanceOf.call(accounts[2]);
      assert.strictEqual(balance02.toNumber(), 0);
    });


    it('transfers: should transfer 6000 to accounts[1] with accounts[0] having 10000', async () => {
      await HMREP.transfer(accounts[1], 6000, { from: accounts[0] });
      const balance = await HMREP.balanceOf.call(accounts[1]);
      assert.strictEqual(balance.toNumber(), 6000);
    });

    it('transfers: transfer to a freeze account. Should fail', async () => {
      await HMREP.freezeAccount(accounts[1], true, { from: accounts[0] });
      await HMREP.transfer(accounts[1], 6000, { from: accounts[0] });
      const balance = await HMREP.balanceOf.call(accounts[1]);
      assert.strictEqual(balance.toNumber(), 6000);
    });
  
    it('transfers: should fail when trying to transfer 10001 to accounts[1] with accounts[0] having 10000', async () => {
      await assertRevert(HMREP.transfer.call(accounts[1], 10001, { from: accounts[0] }));
    });


    it('burn: destroy tokens: Remove `_value` tokens from the system irreversibly', async () => {
      await HMREP.addOwner(accounts[1], { from: accounts[0] });
      await HMREP.transfer(accounts[1], 6000, { from: accounts[0] });
      await HMREP.burn(1000, { from: accounts[1] });
      const balance01 = await HMREP.balanceOf.call(accounts[1]);
      assert.strictEqual(balance01.toNumber(), 5000);

      const totalSupply = await HMREP.totalSupply.call();
      assert.strictEqual(totalSupply.toNumber(), 9000);
    });


    it('burnSC: destroy tokens: Remove `_value` tokens inside the reputation smart contract from the system irreversibly', async () => {
      await HMREP.transfer(HMREP.address, 6000, { from: accounts[0] });
      await HMREP.burnSC(1000, { from: accounts[0] });
      const balance = await HMREP.balanceOf.call(HMREP.address);
      assert.strictEqual(balance.toNumber(), 5000);

      const totalSupply = await HMREP.totalSupply.call();
      assert.strictEqual(totalSupply.toNumber(), 9000);
    });


    it('addOnwer: add an address to the ownerslist from the sc owner address', async () => {
      await HMREP.addOwner(accounts[1], { from: accounts[0] });
      const addrAdded = await HMREP.ownerslist.call(accounts[1]);
      assert.equal(addrAdded, true);
    });
    
  
    it('removeOwner: remove an address to the ownerslist from one ownerlist address', async () => {
      await HMREP.addOwner(accounts[1], { from: accounts[0] });
      const addrAdded = await HMREP.ownerslist.call(accounts[1]);
      assert.equal(addrAdded, true);
      
      await HMREP.removeOwner(accounts[1], { from: accounts[0] });
      const addrRemoved = await HMREP.ownerslist.call(accounts[1]);
      assert.equal(addrRemoved, false);
    });
    
  
    it('AddOwner and check onlyOwner functions', async () => {
      await HMREP.addOwner(accounts[1], { from: accounts[0] });
      const addrAdded = await HMREP.ownerslist.call(accounts[1]);
      assert.equal(addrAdded, true);   
      
      await HMREP.addOwner(accounts[2], { from: accounts[1] });
      const addrAdded2 = await HMREP.ownerslist.call(accounts[2]);
      assert.equal(addrAdded2, true);
      
      await HMREP.removeOwner(accounts[2], { from: accounts[1] });
      const addrRemoved = await HMREP.ownerslist.call(accounts[2]);
      assert.equal(addrRemoved, false);
      
      await HMREP.freezeAccount(accounts[2], true, { from: accounts[1] });
      const addrFreeze = await HMREP.frozenAccount.call(accounts[2]);
      assert.equal(addrFreeze, true);
      
      await HMREP.freezeAccount(accounts[2], false, { from: accounts[1] });
      const addrFreeze2 = await HMREP.frozenAccount.call(accounts[2]);
      assert.equal(addrFreeze2, false);
      
      await HMREP.mintToken(accounts[2], 5000, { from: accounts[1] });
      const balanceMint = await HMREP.balanceOf.call(accounts[2]);
      assert.strictEqual(balanceMint.toNumber(), 5000);
      
      await HMREP.setHASHMaddress(accounts[3], { from: accounts[1] });
      const newAddr = await HMREP.HASHMaddress.call(); 
      assert.strictEqual(newAddr.toString(), accounts[3]); 
      
      await HMREP.setHASHMrate(1, 2, { from: accounts[0] });
      const mult = 1; 
      const div = 2; 
      const valueMult = await HMREP.HASHMratemult.call(); 
      assert.strictEqual(valueMult.toString(), mult.toString()); 
      const valueDiv = await HMREP.HASHMratediv.call(); 
      assert.strictEqual(valueDiv.toString(), div.toString()); 
    }); 
    
    
     it('freezeAccount: Allow` `target` from sending & receiving tokens', async () => {
      await HMREP.freezeAccount(accounts[1], true, { from: accounts[0] });
      const addrFreeze = await HMREP.frozenAccount.call(accounts[1]);
      assert.equal(addrFreeze, true);
      
      await HMREP.freezeAccount(accounts[1], false, { from: accounts[0] });
      const addrFreeze2 = await HMREP.frozenAccount.call(accounts[1]);
      assert.equal(addrFreeze2, false);
    });
    
    
    
     it('mintToken: Create `mintedAmount` tokens and send it to `target`that is freeze. Should fail.', async () => {
      await HMREP.freezeAccount(accounts[1], true, { from: accounts[0] });
      const addrFreeze = await HMREP.frozenAccount.call(accounts[1]);
      assert.equal(addrFreeze, true);
      
      await HMREP.mintToken(accounts[1], 5000, { from: accounts[0] });
      const balanceMint = await HMREP.balanceOf.call(accounts[1]);
      assert.strictEqual(balanceMint.toNumber(), 5000);
    });
    
    
    it('mintToken: Create `mintedAmount` tokens and send it to `target`', async () => {
      await HMREP.mintToken(accounts[1], 5000, { from: accounts[0] });
      const balanceMint = await HMREP.balanceOf.call(accounts[1]);
      assert.strictEqual(balanceMint.toNumber(), 5000);
    });
    
    
   
    it('addressRate: Calculate the rate of the reputation that a address has', async () => {
      await HMREP.addressRate(accounts[0], { from: accounts[3] });
      const rate1 = 100;
      const rateAddr = await HMREP.userRate.call();
      assert.strictEqual(rateAddr.toString(), rate1.toString()); 
      
      await HMREP.addressRate(accounts[1], { from: accounts[3] });
      const rate2 = 0;
      const rateAddr2 = await HMREP.userRate.call(); 
      assert.strictEqual(rateAddr2.toString(), rate2.toString()); 
    });
    
    
    
    it('setHASHMaddress: Set de HASHM Security Token address', async () => {
      await HMREP.setHASHMaddress(accounts[3], { from: accounts[0] });
      const newAddr = await HMREP.HASHMaddress.call(); 
      assert.strictEqual(newAddr.toString(), accounts[3]);
    }); 
    
    
    
    it('setHASHMrate: Set de HASHM rate in order to modify the HASHM security token that has been received.', async () => {
      await HMREP.setHASHMrate(1, 2, { from: accounts[0] });
      const mult = 1; 
      const div = 2; 

      const valueMult = await HMREP.HASHMratemult.call(); 
      assert.strictEqual(valueMult.toString(), mult.toString()); 
    
      const valueDiv = await HMREP.HASHMratediv.call(); 
      assert.strictEqual(valueDiv.toString(), div.toString()); 
    });
    
    
    
    it('swapToken: Swap function in order to send reputation to the ERC20 reputation contract and receive Security token inside this contract.', async () => {
      await HMSEC.transfer(HMREP.address, 2000, { from: accounts[0] });
      const balance = await HMSEC.balanceOf.call(HMREP.address);
      assert.strictEqual(balance.toNumber(), 2000);

      await HMREP.setHASHMaddress(HASHM.address, { from: accounts[0] });
      const newAddr = await HMREP.HASHMaddress.call(); 
      assert.strictEqual(newAddr.toString(), HASHM.address);

      await HMREP.setHASHMrate(1, 2, { from: accounts[0] });
      const mult = 1; 
      const div = 2; 
      const valueMult = await HMREP.HASHMratemult.call(); 
      assert.strictEqual(valueMult.toString(), mult.toString()); 
      const valueDiv = await HMREP.HASHMratediv.call(); 
      assert.strictEqual(valueDiv.toString(), div.toString()); 

      await HMREP.mintToken(accounts[1], 300, { from: accounts[0] }); 
      const balanceMint = await HMREP.balanceOf.call(accounts[1]);
      assert.strictEqual(balanceMint.toNumber(), 300);
      
    
      await HMREP.swapToken(200, { from: accounts[1] });
      const balance01 = await HMREP.balanceOf.call(accounts[1]);
      assert.strictEqual(balance01.toNumber(), 100);
      const balanceSC = await HMREP.balanceOf.call(HMREP.address);
      assert.strictEqual(balanceSC.toNumber(), 200); 
      const balance1 = await HMSEC.balanceOf.call(accounts[1]);
      assert.strictEqual(balance1.toNumber(), 100); 
      const balanceSEC = await HMSEC.balanceOf.call(HMREP.address);
      assert.strictEqual(balanceSEC.toNumber(), 1900); 
    });


    it('HASHMtransfer: Function to send token security in the smart contract to a msg.sender. ', async () => {
      await HMSEC.transfer(HMREP.address, 2000, { from: accounts[0] });
      const balance = await HMSEC.balanceOf.call(HMREP.address);
      assert.strictEqual(balance.toNumber(), 2000);

      await HMREP.HASHMtransfer(1500, { from: accounts[0] });
      const balanceSC = await HMSEC.balanceOf.call(HMREP.address);
      assert.strictEqual(balanceSC.toNumber(), 500);

      const balance00 = await HMSEC.balanceOf.call(accounts[0]);
      assert.strictEqual(balance00.toNumber(), 1500);
    });
  


  });

