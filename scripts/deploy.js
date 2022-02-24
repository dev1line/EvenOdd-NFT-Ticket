const fs = require('fs');
const hre = require('hardhat');
const ethers = hre.ethers;

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log('=====================================================================================');
  console.log(`DEPLOYED CONTRACT TOKEN TO:  ${hre.network.name}`);

  const Token = await ethers.getContractFactory("HandleToken");
  const name_CASH = "CASHCOIN";
  const symbol_CASH = "CASH";
  const token = await Token.deploy();
  await token.deployed();
  const cash = token.createToken(name_CASH, symbol_CASH);

  console.log('=====================================================================================');
  console.log(`DEPLOYED CONTRACT TOKEN SUCCESSFULLY AT:  ${ticket.address}`);

  const Ticket = await ethers.getContractFactory("ERC721Full");
  const name = "Mastercard VIP";
  const symbol = "MTCASH";
  const ticket = await Ticket.deploy(name, symbol);
  await ticket.deployed();

  console.log('=====================================================================================');
  console.log(`DEPLOYED CONTRACT TICKET SUCCESSFULLY AT:  ${ticket.address}`);
  console.log('=====================================================================================');
  console.log('DEPLOYER:', deployer.address);
  console.log('DEALER  :', deployer.address);

  const EvenOdd = await ethers.getContractFactory("EvenOdd");

  const evenOdd = await EvenOdd.deploy(deployer.address, ticket.address, cash.address);
  await evenOdd.deployed();

  console.log('=====================================================================================');
  console.log(`DEPLOYED CONTRACT EVENODD SUCCESSFULLY AT:  ${evenOdd.address}`);
  console.log('=====================================================================================');


  // export deployed contracts to json (using for front-end)
  const contractAddresses = {
    "Cash": cash.address,
    "Ticket": ticket.address,
    "EvenOdd": evenOdd.address
  }
  await fs.writeFileSync("contracts.json", JSON.stringify(contractAddresses));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
