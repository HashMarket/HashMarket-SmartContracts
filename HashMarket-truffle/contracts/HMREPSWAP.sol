pragma solidity >=0.4.22 <0.6.0;



library SafeMath {
 function mul(uint256 a, uint256 b) internal pure returns (uint256) {
    if (a == 0) {
      return 0;
    }
    uint256 c = a * b;
    assert(c / a == b);
    return c;
  }

  function div(uint256 a, uint256 b) internal pure returns (uint256) {
    // assert(b > 0); // Solidity automatically throws when dividing by 0
    uint256 c = a / b;
    // assert(a == b * c + a % b); // There is no case in which this doesn't hold
    return c;
  }

  function sub(uint256 a, uint256 b) internal pure returns (uint256) {
    assert(b <= a);
    return a - b;
  }

  function add(uint256 a, uint256 b) internal pure returns (uint256) {
    uint256 c = a + b;
    assert(c >= a);
    return c;
  }
}


contract owned {

    mapping(address => bool) public ownerslist;

    constructor() public {
        ownerslist[msg.sender] = true;
    }

    event OwnerslistAddressAdded(address addr);
    event OwnerslistAddressRemoved(address addr);


    modifier onlyOwner() {
        require(ownerslist[msg.sender]);
        _;
    }


    
     ///@dev add an address to the ownerslist
     ///@param addr address
     ///@return true if the address was added to the ownerslist, false if the address was already in the ownerslist 
    
    function addOwner(address addr) onlyOwner public returns(bool success) {
        if (!ownerslist[addr]) {
            ownerslist[addr] = true;
            emit OwnerslistAddressAdded(addr);
            success = true; 
        }
    }



    
     ///@dev remove an address from the ownerslist
     ///@param addr address
     ///@return true if the address was removed from the ownerslist, false if the address wasn't in the ownerslist in the first place 
    
    function removeOwner(address addr) onlyOwner public returns(bool success) {
        if (ownerslist[addr]) {
            ownerslist[addr] = false;
            emit OwnerslistAddressRemoved(addr);
            success = true;
        }
    }
  
  
}
  


contract HASHMinterface { 
    
function transfer(address _to, uint256 _value) public returns (bool success); 
function balanceAddress(address _owner) public view returns (uint256 balance);

}

contract HMREPERC20 is owned {
    
    using SafeMath for uint256;
    
    // Public variables of the token
    string public name;
    string public symbol;
    uint8 public decimals = 18; // 18 decimals is the strongly suggested default, avoid changing it
    uint256 public totalSupply;

    // This creates an array with all balances
    mapping (address => uint256) public balanceOf;
    mapping (address => bool) public frozenAccount;

    // This generates a public event on the blockchain that will notify clients
    event Transfer(address indexed from, address indexed to, uint256 value);
    // This notifies clients about the amount burnt
    event Burn(address indexed from, uint256 value);
    //This generates a public event on the blockchain that will notify clients 
    event FrozenFunds(address target, bool frozen);
    // This generates a public event on the blockchain that will notify clients
    event ReputationUserRate(address target, uint256 rate);



     /// @notice Constrctor function: Initializes contract with initial supply tokens to the creator of the contract
    constructor(uint256 initialSupply, string memory tokenName, string memory tokenSymbol) public {
        totalSupply = initialSupply * 10 ** uint256(decimals);  // Update total supply with the decimal amount
        balanceOf[msg.sender] = totalSupply;                    // Give the creator all initial tokens
        name = tokenName;                                       // Set the name for display purposes
        symbol = tokenSymbol;                                   // Set the symbol for display purposes
    }
    
    
     /// @notice Gets the balance of the specified address.
     /// @param _owner The address to query the the balance of.
     /// @return An uint256 representing the amount owned by the passed address.
    function balanceAddress(address _owner) public view returns (uint256 balance) {
    return balanceOf[_owner];
    
    }


    /* Internal transfer, only can be called by this contract */
    function _transfer(address _from, address _to, uint _value) internal {
        require (_to != address(0x0));                          // Prevent transfer to 0x0 address. Use burn() instead
        require (balanceOf[_from] >= _value);                   // Check if the sender has enough
        require (balanceOf[_to] + _value >= balanceOf[_to]);    // Check for overflows
        require(!frozenAccount[_from]);                         // Check if sender is frozen
        require(!frozenAccount[_to]);                           // Check if recipient is frozen
        balanceOf[_from] -= _value;                             // Subtract from the sender
        balanceOf[_to] += _value;                               // Add the same to the recipient
        emit Transfer(_from, _to, _value);
    }


   
     /// @notice Transfer tokens: Send `_value` tokens to `_to` from your account
     /// @param _to The address of the recipient
     /// @param _value the amount to send
    function transfer(address _to, uint256 _value) onlyOwner public returns (bool success) {
        _transfer(msg.sender, _to, _value);
        return true;
    }
    


     /// @notice Destroy tokens: Remove `_value` tokens from the system irreversibly
     /// @param _value uint256 the amount of money to burn
    function burn(uint256 _value) onlyOwner public returns (bool success) {
        require(balanceOf[msg.sender] >= _value);   // Check if the sender has enough
        balanceOf[msg.sender] -= _value;            // Subtract from the sender
        totalSupply -= _value;                      // Updates totalSupply
        emit Burn(msg.sender, _value);
        return true;
    }
    
    
      /// @notice Destroy tokens: Remove `_value` tokens from the system irreversibly
     /// @param _value uint256 the amount of money to burn
    function burnSC(uint256 _value) onlyOwner public returns (bool success) {
        require(balanceOf[address(this)] >= _value);   // Check if the sender has enough
        balanceOf[address(this)] -= _value;            // Subtract from the sender
        totalSupply -= _value;                        // Updates totalSupply
        emit Burn(address(this), _value);
        return true;
    }


    
     /// @notice `freeze? Prevent | Allow` `target` from sending & receiving tokens
     /// @param target Address to be frozen
     /// @param freeze either to freeze it or not
    function freezeAccount(address target, bool freeze) onlyOwner public {
        frozenAccount[target] = freeze;
        emit FrozenFunds(target, freeze);
    }
    
    
    
     /// @notice Create `mintedAmount` tokens and send it to `target`
     /// @param target Address to receive the tokens
     /// @param mintedAmount the amount of tokens it will receive
    function mintToken(address target, uint256 mintedAmount) onlyOwner public {
        require(!frozenAccount[target]);
        balanceOf[target] += mintedAmount;
        totalSupply += mintedAmount;
        emit Transfer(address(0), address(this), mintedAmount);
        emit Transfer(address(this), target, mintedAmount);
    }
    
    
      /// @notice Calculate the rate of the reputation that a address has
      /// @param target Address of the user
      //uint256 userRate = div(mul(userBalance, 100), totalSupply);
    function addressRate(address target) public view returns (uint256) {
        uint256 userBalance = balanceOf[target];
        uint256 userRate = (userBalance*100)/totalSupply;
        //emit ReputationUserRate(target, userRate); Si es view no puede llevar eventos.Si no sera payable. 
        return userRate;

    }
    
    
    
    
    //SWAP REPUTATION TO SECURITY
    
    address public HASHMaddress; 
    uint256 public HASHMratemult;
    uint256 public HASHMratediv;
    
     //This generates a public event on the blockchain that will notify clients 
    event SwapToken(uint256 _reputationToken, uint256 _securityToken);
    
     ///@dev Set de HASHM Security Token address
     ///@param newAddress address
     ///@return true if the address has been set correctly
    
    function setHASHMaddress(address newAddress) onlyOwner public returns (bool) {
        HASHMaddress = newAddress;
        return true;
    }
    
    
    
    
     ///@dev Set de HASHM rate in order to modify the HASHM security token that has been received.
     ///@param _valuemult uint256
     ///@param _valuediv uint256
     ///@return true if the value has been set correctly
    
    function setHASHMrate(uint256 _valuemult, uint256 _valuediv) onlyOwner public returns (bool) {
        HASHMratemult = _valuemult;
        HASHMratediv = _valuediv;
        return true;
    }
    

    
     
     ///@dev Swap function in order to send reputation to the ERC20 reputation contract and receive Security token inside this contract. 
     ///@param _value uint256
     ///@return true if the swap has been done correctly
     //uint256 HASHM = div(mult(_value, HASHMratemult), HASHMratediv);
    
    function swapToken(uint256 _value) public returns (bool success) {
        require(balanceOf[msg.sender] >= _value);
        require(!frozenAccount[msg.sender]);
        _transfer(msg.sender, address(this), _value);
        uint256 HASHM = (_value*HASHMratemult)/HASHMratediv;
        receiveSecurity(msg.sender, HASHM);
        emit SwapToken(_value, HASHM);
        return true;
    }
        
    
    
    
    
     ///@dev Internal function to sent security token in the escrow of the reputation erc20 contract 
     ///@param _to address, _value uint256
     ///@return true if the swap has been done correctly
    
    function receiveSecurity(address _to, uint256 _value) internal {
        HASHMinterface(HASHMaddress).transfer(_to, _value);
       
    }
      
      
      
     
     ///@dev Function to check de security token balance in the smart contratct 
     ///@return true if has been done correctly REVISAR RETURN
    
    function HASHMBalance() onlyOwner public view returns (bool success) {
         HASHMinterface(HASHMaddress).balanceAddress(address(this));
         return true;
    }  
     
     
     
     
      
     ///@dev Function to send token security in the smart contract to a msg.sender. 
     ///@param _value uint256
     ///@return true if it has been done correctly
         
    function HASHMtransfer(uint256 _value) onlyOwner public returns (bool success) {
          require(HASHMinterface(HASHMaddress).balanceAddress(address(this)) > _value);
          receiveSecurity(msg.sender, _value);
          return true;
    
    }
    
    
  
    
     
}
