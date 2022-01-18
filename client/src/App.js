import React, { Component } from "react";
import EarlyBirdsContract from "./contracts/EarlyBirds.json";
import getWeb3 from "./getWeb3";

import "./App.css";


class App extends Component {
  state = { storageValue: 0, web3: null, accounts: null, contract: null };

  componentDidMount = async () => {
    try {
      // Get network provider and web3 instance.
      const web3 = await getWeb3();

      // Use web3 to get the user's accounts.
      const accounts = await web3.eth.getAccounts();

      // Get the contract instance.
      const networkId = await web3.eth.net.getId();
      const deployedNetwork = EarlyBirdsContract.networks[networkId];
      const instance = new web3.eth.Contract(
        EarlyBirdsContract.abi,
        deployedNetwork && deployedNetwork.address,
      );

      // Set web3, accounts, and contract to the state, and then proceed with an
      // example of interacting with the contract's methods.
      this.setState({ code:0, registered:"", airdrop:"", closed:"", web3, accounts, contract: instance });//, this.runExample);
    } catch (error) {
      // Catch any errors for any of the above operations.
      alert(
        `Failed to load web3. Make sure Web3 provider like metamask is configured and retry!`,
      );
      console.error(error);
    }
  };


  runCreate = async () => {
    const { accounts, contract } = this.state;
    const title = document.getElementById("title").value;
    const cap = document.getElementById("capacity").value;

    // Stores a given value, 5 by default.
    await contract.methods.addCampaign(title, cap).send({ from: accounts[0]});
    // Get the value from the contract to prove it worked.
    const response = await contract.methods.getLastCampaignDetails().call();

    // Update state with the result.
    this.setState({ code: response[1]});
  };

  runClose = async () => {
    const { accounts, contract } = this.state;

    // Stores a given value, 5 by default.
    await contract.methods.closeLatestCampaign().send({ from: accounts[0]});
    // Get the value from the contract to prove it worked.
    const response = await contract.methods.getLastCampaignDetails().call();

    // Update state with the result.
    this.setState({ closed: response[2]});
  };

  runRegister = async () => {
    const campaignCode = document.getElementById("Code").value;
    console.log(campaignCode);

    // TODO: Display results

    const successMsg =  "SUCCESS! We are catching some fresh wormies for you!";
    // Update state with the result.
    this.setState({ registered: successMsg});
  };

  runAirdrop = async () => {
    const { accounts, contract } = this.state;

    // Stores a given value, 5 by default.
    await contract.methods.airdropLatestCampaign().send({ from: accounts[0]});
    const airdropSuccessMsg = "SUCCESS! Happy birdies are singing your praises";

    // Update state with the result.
    this.setState({ airdrop: airdropSuccessMsg});
  };
  
  render() {
    if (!this.state.web3) {
      return <div>Loading Web3, accounts, and contract...</div>;
    }
    return (
      <div className="App">
        <div >
          <div class="container"><img src = "bird-house.svg" height="100" alt="Bird SVG"/></div>        
        </div>
        <h1 class="App-h1">Early Bird gets the <u class="App-u1-purple"><i>WORMies!</i></u></h1>
        <img src="bird-worm.jpg" alt="Early Bird Gets the Worm"/>
        <h2>
            Let's feed some hungry birds!
        </h2>
        <br/>
        <div>
          <lable class="App-codePrompt" for="title">Campaign Title: </lable>
          <input type="text" id="title" name="title"></input>
          <label class="App-codePrompt" for="capacity">Campaign Size: </label>
          <input type="text" id="capacity" name="capacity"></input>
          <br/>
        </div>
        <div>
          <br/>
          <button class="btn-grad1" type="submit" onClick={()=>this.runCreate()}>Create Campaign</button>
        </div>
        <div class="App-codePrompt">Registration Code: <p class="border-gradient border-gradient-purple">{this.state.code}</p> </div>
        <br/>
        <hr class="rounded"/>
        <h2>Stop the clock and start the fun!</h2>
        <button class="btn-grad1" type="submit" onClick={()=>this.runClose()}>Close Campaign</button>
        <br/>
        <div>Transaction Status: {this.state.closed}</div>

        <hr class="rounded"/>
        <h2>
            WELCOME BIRDIE! 
        </h2>
        <h2>Got the Code?</h2>
        <br/>
        <div>
          <label class="App-codePrompt" for="Code">Registration Code </label>
          <input type="text" id="Code" name="Code"></input>
          <br/>
          <br/>
          <button class="btn-grad2" type="submit" onClick={()=>this.runRegister()}>Register</button>
        </div>
        <br/>
        <div>Transaction Status: {this.state.registered}</div>

        <hr class="rounded"/>
        <h2>
            YAY! TO THE MOON
        </h2>
        <h2>off we go...</h2>
        <br/>
        <div>
          <button class="btn-grad" type="submit" onClick={()=>this.runAirdrop()}>Airdrop</button>
        </div>
        <br/>
        <div>Transaction Status: {this.state.airdrop}</div>
        <hr class="rounded"/>      
        <div class="fixed-footer">
          <div class="container">Copyright &copy; 2022 Gauravc.eth</div>        
        </div>
      </div>
    );
  }
}

export default App;
