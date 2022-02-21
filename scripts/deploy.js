const fs = require('fs');
const hre = require('hardhat');
const ethers = hre.ethers;

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log('=====================================================================================');
  console.log(`DEPLOYED CONTRACT TICKET TO:  ${hre.network.name}`);

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

  const evenOdd = await EvenOdd.deploy(deployer.address, ticket.address);
  await evenOdd.deployed();

  console.log('=====================================================================================');
  console.log(`DEPLOYED CONTRACT EVENODD SUCCESSFULLY AT:  ${evenOdd.address}`);
  console.log('=====================================================================================');


  // export deployed contracts to json (using for front-end)
  const contractAddresses = {
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
