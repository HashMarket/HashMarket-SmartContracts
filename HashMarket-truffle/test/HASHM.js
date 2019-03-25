const HASHMerc20 = artifacts.require("HASHM");
let HMSEC; //HashMarket security token

contract('HASHM', (accounts) => {
  beforeEach(async () => {
//CONSTRUCTOR TOKEN ERC20   
    HMSEC = await HASHM.new(10000, 'HASH MARKET', 1, 'HMS', { from: accounts[0] });
  });

  it('creation: should create an initial balance of 10000 for the creator', async () => {
    const balance = await HMSEC.balanceOf.call(accounts[0]);
    assert.strictEqual(balance.toNumber(), 10000);
  });



  it('creation: test correct setting of vanity information', async () => {
    const name = await HMSEC.name.call();
    assert.strictEqual(name, 'HASH MARKET');

    const decimals = await HMSEC.decimals.call();
    assert.strictEqual(decimals.toNumber(), 1);

    const symbol = await HMSEC.symbol.call();
    assert.strictEqual(symbol, 'HMS');
  });



  it('creation: should succeed in creating over 2^256 - 1 (max) tokens', async () => {
    // 2^256 - 1
    const HMSEC2 = await HASHM.new('115792089237316195423570985008687907853269984665640564039457584007913129639935', 'HASH MARKET', 1, 'HMS', { from: accounts[0] });
    const totalSupply = await HMSEC2.totalSupply();
    const match = totalSupply.equals('1.15792089237316195423570985008687907853269984665640564039457584007913129639935e+77');
    assert(match, 'result is not correct');
  });



  //TRANSFER
  
  it('transfers: ether transfer should be reversed.', async () => {
    const balanceBefore = await HMSEC.balanceOf.call(accounts[0]);
    assert.strictEqual(balanceBefore.toNumber(), 10000);

    await assertRevert(new Promise((resolve, reject) => {
      web3.eth.sendTransaction({ from: accounts[0], to: HMSEC.address, value: web3.toWei('10', 'Ether') }, (err, res) => {
        if (err) { reject(err); }
        resolve(res);
      });
    }));

    const balanceAfter = await HMSEC.balanceOf.call(accounts[0]);
    assert.strictEqual(balanceAfter.toNumber(), 10000);
  });

  it('transfers: should transfer 10000 to accounts[1] with accounts[0] having 10000', async () => {
    await HMSEC.transfer(accounts[1], 10000, { from: accounts[0] });
    const balance = await HMSEC.balanceOf.call(accounts[1]);
    assert.strictEqual(balance.toNumber(), 10000);
  });

  it('transfers: should fail when trying to transfer 10001 to accounts[1] with accounts[0] having 10000', async () => {
    await assertRevert(HMSEC.transfer.call(accounts[1], 10001, { from: accounts[0] }));
  });

  it('transfers: should handle zero-transfers normally', async () => {
    assert(await HMSEC.transfer.call(accounts[1], 0, { from: accounts[0] }), 'zero-transfer has failed');
  });

  

  // APPROVALS
  it('approvals: msg.sender should approve 100 to accounts[1]', async () => {
    await HMSEC.approve(accounts[1], 100, { from: accounts[0] });
    const allowance = await HMSEC.allowance.call(accounts[0], accounts[1]);
    assert.strictEqual(allowance.toNumber(), 100);
  });

  // Bit overkill. But is for testing a bug
  it('approvals: msg.sender approves accounts[1] of 100 & withdraws 20 once.', async () => {
    const balance0 = await HMSEC.balanceOf.call(accounts[0]);
    assert.strictEqual(balance0.toNumber(), 10000);

    await HMSEC.approve(accounts[1], 100, { from: accounts[0] }); // 100
    const balance2 = await HMSEC.balanceOf.call(accounts[2]);
    assert.strictEqual(balance2.toNumber(), 0, 'balance2 not correct');

    await HMSEC.transferFrom.call(accounts[0], accounts[2], 20, { from: accounts[1] });
    await HMSEC.allowance.call(accounts[0], accounts[1]);
    await HMSEC.transferFrom(accounts[0], accounts[2], 20, { from: accounts[1] }); // -20
    const allowance01 = await HMSEC.allowance.call(accounts[0], accounts[1]);
    assert.strictEqual(allowance01.toNumber(), 80); // =80

    const balance22 = await HMSEC.balanceOf.call(accounts[2]);
    assert.strictEqual(balance22.toNumber(), 20);

    const balance02 = await HMSEC.balanceOf.call(accounts[0]);
    assert.strictEqual(balance02.toNumber(), 9980);
  });

  // Should approve 100 of msg.sender & withdraw 50, twice. (should succeed)
  it('approvals: msg.sender approves accounts[1] of 100 & withdraws 20 twice.', async () => {
    await HMSEC.approve(accounts[1], 100, { from: accounts[0] });
    const allowance01 = await HMSEC.allowance.call(accounts[0], accounts[1]);
    assert.strictEqual(allowance01.toNumber(), 100);

    await HMSEC.transferFrom(accounts[0], accounts[2], 20, { from: accounts[1] });
    const allowance012 = await HMSEC.allowance.call(accounts[0], accounts[1]);
    assert.strictEqual(allowance012.toNumber(), 80);

    const balance2 = await HMSEC.balanceOf.call(accounts[2]);
    assert.strictEqual(balance2.toNumber(), 20);

    const balance0 = await HMSEC.balanceOf.call(accounts[0]);
    assert.strictEqual(balance0.toNumber(), 9980);

    // FIRST tx done.
    // onto next.
    await HMSEC.transferFrom(accounts[0], accounts[2], 20, { from: accounts[1] });
    const allowance013 = await HMSEC.allowance.call(accounts[0], accounts[1]);
    assert.strictEqual(allowance013.toNumber(), 60);

    const balance22 = await HMSEC.balanceOf.call(accounts[2]);
    assert.strictEqual(balance22.toNumber(), 40);

    const balance02 = await HMSEC.balanceOf.call(accounts[0]);
    assert.strictEqual(balance02.toNumber(), 9960);
  });

  // should approve 100 of msg.sender & withdraw 50 & 60 (should fail).
  it('approvals: msg.sender approves accounts[1] of 100 & withdraws 50 & 60 (2nd tx should fail)', async () => {
    await HMSEC.approve(accounts[1], 100, { from: accounts[0] });
    const allowance01 = await HMSEC.allowance.call(accounts[0], accounts[1]);
    assert.strictEqual(allowance01.toNumber(), 100);

    await HMSEC.transferFrom(accounts[0], accounts[2], 50, { from: accounts[1] });
    const allowance012 = await HMSEC.allowance.call(accounts[0], accounts[1]);
    assert.strictEqual(allowance012.toNumber(), 50);

    const balance2 = await HMSEC.balanceOf.call(accounts[2]);
    assert.strictEqual(balance2.toNumber(), 50);

    const balance0 = await HMSEC.balanceOf.call(accounts[0]);
    assert.strictEqual(balance0.toNumber(), 9950);

    // FIRST tx done.
    // onto next.
    await assertRevert(HMSEC.transferFrom.call(accounts[0], accounts[2], 60, { from: accounts[1] }));
  });

  it('approvals: attempt withdrawal from account with no allowance (should fail)', async () => {
    await assertRevert(HMSEC.transferFrom.call(accounts[0], accounts[2], 60, { from: accounts[1] }));
  });

  it('approvals: allow accounts[1] 100 to withdraw from accounts[0]. Withdraw 60 and then approve 0 & attempt transfer.', async () => {
    await HMSEC.approve(accounts[1], 100, { from: accounts[0] });
    await HMSEC.transferFrom(accounts[0], accounts[2], 60, { from: accounts[1] });
    await HMSEC.approve(accounts[1], 0, { from: accounts[0] });
    await assertRevert(HMSEC.transferFrom.call(accounts[0], accounts[2], 10, { from: accounts[1] }));
  });

  it('approvals: approve max (2^256 - 1)', async () => {
    await HMSEC.approve(accounts[1], '115792089237316195423570985008687907853269984665640564039457584007913129639935', { from: accounts[0] });
    const allowance = await HMSEC.allowance(accounts[0], accounts[1]);
    assert(allowance.equals('1.15792089237316195423570985008687907853269984665640564039457584007913129639935e+77'));
  });

  // should approve max of msg.sender & withdraw 20 without changing allowance (should succeed).
  it('approvals: msg.sender approves accounts[1] of max (2^256 - 1) & withdraws 20', async () => {
    const balance0 = await HMSEC.balanceOf.call(accounts[0]);
    assert.strictEqual(balance0.toNumber(), 10000);

    const max = '1.15792089237316195423570985008687907853269984665640564039457584007913129639935e+77';
    await HMSEC.approve(accounts[1], max, { from: accounts[0] });
    const balance2 = await HMSEC.balanceOf.call(accounts[2]);
    assert.strictEqual(balance2.toNumber(), 0, 'balance2 not correct');

    await HMSEC.transferFrom(accounts[0], accounts[2], 20, { from: accounts[1] });
    const allowance01 = await HMSEC.allowance.call(accounts[0], accounts[1]);
    assert(allowance01.equals(max));

    const balance22 = await HMSEC.balanceOf.call(accounts[2]);
    assert.strictEqual(balance22.toNumber(), 20);

    const balance02 = await HMSEC.balanceOf.call(accounts[0]);
    assert.strictEqual(balance02.toNumber(), 9980);
  });


  it('increaseApproval: increase token for approve accounts[1] from accounts[0] ', async () => {
    await HMSEC.approve(accounts[1], 100, { from: accounts[0] });
    await HMSEC.increaseApproval(accounts[1], 50, { from: accounts[0] });
    const allowance = await HMSEC.allowance(accounts[0], accounts[1]);
    assert.strictEqual(allowance.toNumber(), 150);
  });


  it('decreaseApproval: decrease appoval token for approve accounts[1] from accounts[0] ', async () => {
    await HMSEC.approve(accounts[1], 100, { from: accounts[0] });
    await HMSEC.decreaseApproval(accounts[1], 50, { from: accounts[0] });
    const allowance = await HMSEC.allowance(accounts[0], accounts[1]);
    assert.strictEqual(allowance.toNumber(), 50);
  });


  it('burn: destroy tokens from  account[0] that it is the smart contract owner', async () => {
    await HMSEC.burn(5000, { from: accounts[0] });
    const balance0 = await HMSEC.balanceOf.call(accounts[0]);
    const totalSupply = await HMSEC2.totalSupply();
    assert.strictEqual(balance0.toNumber(), 5000);
    assert.strictEqual(totalSupply.toNumber(), 5000);
    
  });


  it('mintToken: create token in account[1] from owner account [1] ', async () => {
    await HMSEC.mintToken(accounts[1], 10000, { from: accounts[0] });
    const balance1 = await HMSEC.balanceOf.call(accounts[1]);
    const totalSupply = await HMSEC2.totalSupply();
    assert.strictEqual(balance1.toNumber(), 10000);
    assert.strictEqual(totalSupply.toNumber(), 20000);
  });




  /* eslint-disable no-underscore-dangle */
  it('events: should fire Transfer event properly', async () => {
    const res = await HMSEC.transfer(accounts[1], '2666', { from: accounts[0] });
    const transferLog = res.logs.find(element => element.event.match('Transfer'));
    assert.strictEqual(transferLog.args._from, accounts[0]);
    assert.strictEqual(transferLog.args._to, accounts[1]);
    assert.strictEqual(transferLog.args._value.toString(), '2666');
  });

  it('events: should fire Transfer event normally on a zero transfer', async () => {
    const res = await HMSEC.transfer(accounts[1], '0', { from: accounts[0] });
    const transferLog = res.logs.find(element => element.event.match('Transfer'));
    assert.strictEqual(transferLog.args._from, accounts[0]);
    assert.strictEqual(transferLog.args._to, accounts[1]);
    assert.strictEqual(transferLog.args._value.toString(), '0');
  });

  it('events: should fire Approval event properly', async () => {
    const res = await HMSEC.approve(accounts[1], '2666', { from: accounts[0] });
    const approvalLog = res.logs.find(element => element.event.match('Approval'));
    assert.strictEqual(approvalLog.args._owner, accounts[0]);
    assert.strictEqual(approvalLog.args._spender, accounts[1]);
    assert.strictEqual(approvalLog.args._value.toString(), '2666');
  });
});