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
      this.setState({ code:0, web3, accounts, contract: instance });//, this.runExample);
    } catch (error) {
      // Catch any errors for any of the above operations.
      alert(
        `Failed to load web3, accounts, or contract. Check console for details.`,
      );
      console.error(error);
    }
  };

  runExample = async () => {
    const { accounts, contract } = this.state;
    const title = document.getElementById("title").value;
    const cap = document.getElementById("capacity").value;

    // Stores a given value, 5 by default.
    await contract.methods.addCampaign(title, cap).send({ from: accounts[0] });

    // Get the value from the contract to prove it worked.
    const response = await contract.methods.getCampaignDetails(1).call();

    // Update state with the result.
    this.setState({ code: response[1] });
  };

  render() {
    if (!this.state.web3) {
      return <div>Loading Web3, accounts, and contract...</div>;
    }
    return (
      <div className="App">
        <img src="bird-worm.jpg" alt="Early Bird Gets the Worm"/>
        <h1>Early Bird gets the<i><u> WORMies!</u></i></h1>
        <p>
            Let's feed some hungry birds!
        </p>
        <br/>
        <div>
          <text>Title: </text>
          <input type="text" id="title"></input>
          <br/>
          <text>Capacity: </text>
          <input type="text" id="capacity"></input>
          <br/>
          <button type="submit" onClick={()=>this.runExample()}>Submit</button>
        </div>
        <br/>
        <div>Your Campaign Code is: {this.state.code}</div>
        <br/>
        <div>(Share the code out, bring in the birdies)</div>
      </div>
    );
  }
}

export default App;
