const { expect } = require("chai");

describe("Testcase of EvenOdd: ", () => {
    const ONE_ETHER  ='1000000000000000000';
    const TWO_ETHERS  ='2000000000000000000';
    const THREE_ETHERS  ='3000000000000000000';
    const FOUR_ETHERS  ='4000000000000000000';
    const MORE_ETHERS  ='1999000000000000000000';
    let Token, token, Ticket, ticket, EvenOdd, evenOdd, owner, addr1, addr2;
    // const ipfsMasterCard = "https://ipfs.io/ipfs/QmYe4QdGyrxPg4pWB2cnSN2ydEt2DbgJwhynE5CkSZeLJV?filename=MasterCard.png";
    beforeEach(async () => {
        [owner, addr1, addr2] = await ethers.getSigners();
        Token = await ethers.getContractFactory("TokenCash");
        token = await Token.deploy("Cash Coin", "CASH");
        await token.deployed();   
        
        Ticket = await ethers.getContractFactory("MasterCard");
        ticket = await Ticket.deploy("MasterCard", "MTCASH");
        await ticket.deployed(); 

        EvenOdd = await ethers.getContractFactory("EvenOdd");
        evenOdd = await EvenOdd.deploy(owner.address, ticket.address, token.address);
        await evenOdd.deployed(); 
    });
    describe("Deployment", async () => {
        it("should be deployed with correct token and ticket", async () => {
          expect(await evenOdd._cash()).to.equal(token.address);
          expect(await evenOdd._ticket()).to.equal(ticket.address);
        });
    });
    describe("1 Function: transfer", () => {
        // it("should return fail when transfer error", async () => {
        //     await token.mint(owner.address, TWO_ETHERS);
        //     const tx = await token.approve(evenOdd.address, MORE_ETHERS);
        //     await tx.wait();
        //     await evenOdd.transfer(THREE_ETHERS);
        // });
        it("should show message: ... when not owner call transfer", async () => {
            let logError = "";
            await token.mint(owner.address, TWO_ETHERS);
            const tx = await token.approve(evenOdd.address, MORE_ETHERS);
            await tx.wait();
            try {
                await evenOdd.connect(addr1).transfer(THREE_ETHERS);
            } catch (e) {
                logError = `${e.message}`;
            }
            expect(logError).to.match(/Ownable: caller is not the owner/)
        });
        it("should transfer success when owner call transfer", async () => {
            expect(await evenOdd.getDealerBalance()).to.equal(0);

            await token.mint(owner.address, TWO_ETHERS);
            const tx = await token.approve(evenOdd.address, MORE_ETHERS);
            await tx.wait();
            const tf = await evenOdd.transfer(THREE_ETHERS);
            await tf.wait();

            expect(await evenOdd.getDealerBalance()).to.equal(THREE_ETHERS);
        });
    })
    describe("2 Function: withdraw", () => {
        it("should return fail if amount withdraw equal to zero", async () => {
            let logError = "";
            try {
                const tx = await evenOdd.withdraw(0);
                await tx.wait();
            } catch (e) {
                logError = `${e}`;
            }

            expect(logError).to.match(/Amount must be not zero/);
        });
        it("shoulld return fail when amount exceeds balance", async () => {
            let logError = "";
            await token.mint(owner.address, TWO_ETHERS);
            const tx = await token.approve(evenOdd.address, MORE_ETHERS);
            await tx.wait();
            await evenOdd.transfer(THREE_ETHERS);
            try {
                const txw = await evenOdd.withdraw(FOUR_ETHERS);
                await txw.wait();
            } catch (e) {
                logError = `${e}`;
            }

            expect(logError).to.match(/Amount exceeds balance/);
        });
        it("should withdraw success when 0 < amount < onwer transfer", async () => {
            expect(await token.balanceOf(owner.address)).to.equal(MORE_ETHERS);
            await token.mint(owner.address, TWO_ETHERS);

            const tx = await token.approve(evenOdd.address, MORE_ETHERS);
            await tx.wait();
            const tf = await evenOdd.transfer(THREE_ETHERS);
            await tf.wait();

            expect(await token.balanceOf(evenOdd.address)).to.equal(THREE_ETHERS);
            
            const txw = await evenOdd.connect(owner).withdraw(TWO_ETHERS);
            await txw.wait();
 
            expect(await token.balanceOf(evenOdd.address)).to.equal(ONE_ETHER);
        });
    })
    describe("3 Function: bet", () => {
        it("should return fail when sender not have ticket", async () => {
            let logError = "";
            await token.mint(owner.address, TWO_ETHERS);
            const tx = await token.approve(evenOdd.address, MORE_ETHERS);
            await tx.wait();
            await evenOdd.transfer(MORE_ETHERS);
            
            //step 2: mint token 
            await token.mint(addr1.address, ONE_ETHER);
            // await ticket.mint(addr1.address);
            //step 3: player bet 
            const txa = await token.connect(addr1).approve(evenOdd.address, MORE_ETHERS);
            await txa.wait();
            try {
                const beta = await evenOdd.connect(addr1).bet(true, ONE_ETHER);
                await beta.wait();  
            } catch (e) {
                logError = `${e}`
            }
            //check
            expect(logError).to.match(/You need to buy a ticket to play this game/);
        });
        it("should return fail when sender have a ticket expired", async () => {
            await token.mint(owner.address, TWO_ETHERS);
            const tx = await token.approve(evenOdd.address, MORE_ETHERS);
            await tx.wait();
            await evenOdd.transfer(MORE_ETHERS);
            
            //step 2: mint token and mint ticket for addr1
            await token.mint(addr1.address, ONE_ETHER);
            await ticket.mint(addr1.address);
            // adjust time
            const thirtyDays = 30 * 24 * 60 * 60;
            await ethers.provider.send('evm_increaseTime', [thirtyDays + 1999]);
            await ethers.provider.send('evm_mine');
            //step 3: player bet 
            const txa = await token.connect(addr1).approve(evenOdd.address, MORE_ETHERS);
            await txa.wait();
            try {
                const beta = await evenOdd.connect(addr1).bet(true, ONE_ETHER);
                await beta.wait();  
            } catch (e) {
                logError = `${e}`
            }
            //check
            expect(logError).to.match(/Your ticket is expired/);
        });
        it("should return fail when sender has ever bet before in same rollId", async () => {
            await token.mint(owner.address, TWO_ETHERS);
            const tx = await token.approve(evenOdd.address, MORE_ETHERS);
            await tx.wait();
            await evenOdd.transfer(MORE_ETHERS);
            
            //step 2: mint token and mint ticket for addr1
            await token.mint(addr1.address, ONE_ETHER);
            await ticket.mint(addr1.address);
            //step 3: player bet 
            const txa = await token.connect(addr1).approve(evenOdd.address, MORE_ETHERS);
            await txa.wait();
            try {
                const beta = await evenOdd.connect(addr1).bet(true, ONE_ETHER);
                await beta.wait();  
                const betb = await evenOdd.connect(addr1).bet(true, ONE_ETHER);
                await betb.wait();  
            } catch (e) {
                logError = `${e}`
            }
            //check
            expect(logError).to.match(/Already bet/);
        });
        it("should return fail when sender bet amount = 0", async () => {
            await token.mint(owner.address, TWO_ETHERS);
            const tx = await token.approve(evenOdd.address, MORE_ETHERS);
            await tx.wait();
            await evenOdd.transfer(MORE_ETHERS);
            
            //step 2: mint token and mint ticket for addr1
            await token.mint(addr1.address, ONE_ETHER);
            await ticket.mint(addr1.address);
            //step 3: player bet 
            const txa = await token.connect(addr1).approve(evenOdd.address, MORE_ETHERS);
            await txa.wait();
            try {
                const beta = await evenOdd.connect(addr1).bet(true, 0);
                await beta.wait();  
            } catch (e) {
                logError = `${e}`
            }
            //check
            expect(logError).to.match(/minimum amount needed to play the game/);
        });
        it("should return fail when total bet amount exceeds dealer balance", async () => {
            await token.mint(owner.address, TWO_ETHERS);
            const tx = await token.approve(evenOdd.address, MORE_ETHERS);
            await tx.wait();
            await evenOdd.transfer(TWO_ETHERS);
            
            //step 2: mint token and mint ticket for addr1
            await token.mint(addr1.address, ONE_ETHER);
            await ticket.mint(addr1.address);
            await token.mint(addr2.address, THREE_ETHERS);
            await ticket.mint(addr2.address);
            //step 3: player bet 
            const txa = await token.connect(addr1).approve(evenOdd.address, MORE_ETHERS);
            await txa.wait();
            const txb = await token.connect(addr2).approve(evenOdd.address, MORE_ETHERS);
            await txb.wait();
            try {
                const beta = await evenOdd.connect(addr1).bet(true, ONE_ETHER);
                await beta.wait(); 
                const betb = await evenOdd.connect(addr2).bet(true, THREE_ETHERS);
                await betb.wait(); 
            } catch (e) {
                logError = `${e}`
            }
            //check
            expect(logError).to.match(/total bet amount exceeds dealer balance/);
        });
        // it("should return fail when tranfer cash from sender fail", async () => {

        // });
        it("should return success when player transfer cash", async () => {
            await token.mint(owner.address, TWO_ETHERS);
            const tx = await token.approve(evenOdd.address, MORE_ETHERS);
            await tx.wait();
            await evenOdd.transfer(MORE_ETHERS);
            
            //step 2: mint token and mint ticket for addr1
            await token.mint(addr1.address, ONE_ETHER);
            await ticket.mint(addr1.address);
            await token.mint(addr2.address, THREE_ETHERS);
            await ticket.mint(addr2.address);
            //step 3: player bet 
            const txa = await token.connect(addr1).approve(evenOdd.address, MORE_ETHERS);
            await txa.wait();
            const txb = await token.connect(addr2).approve(evenOdd.address, MORE_ETHERS);
            await txb.wait();
            //step 4: bet
            const beta = await evenOdd.connect(addr1).bet(true, ONE_ETHER);
            await beta.wait(); 
            const betb = await evenOdd.connect(addr2).bet(true, THREE_ETHERS);
            await betb.wait(); 
            //check
            expect(await evenOdd.totalBetAmountPerRoll()).to.equal(FOUR_ETHERS);
    });
})
    describe("4 Function: rollDice", () => {
        it("should show message: ... when not owner call transfer", async () => {
            let logError = "";
            await token.mint(owner.address, TWO_ETHERS);
            const tx = await token.approve(evenOdd.address, MORE_ETHERS);
            await tx.wait();
            await evenOdd.transfer(MORE_ETHERS);
            
            //step 2: mint token and mint ticket for addr1
            await token.mint(addr1.address, ONE_ETHER);
            await ticket.mint(addr1.address);
            //step 3: player bet 
            const txa = await token.connect(addr1).approve(evenOdd.address, MORE_ETHERS);
            await txa.wait();
            const beta = await evenOdd.connect(addr1).bet(true, ONE_ETHER);
            await beta.wait();
            //step 4: roll dice
            try {
                await evenOdd.connect(addr1).rollDice();
            } catch (e) {
                logError = `${e.message}`;
            }
            //check
            expect(logError).to.match(/Ownable: caller is not the owner/)
        });
        it("should return fail when no one place bet", async () => {
            let logError = "";
            await token.mint(owner.address, TWO_ETHERS);
            const tx = await token.approve(evenOdd.address, MORE_ETHERS);
            await tx.wait();
            await evenOdd.transfer(MORE_ETHERS);
           
            //step 4: roll dice
            try {
                await evenOdd.rollDice();
            } catch (e) {
                logError = `${e.message}`;
            }
            //check
            expect(logError).to.match(/No one place bet/)
        });
        it("should roll success when owner call", async () => {
            await token.mint(owner.address, TWO_ETHERS);
            const tx = await token.approve(evenOdd.address, MORE_ETHERS);
            await tx.wait();
            await evenOdd.transfer(MORE_ETHERS);
            
            //step 2: mint token and mint ticket for addr1
            await token.mint(addr1.address, ONE_ETHER);
            await ticket.mint(addr1.address);
            //step 3: player bet 
            const txa = await token.connect(addr1).approve(evenOdd.address, MORE_ETHERS);
            await txa.wait();
            const beta = await evenOdd.connect(addr1).bet(true, ONE_ETHER);
            await beta.wait();
            //step 4: roll dice
            const txr = await evenOdd.rollDice();
            await txr.wait();
            //check
            expect(await evenOdd.rollId()).to.equal(2)
        });
    })
    describe("5 Function: isAlreadyBet", () => {
        it("should return false when player has never bet in this rollId", async () => {
            await token.mint(owner.address, TWO_ETHERS);
            const tx = await token.approve(evenOdd.address, MORE_ETHERS);
            await tx.wait();
            await evenOdd.transfer(MORE_ETHERS);
            //step 2: mint token and mint ticket for addr1
            await token.mint(addr1.address, ONE_ETHER);
            await ticket.mint(addr1.address);
            //check
            expect(await evenOdd.isAlreadyBet(addr1.address)).to.equal(false);
        });
        it("should return true when player has ever bet in this rollId", async () => {
            await token.mint(owner.address, TWO_ETHERS);
            const tx = await token.approve(evenOdd.address, MORE_ETHERS);
            await tx.wait();
            await evenOdd.transfer(MORE_ETHERS);
            //step 2: mint token and mint ticket for addr1
            await token.mint(addr1.address, ONE_ETHER);
            await ticket.mint(addr1.address);
            //step 3: player bet 
            const txa = await token.connect(addr1).approve(evenOdd.address, MORE_ETHERS);
            await txa.wait();
            const beta = await evenOdd.connect(addr1).bet(true, ONE_ETHER);
            await beta.wait();
             //check
             expect(await evenOdd.isAlreadyBet(addr1.address)).to.equal(true);
        });
    })
    describe("6 Function: getDealerBalance", () => {
        it("should return a mount of cash that onwer allow player bet", async () => {
            await token.mint(owner.address, TWO_ETHERS);
            const tx = await token.approve(evenOdd.address, MORE_ETHERS);
            await tx.wait();
            await evenOdd.transfer(MORE_ETHERS);

            expect(await evenOdd.getDealerBalance()).to.equal(MORE_ETHERS);
        });
    })
    describe("7 Function: getBetAmountOf", () => {
        it("should return a number of cash that player bet", async () => {
            await token.mint(owner.address, TWO_ETHERS);
            const tx = await token.approve(evenOdd.address, MORE_ETHERS);
            await tx.wait();
            await evenOdd.transfer(MORE_ETHERS);
            //step 2: mint token and mint ticket for addr1
            await token.mint(addr1.address, ONE_ETHER);
            await ticket.mint(addr1.address);

            await token.mint(addr2.address, TWO_ETHERS);
            await ticket.mint(addr2.address);
            //step 3: player bet 
            const txa = await token.connect(addr1).approve(evenOdd.address, MORE_ETHERS);
            await txa.wait();
            const beta = await evenOdd.connect(addr1).bet(true, ONE_ETHER);
            await beta.wait();

            const txb = await token.connect(addr2).approve(evenOdd.address, MORE_ETHERS);
            await txb.wait();
            const betb = await evenOdd.connect(addr2).bet(true, TWO_ETHERS);
            await betb.wait();
            //check
            expect(await evenOdd.getBetAmountOf(addr1.address)).to.equal(ONE_ETHER);
            expect(await evenOdd.getBetAmountOf(addr2.address)).to.equal(TWO_ETHERS);
        });
    })
    describe("8 Function: getPlayerInfo", () => {
        it("should return information of player", async () => {
            //step 1: mint token for owner and owner transfer
            await token.mint(owner.address, TWO_ETHERS);
            const tx = await token.approve(evenOdd.address, MORE_ETHERS);
            await tx.wait();
            await evenOdd.transfer(THREE_ETHERS);
            //step 2: mint token and mint ticket for addr1
            await token.mint(addr1.address, ONE_ETHER);
            await ticket.mint(addr1.address);

            await token.mint(addr2.address, ONE_ETHER);
            await ticket.mint(addr2.address);
            //step 3: player bet 
            const txa = await token.connect(addr1).approve(evenOdd.address, MORE_ETHERS);
            await txa.wait();
            const bet = await evenOdd.connect(addr1).bet(true, ONE_ETHER);
            await bet.wait();
            //check
            const info = await evenOdd.getPlayerInfo(addr1.address);
            expect(info.isEven).to.equal(true);
            expect(info.betAmount).to.equal(ONE_ETHER);
        });
    })
    // describe("9 Function: transferMoney", () => {
    //     it("should transfer to players cash theirs win", async () => {
    //         //step 1: mint token for owner and owner transfer
    //         await token.mint(owner.address, TWO_ETHERS);
    //         const tx = await token.approve(evenOdd.address, MORE_ETHERS);
    //         await tx.wait();
    //         await evenOdd.transfer(FOUR_ETHERS);
    //         //step 2: mint token and mint ticket for addr1
    //         await token.mint(addr1.address, ONE_ETHER);
    //         await ticket.mint(addr1.address);

    //         await token.mint(addr2.address, ONE_ETHER);
    //         await ticket.mint(addr2.address);
    //         //step 3: player bet 
    //         const txa = await token.connect(addr1).approve(evenOdd.address, MORE_ETHERS);
    //         await txa.wait();
    //         const bettx = await evenOdd.connect(addr1).bet(true, ONE_ETHER);
    //         await bettx.wait();

    //         const txb = await token.connect(addr2).approve(evenOdd.address, MORE_ETHERS);
    //         await txb.wait();
    //         const bet = await evenOdd.connect(addr2).bet(false, ONE_ETHER);
    //         await bet.wait();
    //         //step 4: owner roll dice
    //         const roll = await evenOdd.rollDice();
    //         await roll.wait();

    //         // ? how to get result
    //         // expect()
    //     });
    // })
    describe("10 Function: resetBoard", () => {
        it("should reset all initial data when start new roll", async () => {
            //step 1: mint token for owner and owner transfer
            await token.mint(owner.address, TWO_ETHERS);
            const tx = await token.approve(evenOdd.address, MORE_ETHERS);
            await tx.wait();
            await evenOdd.transfer(TWO_ETHERS);
            //step 2: mint token and mint ticket for addr1
            await token.mint(addr1.address, ONE_ETHER);
            await ticket.mint(addr1.address);
            //step 3: player bet 
            const txa = await token.connect(addr1).approve(evenOdd.address, MORE_ETHERS);
            await txa.wait();
            const bettx = await evenOdd.connect(addr1).bet(true, ONE_ETHER);
            await bettx.wait();
            //step 4: owner roll dice
            const roll = await evenOdd.rollDice();
            await roll.wait();

            expect(await evenOdd.rollId()).to.equal(2);
            expect(await evenOdd.totalBetAmountPerRoll()).to.equal(0);
        });
    })
    // describe("11 Function: generateRandomNumber", () => {
    //     // it("should return a random number from 1 to 6", async () => {
    //     //     const num1 = await evenOdd.generateRandomNumber(1);
    //     //     const num2 = await evenOdd.generateRandomNumber(2);

    //     //     expect(num1).to.be.greaterThan(0);
    //     //     expect(num1).to.be.lessThan(6);

    //     //     expect(num2).to.be.greaterThan(0);
    //     //     expect(num2).to.be.lessThan(6);
    //     // }); 
    // })
})