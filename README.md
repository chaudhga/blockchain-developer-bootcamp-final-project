![the-early-bird-worm](https://user-images.githubusercontent.com/3909523/149627743-7b996565-99b1-4275-aa27-9318aad17112.jpg)

# Early Bird Gets The WORMies!

### DAPP to drive early bird promotions during various campaigns events/exhibitions/concerts etc. and airdrop WORMies tokens for first N number of registered participants
## Project Description: 
The Early Birds dapp allows campaign organizers (Hosts for Events, Exhibitions, Concerts, Promotional sales activities etc.) to issue ERC20 WRM (called WORMies) on the first come first serve basis. 
- Participants can register only once if event capacity has not reached.
- Contract Owners (Event Sponsors/Platform providers) can then airdrop the WRM tokens to the participants once campaign registration has been closed.
- These WRM tokens can be then then used by participants to avail special services and discounts during the event. 
### User Interaction Flow: 

1. Campaign Host initiates a transaction with the specified requirements of the campaign: Event Titile, Event Capacity (Number of early bird offer addresses for distribute the tokens) 
2. Contract then generates the unique campaign code for the campaign based on (title, capacity, host, current time) and provides it to the host for promotional purposes.
3. Participants use the campaign code to register for the event and are accepted or rejected based on the current status of the campaign.
4. Host can close the campaign irrespective of whether the total capacity has been reached (e.g. on campaign deadline)
5. Host contacts the platform provider/contract owner to issue the airdrop.
6. Each participant is airdropped predefined number of WRM tokens by contract owner (or campaign host in Demo mode)
---
  ## Public Address for Certification NFT:
```
gauravc.eth
```
```
0x136e8dd3a06b322380DFece9a518c17da1F92523
```

--- 
### Prerequisites: 

* Truffle v5.4.28 (core: 5.4.28)
* Solidity - 0.8.9 (solc-js)
* Node v14.18.0
* Web3.js v1.5.3
* yarn v1.22.15

---
### Directory Structure:

* `src/contracts` folder : The deployed contracts ABI files
* `client` folder : Frontend JS/HTML/CSS source code 
* `contracts` folder : Solidity smart contracts source code
* `migrations` folder : Deployment scripts for Truffle
* `test` folder : Smart contracts truffle test source code
* `.sample.env` file : Sample HDWallet mnemonic and infura project id variables
* `package.json` file : Nodejs dependencies and scripts file
* `truffle-config` file : Used by Truffle for deployment and testing
---
### Local Deployment Flow: 

* Run ```npm install``` to download and install project dependencies.
* ```Ganache GUI``` should be running first before deploying OR 
*  for using ```Ganache CLI``` change the port value in ```truffle-config.js``` under networks -> develop -> port: to ```8545```
* ```truffle compile```
* ```truffle migrate --reset --network development``` | Development network will accept any network id. (Note the ```Wormies``` contract address to import WRM tokens in Metamask.)
* Run ```npm install --save-dev chai``` to install chai for running tests.
* Run ```truffle test``` to run smart contracts tests.
---
### Mainnet and Testnet Deployment Flow: 

* ```.sample.env``` file should first be populated with the mnemonic of the wallet in which the contract will be deployed from, and the infura project id and renamed to ```.env```
* Install dotenv using command ```npm i dotenv``` this will automcatically load variables from ```.env``` file to ```process.env``` object and be read in scripts
* In ```truffle-config.js``` file, un-comment the network in which you'll be deploying to, in our case the network is `ropsten`, and fill the needed details like the ***provider*** and ***infura*** network link
* ```truffle migrate --reset --network ropsten``` to deploy to ropsten. (Note the ```Wormies``` contract address.)
* Add the ```Wormies``` contract address in Metamask under ```import tokens``` to view the WRM token status
* Also, when deploying to another network other than `ropsten`, update `package.json` script `"truffle-prod"` and change the network name to your network.


### Deployed Contract Addresses (ropsten):
Network: ropsten (Wormies - ERC20)
```
0x9b456B99f0f2b9a16A33d4db4E44E2d67b2bfBD9
```
Network Ropsten (EarlyBirds):
```
0x72a5F5693fEE7246E48ecA24E4d148c96543aC41
```
### Screencast Demo: 

* <span style="color:red"> **Screencast YouTube Link ==>** https://youtu.be/nxDKx6IDiAo </span>


---
#### Vercel DApp Demo Link:
https://early-birds.vercel.app/ 


---
### Future enhancements to be done:
1. Ability to host multiple events simultaneously and functionality for hosts to operate airdrops automatically through smart contract. 
2. Contract optimizations
3. Complete whole UI/UX flow. Integration into mobile app with QR code integration.
4. Ability to view statistics by hosts and see how successful their campaigns have been.
5. Ability to Airdrop NFTs as event passes/souveniers.
