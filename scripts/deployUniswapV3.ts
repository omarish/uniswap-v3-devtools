import { ethers } from 'hardhat'
import { Signer, Wallet } from 'ethers'
import { INonfungiblePositionManager, IUniswapV3Factory } from '../typechain'
import { linkLibraries } from '../src/util/linkLibraries'

const artifacts = {
  UniswapV3Factory: require('@uniswap/v3-core/artifacts/contracts/UniswapV3Factory.sol/UniswapV3Factory.json'),
  SwapRouter: require('@uniswap/v3-periphery/artifacts/contracts/SwapRouter.sol/SwapRouter.json'),
  WETH9: require('../external/WETH9.json'),
  NFTDescriptor: require('@uniswap/v3-periphery/artifacts/contracts/libraries/NFTDescriptor.sol/NFTDescriptor.json'),
  NonfungibleTokenPositionDescriptor: require('@uniswap/v3-periphery/artifacts/contracts/NonfungibleTokenPositionDescriptor.sol/NonfungibleTokenPositionDescriptor.json'),
  NonfungiblePositionManager: require('@uniswap/v3-periphery/artifacts/contracts/NonfungiblePositionManager.sol/NonfungiblePositionManager.json'),
}

import { ISwapRouter } from '../types/ISwapRouter'
import { IWETH9 } from '../types/IWETH9'
import { NFTDescriptor } from '../types/NFTDescriptor'

// import UniswapV3Pool from '@uniswap/v3-core/artifacts/contracts/UniswapV3Pool.sol/UniswapV3Pool.json'
// import WETH9 from './external/WETH9.json'
// import { linkLibraries } from './linkLibraries'
// import { IWETH9 } from '../../types/IWETH9'

export class UniswapV3Deployer {
  static async deploy(actor: Wallet) {
    const deployer = new UniswapV3Deployer(actor)

    const weth9 = await deployer.deployWETH9()
    const factory = await deployer.deployFactory()
    const router = await deployer.deployRouter(factory.address, weth9.address)

    const nftDescriptorLibrary = await deployer.deployNFTDescriptorLibrary()
    const positionDescriptor = await deployer.deployPositionDescriptor(
      nftDescriptorLibrary.address,
      weth9.address
    )
    const positionManager = await deployer.deployNonfungiblePositionManager(
      factory.address,
      weth9.address,
      positionDescriptor.address
    )
  }

  deployer: Wallet

  constructor(deployer: Wallet) {
    this.deployer = deployer
  }

  async deployFactory() {
    return await this.deployContract<IUniswapV3Factory>(
      artifacts.UniswapV3Factory.abi,
      artifacts.UniswapV3Factory.bytecode,
      [],
      this.deployer
    )
  }

  async deployWETH9() {
    return await this.deployContract<IWETH9>(
      artifacts.WETH9.abi,
      artifacts.WETH9.bytecode,
      [],
      this.deployer
    )
  }

  async deployRouter(factoryAddress: string, weth9Address: string) {
    return await this.deployContract<ISwapRouter>(
      artifacts.SwapRouter.abi,
      artifacts.SwapRouter.bytecode,
      [factoryAddress, weth9Address],
      this.deployer
    )
  }

  async deployNFTDescriptorLibrary() {
    return await this.deployContract<NFTDescriptor>(
      artifacts.NFTDescriptor.abi,
      artifacts.NFTDescriptor.bytecode,
      [],
      this.deployer
    )
  }

  async deployPositionDescriptor(
    nftDescriptorLibraryAddress: string,
    weth9Address: string
  ) {
    const linkedBytecode = linkLibraries(
      {
        bytecode: artifacts.NonfungibleTokenPositionDescriptor.bytecode,
        linkReferences: {
          'NFTDescriptor.sol': {
            NFTDescriptor: [
              {
                length: 20,
                start: 1261,
              },
            ],
          },
        },
      },
      {
        NFTDescriptor: nftDescriptorLibraryAddress,
      }
    )

    return (await this.deployContract(
      artifacts.NonfungibleTokenPositionDescriptor.abi,
      linkedBytecode,
      [weth9Address],
      this.deployer
    )) as ethers.Contract
  }

  async deployNonfungiblePositionManager(
    factoryAddress: string,
    weth9Address: string,
    positionDescriptorAddress: string
  ) {
    return await this.deployContract<INonfungiblePositionManager>(
      artifacts.NonfungiblePositionManager.abi,
      artifacts.NonfungiblePositionManager.bytecode,
      [factoryAddress, weth9Address, positionDescriptorAddress],
      this.deployer
    )
  }

  private async deployContract<T>(
    abi,
    bytecode,
    deployParams: Array<any>,
    actor: Signer
  ) {
    const factory = new ethers.ContractFactory(abi, bytecode, actor)
    return (await factory.deploy(...deployParams)) as Promise<T>
  }
}
