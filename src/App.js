import React, { Component } from 'react';
import CoinList from './components/CoinList';
import './App.css';

class App extends Component {
  render() {
    return (
      <div className="App">
        <header className="App-header">
          <h1 className="App-title">Welcome to CoinJ</h1>
        </header>
        <div style={{ paddingTop: '25px' }} className="App-intro">
          <CoinList />
        </div>
      </div>
    );
  }
}

export default App;
