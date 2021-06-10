export class ERC20Helper {
  ensureBalancesAndApprovals = async (
    actor: Wallet,
    tokens: TestERC20 | Array<TestERC20>,
    balance: BigNumber,
    spender?: string
  ) => {
    for (let token of arrayWrap(tokens)) {
      await this.ensureBalance(actor, token, balance)
      if (spender) {
        await this.ensureApproval(actor, token, balance, spender)
      }
    }
  }

  ensureBalance = async (
    actor: Wallet,
    token: TestERC20,
    balance: BigNumber
  ) => {
    const currentBalance = await token.balanceOf(actor.address)
    if (currentBalance.lt(balance)) {
      await token
        // .connect(this.actors.tokensOwner())
        .transfer(actor.address, balance.sub(currentBalance))
    }

    // if (spender) {
    //   await this.ensureApproval(actor, token, balance, spender)
    // }

    return await token.balanceOf(actor.address)
  }

  ensureApproval = async (
    actor: Wallet,
    token: TestERC20,
    balance: BigNumber,
    spender: string
  ) => {
    const currentAllowance = await token.allowance(actor.address, actor.address)
    if (currentAllowance.lt(balance)) {
      await token.connect(actor).approve(spender, balance)
    }
  }
}
