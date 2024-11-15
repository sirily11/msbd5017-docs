import { Checker } from '@/lib/interfaces'

export const source = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IFGT is IERC20 {
    function mint(address _to, uint256 _amount) external returns (bool);
}

contract FGT is ERC20, Ownable {
    address public lockContract;
    uint256 public constant REDEMPTION_DATE = 2082844800; // Unix timestamp for Jan 1, 2036

    constructor() ERC20("FGT Token", "FGT") {
        lockContract = msg.sender; // Initially set to the deployer, should be updated to Lock contract
    }
    
    function setLockContract(address _lockContract) external onlyOwner {
        lockContract = _lockContract;
    }
    

    /**
     * @dev Mint new FGT tokens
     * @param _to The address to mint tokens to
     * @param _amount The amount of tokens to mint
     * @return A boolean value indicating whether the operation succeeded
     * Requirements:
     * - Only the Lock contract can mint new tokens
     */
    function mint(address _to, uint256 _amount) external returns (bool) {
        return false;  
    }
    
    /**
     * @dev Redeem FGT tokens
     * @param _amount The amount of tokens to redeem
     * Requirements:
     * - Only the owner can redeem tokens
     * - Redemption is only allowed after Jan 1, 2036
     * - The total supply must be reduced by the redeemed amount
     */
    function redeem(uint256 _amount) external onlyOwner {

    }
    
    /**
     * @dev Transfer tokens
     * @param _recipient The address to transfer tokens to
     * @param _amount The amount of tokens to transfer
     * @return A boolean value indicating whether the operation succeeded
     * Requirements:
     * - Transfers are only allowed after Jan 1, 2036
     */
    function transfer(address _recipient, uint256 _amount) public virtual override returns (bool) {
        return false;
    }
    
    /**
     * @dev Transfer tokens on behalf of another address
     * @param _sender The address to transfer tokens from
     * @param _recipient The address to transfer tokens to
     * @param _amount The amount of tokens to transfer
     * @return A boolean value indicating whether the operation succeeded
     * Requirements:
     * - Transfers are only allowed after Jan 1, 2036
     * - You can use super.transferFrom to delegate the transfer
     */
    function transferFrom(address _sender, address _recipient, uint256 _amount) public virtual override returns (bool) {
        return false;
    }
}

contract Lock is Ownable {
    uint256 public constant DEPOSIT_COST = 10 ether; // 10 AXC
    uint256 public constant DEPOSIT_LIMIT = 100 ether; // 100 AXC
    
    uint256 public totalDeposits;
    IFGT public fgtToken; // Use the new interface
    
    event Deposited(address indexed user, uint256 amount);
    
    constructor(address _fgtTokenAddress) {
        fgtToken = IFGT(_fgtTokenAddress);
    }
    
    /**
     * @dev Deposit AXC tokens to lock
     * Requirements:
     * - Must deposit exactly 10 AXC
     * - Deposit limit must not be exceeded
     * - Mint 1 FGT token for each AXC deposited
     * - Emit a Deposited event
     * - Update the total deposits
     * - You can use msg.sender to get the address of the caller
     * - You can use msg.value to get the amount of Ether sent
     */
    function lockAXC() external payable {
       
    }

    
    /**
     * @dev Withdraw AXC tokens
     * @param _amount The amount of tokens to withdraw
     * Requirements:
     * - Only the owner can withdraw tokens
     * - The contract must have sufficient balance
     * - Transfer the specified amount of Ether to the owner
     * - You can use payable(owner()).transfer(_amount) to transfer Ether
     * - You can use address(this).balance to get the contract balance
     */
    function withdrawAXC(uint256 _amount) external onlyOwner {
        require(_amount <= address(this).balance, "Insufficient balance");
        payable(owner()).transfer(_amount);
    }
}
`

export const solution = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IFGT is IERC20 {
    function mint(address _to, uint256 _amount) external returns (bool);
}

contract FGT is ERC20, Ownable {
    address public lockContract;
    uint256 public constant REDEMPTION_DATE = 2082844800; // Unix timestamp for Jan 1, 2036

    constructor() ERC20("FGT Token", "FGT") {
        lockContract = msg.sender; // Initially set to the deployer, should be updated to Lock contract
    }
    
    function setLockContract(address _lockContract) external onlyOwner {
        lockContract = _lockContract;
    }
    
    function mint(address _to, uint256 _amount) external returns (bool) {
        require(msg.sender == lockContract, "Only Lock contract can mint");
        _mint(_to, _amount);
        return true;
    }
    
    function redeem(uint256 _amount) external onlyOwner {
        require(block.timestamp >= REDEMPTION_DATE, "Redemption not allowed before 2036");
        _burn(msg.sender, _amount);
        // Implement redemption logic here (e.g., transfer AXC from Lock contract)
    }
    
    function transfer(address _recipient, uint256 _amount) public virtual override returns (bool) {
        require(block.timestamp >= REDEMPTION_DATE, "Transfers not allowed before 2036");
        return super.transfer(_recipient, _amount);
    }
    
    function transferFrom(address _sender, address _recipient, uint256 _amount) public virtual override returns (bool) {
        require(block.timestamp >= REDEMPTION_DATE, "Transfers not allowed before 2036");
        return super.transferFrom(_sender, _recipient, _amount);
    }
}

contract Lock is Ownable {
    uint256 public constant DEPOSIT_COST = 10 ether; // 10 AXC
    uint256 public constant DEPOSIT_LIMIT = 100 ether; // 100 AXC
    
    uint256 public totalDeposits;
    IFGT public fgtToken; // Use the new interface
    
    event Deposited(address indexed user, uint256 amount);
    
    constructor(address _fgtTokenAddress) {
        fgtToken = IFGT(_fgtTokenAddress);
    }
    
    function lockAXC() external payable {
        require(msg.value == DEPOSIT_COST, "Must deposit exactly 10 AXC");
        require(totalDeposits + msg.value <= DEPOSIT_LIMIT, "Deposit limit reached");
        
        totalDeposits += msg.value;
        
        // Mint 1 FGT token for each AXC deposited
        require(fgtToken.mint(msg.sender, msg.value), "Failed to mint FGT tokens");
        
        emit Deposited(msg.sender, msg.value);
    }
    
    function withdrawAXC(uint256 _amount) external onlyOwner {
        require(_amount <= address(this).balance, "Insufficient balance");
        payable(owner()).transfer(_amount);
    }
}
`

export const checker: Checker = async (output) => {
  // Check if both contracts exist
  if (output.contracts['contract.sol']['FGT'] === undefined) {
    return [true, 'FGT contract does not exist']
  }
  if (output.contracts['contract.sol']['Lock'] === undefined) {
    return [true, 'Lock contract does not exist']
  }

  const fgtAbi = output.contracts['contract.sol']['FGT'].abi
  const lockAbi = output.contracts['contract.sol']['Lock'].abi

  // Check FGT contract
  const fgtChecks = [
    checkFunction(fgtAbi, 'setLockContract', ['address'], 'nonpayable'),
    checkFunction(fgtAbi, 'mint', ['address', 'uint256'], 'nonpayable', [
      'bool',
    ]),
    checkFunction(fgtAbi, 'redeem', ['uint256'], 'nonpayable'),
    checkFunction(fgtAbi, 'transfer', ['address', 'uint256'], 'nonpayable', [
      'bool',
    ]),
    checkFunction(
      fgtAbi,
      'transferFrom',
      ['address', 'address', 'uint256'],
      'nonpayable',
      ['bool'],
    ),
    checkVariable(fgtAbi, 'lockContract', 'address'),
    checkVariable(fgtAbi, 'REDEMPTION_DATE', 'uint256'),
  ]

  for (const check of fgtChecks) {
    if (check[0]) return check
  }

  // Check Lock contract
  const lockChecks = [
    checkFunction(lockAbi, 'lockAXC', [], 'payable'),
    checkFunction(lockAbi, 'withdrawAXC', ['uint256'], 'nonpayable'),
    checkVariable(lockAbi, 'DEPOSIT_COST', 'uint256'),
    checkVariable(lockAbi, 'DEPOSIT_LIMIT', 'uint256'),
    checkVariable(lockAbi, 'totalDeposits', 'uint256'),
    checkVariable(lockAbi, 'fgtToken', 'address'),
  ]

  for (const check of lockChecks) {
    if (check[0]) return check
  }

  // If all checks pass
  return [false, '']
}

function checkFunction(
  abi: any[],
  name: string,
  inputs: string[],
  stateMutability: string,
  outputs: string[] = [],
): [boolean, string] {
  const func = abi.find(
    (item) => item.type === 'function' && item.name === name,
  )
  if (!func) {
    return [true, `Function ${name} not found`]
  }
  if (
    func.inputs.length !== inputs.length ||
    !func.inputs.every(
      (input: any, index: number) => input.type === inputs[index],
    )
  ) {
    return [true, `Function ${name} has incorrect inputs`]
  }
  if (func.stateMutability !== stateMutability) {
    return [true, `Function ${name} has incorrect state mutability`]
  }
  if (
    outputs.length > 0 &&
    (func.outputs.length !== outputs.length ||
      !func.outputs.every(
        (output: any, index: number) => output.type === outputs[index],
      ))
  ) {
    return [true, `Function ${name} has incorrect outputs`]
  }
  return [false, '']
}

function checkVariable(
  abi: any[],
  name: string,
  type: string,
): [boolean, string] {
  const variable = abi.find(
    (item) =>
      item.type === 'function' &&
      item.name === name &&
      item.stateMutability === 'view',
  )
  if (!variable) {
    return [true, `Public variable ${name} not found`]
  }
  if (variable.outputs.length !== 1 || variable.outputs[0].type !== type) {
    return [true, `Public variable ${name} has incorrect type`]
  }
  return [false, '']
}
