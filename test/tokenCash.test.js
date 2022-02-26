const { expect } = require("chai");

describe("Testcase of Token CASH: ", () => {
    let Token, token, owner, addr1, addr2;
    // Static mint is 1999 Ether
    //   constructor (string memory name_, string memory symbol_) ERC20(name_, symbol_) {
    //     _mint(_msgSender(), 1999 ether);
    // }
    const STATIC_ETHERS_1 = '1000000000000000000';
    const STATIC_ETHERS_2 = '2000000000000000000000';
    beforeEach(async () => {
        [owner, addr1, addr2] = await ethers.getSigners();
        Token = await ethers.getContractFactory("TokenCash");
        token = await Token.deploy("Cash Coin", "CASH");
        await token.deployed();    
    });

    describe("Deployment", async () => {
        it("should be deployed with correct name and symbol", async () => {
            expect(await token.name()).to.equal("Cash Coin");
            expect(await token.symbol()).to.equal("CASH");
        });
        it("should balance of owner equal to total supply of token", async () => {
            const ownerBalance = await token.balanceOf(owner.address);
            expect(await token.totalSupply()).to.equal(ownerBalance);
        });
    });

    describe("Function: mint", async () => {
        it("should return success with be minted by only owner",async () => {
            const tx = await token.connect(owner).mint(addr1.address, STATIC_ETHERS_1);
            await tx.wait();
            const addr1Balance = await token.balanceOf(addr1.address);
            expect(addr1Balance).to.equal(STATIC_ETHERS_1);
        });
        it("should return fail with NOT be minted by only owner",async () => {
          try {
            const tx = await token.connect(addr1).mint(addr2.address, STATIC_ETHERS_1);
            await tx.wait();
          } catch(e) {} 
            const addr2Balance = await token.balanceOf(addr2.address);
            expect(addr2Balance).to.equal(0);
        });
        it("should update total supply when mint success", async () => {
          await token.connect(owner).mint(addr1.address, STATIC_ETHERS_1);
          expect(await token.totalSupply()).to.equal(STATIC_ETHERS_2);
        });
    });
});
