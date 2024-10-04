const { ethers } = require("ethers");
const Web3 = require("web3");

const newTokens = [];
const maxWaitingTime = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// Connect to an Ethereum node (e.g., Infura, Alchemy, or a local node)
const providerUrl = "wss://ethereum-mainnet.core.chainstack.com/6036a10387b4bb5ecc3ff2bfd9a7ff0d"; // Replace with your Ethereum node URL
const ethersProvider = new ethers.providers.WebSocketProvider(providerUrl);
const web3 = new Web3(providerUrl);

// ABI to check if a contract implements ERC20 interface
const ERC20_ABI = [
    "function totalSupply() external view returns (uint256)",
    "function balanceOf(address owner) external view returns (uint256)",
    "function transfer(address to, uint256 amount) external returns (bool)",
    "function approve(address spender, uint256 amount) external returns (bool)"
];

// Uniswap V2 factory ABI (to listen for liquidity events)
const UNISWAP_FACTORY_ABI = [
    "event PairCreated(address indexed token0, address indexed token1, address pair, uint)"
];
const UNISWAP_PAIR_ABI = [
    "event Mint(address indexed sender, uint amount0, uint amount1)"
];

// Uniswap V2 factory contract address (replace with the testnet one if needed)
const UNISWAP_FACTORY_ADDRESS = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f"; // Mainnet Uniswap V2 factory address

// Uniswap V2 factory contract
const uniswapFactory = new ethers.Contract(UNISWAP_FACTORY_ADDRESS, UNISWAP_FACTORY_ABI, ethersProvider);

// Function to handle new blocks
async function handleNewBlock(blockNumber) {
    console.log(`New block: ${blockNumber}`);

    // Get the block details
    const block = await ethersProvider.getBlockWithTransactions(blockNumber);

    // Loop through each transaction in the block
    for (const tx of block.transactions) {
        // Get the transaction receipt
        const receipt = await web3.eth.getTransactionReceipt(tx.hash);

        // Check if the transaction deployed a contract
        if (receipt.contractAddress) {
            console.log(`Contract deployed at: ${receipt.contractAddress}`);

            // Check if it's an ERC-20 token by calling some of the functions from the ERC-20 interface
            const contract = new ethers.Contract(receipt.contractAddress, ERC20_ABI, ethersProvider);
            try {
                await contract.totalSupply();
                console.log(`New ERC-20 token deployed: ${receipt.contractAddress}`);
                newTokens.push(receipt.contractAddress);

                // Start a listener for liquidity provision (PairCreated event)
                startLiquidityListener(receipt.contractAddress);
            } catch (error) {
                console.log(`Contract ${receipt.contractAddress} is not a valid ERC-20 token.`);
            }
        }
    }
}

// Function to listen for liquidity provision
function startLiquidityListener(tokenAddress) {
    console.log(`Listening for liquidity events for token: ${tokenAddress}`);

    // Start a timer to limit listening time to 24 hours
    const timer = setTimeout(() => {
        console.log(`Stopping liquidity listener for token: ${tokenAddress} after 24 hours.`);
    }, maxWaitingTime);

    // Listen for the PairCreated event from Uniswap
    uniswapFactory.on("PairCreated", (token0, token1, pairAddress) => {
        if (token0 === tokenAddress || token1 === tokenAddress) {
            console.log(`Liquidity pool created for token: ${tokenAddress} at pair: ${pairAddress}`);

            // Once a pool is created, we can start listening for the Mint events to track liquidity being added
            const pairContract = new ethers.Contract(pairAddress, UNISWAP_PAIR_ABI, ethersProvider);
            pairContract.on("Mint", (sender, amount0, amount1) => {
                console.log(`Liquidity added for token: ${tokenAddress}, amounts: ${amount0}, ${amount1}`);
                // Execute the buy action (swap ETH for the token)
                buyToken(tokenAddress).catch(console.error);
                clearTimeout(timer); // Stop the timer as liquidity was added
            });
        }
    });
}

async function buyToken(tokenAddress) {
    const amountOutMin = 0; // Set minimum amount of tokens to accept (use slippage tolerance)
    const ethAmount = ethers.utils.parseEther("0.1"); // Amount of ETH to spend (set your amount)
    const path = [ethers.constants.AddressZero, tokenAddress]; // ETH -> Token
    const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes from now
    const walletAddress = "0xc6D6FDf6bE8DfdEf570bb64D4fCC2c934E97dCED";
    console.log(`Attempting to buy token: ${tokenAddress} with 0.1 ETH...`);

    const tx = await uniswapRouter.swapExactETHForTokens(
        amountOutMin,
        path,
        walletAddress,
        deadline,
        {
            value: ethAmount, // ETH to send
            gasLimit: ethers.utils.hexlify(200000), // Set an appropriate gas limit
            gasPrice: await ethersProvider.getGasPrice() // Get current gas price
        }
    );

    console.log(`Transaction sent: ${tx.hash}`);

    const receipt = await tx.wait();
    console.log(`Transaction confirmed in block: ${receipt.blockNumber}`);
}
// Subscribe to new blocks
async function subscribeToNewBlocks() {
    ethersProvider.on("block", handleNewBlock);
}

// Start the subscription
subscribeToNewBlocks().catch(console.error);

