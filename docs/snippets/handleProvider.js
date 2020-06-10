/*****************************************/
/* Detect the MetaMask Ethereum provider */
/*****************************************/

import detectProvider from '@metamask/detect-provider';

try {
  const provider = await detectProvider();
  startApp(provider); // Initialize your app
} catch (error) {
  console.log('Please install MetaMask!');
}

function startApp(provider) {
  // If the provider returned by detectProvider is not the same as
  // window.ethereum, something is overwriting it, perhaps another wallet.
  if (provider === window.ethereum) {
    console.error('Do you have multiple wallets installed?');
  }
  // Access the decentralized web!
}

/**********************************************************/
/* Handle chain (network) and chainChanged (per EIP 1193) */
/**********************************************************/

let currentChainId = null;
ethereum
  .request({ method: 'eth_chainId' })
  .then(handleChainChanged)
  .catch((err) => console.error(err));

ethereum.on('chainChanged', handleChainChanged);

function handleChainChanged(chainId) {
  if (currentChainId !== chainId) {
    currentChainId = chainId;
    // Do any other work!
  }
}

/***********************************************************/
/* Handle user accounts and accountsChanged (per EIP 1193) */
/***********************************************************/

let currentAccount = null;
ethereum
  .request({ method: 'eth_accounts' })
  .then(handleAccountsChanged)
  .catch((err) => {
    // Some unexpected error.
    // For backwards compatibility reasons, if no accounts are available,
    // eth_accounts will return an empty array.
    console.error(err);
  });

// Note that this event is emitted on page load.
// If the array of accounts is non-empty, you're already
// connected.
ethereum.on('accountsChanged', handleAccountsChanged);

// For now, 'eth_accounts' will continue to always return an array
function handleAccountsChanged(accounts) {
  if (accounts.length === 0) {
    // MetaMask is locked or the user has not connected any accounts
    console.log('Please connect to MetaMask.');
  } else if (accounts[0] !== currentAccount) {
    currentAccount = accounts[0];
    // Do any other work!
  }
}

/*********************************************/
/* Access the user's accounts (per EIP 1102) */
/*********************************************/

// You should only attempt to connect in response to user interaction,
// such as a button click. Otherwise, you spam the user with popups
// like it's 1999.
// If you can't retrieve the user's account(s), you should encourage the user
// to initiate a connection attempt.
document.getElementById('connectButton', connect);

function connect() {
  ethereum
    .request({ method: 'eth_requestAccounts' })
    .then(handleAccountsChanged)
    .catch((err) => {
      if (err.code === 4001) {
        // EIP 1193 userRejectedRequest error
        // If this happens, the user rejected the connection request.
        console.log('Please connect to MetaMask.');
      } else {
        console.error(err);
      }
    });
}