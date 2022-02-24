const { ethers } = require("hardhat");
const { expect } = require("chai");

describe("Testcase for main function", function() {
    // describe("Deployment", function () {
        it("Should Ticket can be mint", async function () {
            const Ticket = await ethers.getContractFactory("ERC721Full");
        // EvenOdd = await ethers.getContractFactory("EvenOdd");
        const [owner, addr1, addr2] = await ethers.getSigners();

        // To deploy our contract, we just have to call Token.deploy() and await
        // for it to be deployed(), which happens once its transaction has been
        // mined.
        const name = "MasterCash";
        const symbol = "MTCASH";
        const ticket = await Ticket.deploy(name, symbol);
        await ticket.deployed();
        console.log("ticket", ticket)
            const data = {
                to: addr2.address,
                tokenId: 222,
                tokenURI: "https://ipfs.io/ipfs/QmYe4QdGyrxPg4pWB2cnSN2ydEt2DbgJwhynE5CkSZeLJV?filename=MasterCard.png"
            }
            const mint_action = await ticket.mintNFT(data.to,data.tokenId, data.tokenURI);
            await mint_action.wait();
            console.log("mint_action", mint_action)
            const totalSupply = await ticket.totalSupply(); 
            // const balance = await ticket.balanceOf(addr1.address)
            expect(totalSupply).to.equal(1);
            expect(await ticket.name()).equal(name);
            expect(await ticket.symbol()).equal(symbol);
        });
        
    //     it("Should EvenOdd set the right owner", async function () {
    //         expect(await evenOdd.owner()).to.equal(owner.address);
    //     });
     
    // });
    // describe("Default State & Value", function () {
    //     it("Should return default value when start", async function() {
    //         expect(await evenOdd.rollId().equal.to(1));

    //         expect(await evenOdd.totalBetAmount().equal.to(0));

    //         expect(await evenOdd.totalBetAmountPerRoll().equal.to(0));
    //     });
          
    // });
});
