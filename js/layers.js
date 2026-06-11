addLayer("A", {
    name: "alpha", // This is optional, only used in a few places, If absent it just uses the layer id.
    symbol: "α", // This appears on the layer's node. Default is the id with the first letter capitalized
    position: 0, // Horizontal position within a row. By default it uses the layer id and sorts in alphabetical order
    startData() { return {
        unlocked: true,
		points: new Decimal(0),
        autoTimer: 0,
    }},
    color: "#ff0000",
    requires: new Decimal(10), // Can be a function that takes requirement increases into account
    resource: "alpha points", // Name of prestige currency
    baseResource: "points", // Name of resource prestige is based on
    baseAmount() {return player.points}, // Get the current amount of baseResource
    type: "normal", // normal: cost to gain currency depends on amount gained. static: cost depends on how much you already have
    exponent: 0.75, // Prestige currency exponent
    branches: ["B"],
    gainMult() { // Calculate the multiplier for main currency from bonuses
        let b22 = getBuyableAmount("A", 22)
        let b23 = getBuyableAmount("A",23)
        let boost22 = new Decimal(1.42).pow(b22)
        let boost23 = new Decimal(1.8).pow(b23)

        mult = new Decimal(1)
        if (hasUpgrade('A',13)) mult = mult.times(1.5)
        if (hasUpgrade('A',14)) mult = mult.times(upgradeEffect('A',14))
        if (hasUpgrade('A',22)) mult = mult.times(upgradeEffect('A',22))
        if (hasUpgrade('A',24)) mult = mult.times(upgradeEffect('A',24))
        if (hasBuyable('A',12)) mult = mult.times(buyableEffect('A',12)).times(boost22)
        if (hasBuyable('A',13)) mult = mult.times(buyableEffect('A',13)).times(boost23)

        if (hasUpgrade('B',11)) mult = mult.times(2)
        if (hasUpgrade('B',14)) mult = mult.times(upgradeEffect('B',14))
        if (hasUpgrade('B',41)) mult = mult.times(getBuyableAmount('B',11).pow(10))

        if (hasAchievement('ach',24)) mult = mult.times(11)
        
        return mult
    },
    automate() {// Left intentionally light: actual timed buying handled in update(diff)
    },
    update(diff) {
        // Passive alpha generation: if Beta milestone 3 is owned, generate 5% of alpha reset gain per second
        try {
            if (hasMilestone('B',2) && tmp && tmp.A && tmp.A.resetGain) {
                player.A.points = player.A.points.add(tmp.A.resetGain.times(0.05).times(diff))
            }
            if (hasMilestone('B',3) && tmp && tmp.A && tmp.A.resetGain) {
                player.A.points = player.A.points.add(tmp.A.resetGain.times(0.5).times(diff))
            }
        } catch (e) { /* defensive */ }

        // Advance the autoTimer and buy one of each buyable once per second when enabled
        try {
            if (!(hasMilestone('B',1) && player.B && player.B.autobuyA11_13)) return
            if (player.A.autoTimer === undefined) player.A.autoTimer = 0

            let autoSpeed = 1
            if (hasUpgrade('B',33)) autoSpeed *= 2
            if (hasMilestone('B',3)) autoSpeed *= 3

            player.A.autoTimer += diff * autoSpeed
            while (player.A.autoTimer >= 1) {
                // Buy each buyable once per second if affordable
                for (let id of [11,12,13]) {
                    if (canBuyBuyable('A', id)) {
                        buyBuyable('A', id)
                    break
                }
                }
                player.A.autoTimer -= 1
            }
        } catch (e) { /* defensive: ignore if player.B undefined */ }
    },
    gainExp() { // Calculate the exponent on main currency from bonuses
        let exp = new Decimal(1)
        try {
            if (hasUpgrade('B',31)) exp = exp.add(new Decimal(0.015))
            if (hasUpgrade('A',35)) exp = exp.add(new Decimal(0.025))
            if (hasUpgrade('A',41)) exp = exp.add(new Decimal(0.05))
        } catch (e) {}
        return exp
    },
    row: 0, // Row the layer is in on the tree (0 is the first row)
    hotkeys: [
        {key: "a", description: "A: Reset for alpha points", onPress(){if (canReset(this.layer)) doReset(this.layer)}},
    ],
    layerShown(){return true},
    tabFormat: {
        "Upgrades": {
            content: ['main-display','prestige-button','upgrades'],
        },
        "Buyables": {
            content: ['main-display','prestige-button','buyables'],
            unlocked(){return (hasUpgrade("A",15))}
        },
    },
    upgrades: {
        rows: 5,
        cols: 5,
        11: {
        title: "Boost",
        description: "x2 points gain",
        cost: new Decimal(5),
        
        },
        12: {
        title: "'Re'Boost",
        description: "x2 points gain again",
        cost: new Decimal(15),
        unlocked() {return hasUpgrade('A',11)},
        },
        13: {
        title: "More Alpha",
        description: "Multiply alpha gain by 1.5",
        cost: new Decimal(30),
        unlocked() {return hasUpgrade('A',12)},
        },
        14: {
        title: "You want more ?",
        description: "alpha multiply themselves",
        cost: new Decimal(50),
        unlocked() {return hasUpgrade('A',13)},
        effect() {
            power = 1.25
            if (hasUpgrade('A',21)) power = 2
            return player.A.points.add(1).log10().add(1).cbrt().pow(power)
        },
        effectDisplay() { return format(upgradeEffect(this.layer, this.id))+"x" }, // Add formatting to the effect
        },
        15: {
        title: "Something new ?",
        description: "Unlock a new Tab",
        cost: new Decimal(100),
        unlocked() {return hasUpgrade('A',14)},
        },
        21: {
        title: "Finally a new row",
        description: "Change alpha upgrade 4 power effect to be better: 1.25 -> 2",
        cost: new Decimal(2e4),
        unlocked() {return hasUpgrade('A',21) || getBuyableAmount('A',12).gte(10)},
        },
        22: {
        title: "Oh that's cool",
        description: "Boost alpha gain again",
        cost: new Decimal(5e4),
        effect() {
            return new Decimal(5)
        },
        effectDisplay() { return format(upgradeEffect(this.layer, this.id))+"x" },
        unlocked() {return hasUpgrade('A',21)},
        },
        23: {
        title: "Oh, look who is back",
        description: "alpha point multiply points gain",
        cost: new Decimal(7.5e5),
        effect() {
            power = 1.25
            return player.A.points.max(1).add(1).log10().pow(power)
        },
        effectDisplay() { return format(upgradeEffect(this.layer, this.id))+"x" },
        unlocked() {return hasUpgrade('A',22)},
        },
        24: {
        title: "We are so back",
        description: "beta upgrade boost alpha point gain",
        cost: new Decimal(1.5e10),
        effect() {
            let bUpgradeCount = new Decimal(player.B.upgrades.length)

            if (hasUpgrade('A', 32))
                bUpgradeCount = bUpgradeCount.pow(2)

            if (hasUpgrade('A', 33))
                bUpgradeCount = bUpgradeCount.pow(2)

            return bUpgradeCount
        },
        effectDisplay() { return format(upgradeEffect(this.layer, this.id))+"x" },
        unlocked() {return hasUpgrade('B',13) && hasUpgrade('A',23)},
        },
        25: {
        title: "Boost boost?",
        description: "points boost themselves",
        cost: new Decimal(5e11),
        effect() {
            return player.points.max(1).log10().add(1)
        },
        effectDisplay() { return format(upgradeEffect(this.layer, this.id))+"x" },
        unlocked() {return hasUpgrade('A',24)},
        },
        31: {
        title: "Boost boost boost (seriously...)?",
        description: "points boost themselves based on alpha point",
        cost: new Decimal(1.55e13),
        effect() {
            return player.points.max(1).log10().add(player.A.points.log10().sqrt(2))
        },
        effectDisplay() { return format(upgradeEffect(this.layer, this.id))+"x" },
        unlocked() {return hasUpgrade('A',25)},
        },
        32: {
        title: "Expensive boost",
        description: "square effect of alpha upgrade 8",
        cost: new Decimal(7.89e21),
        effect() {
            return upgradeEffect('A',24).pow(2)
        },
        unlocked() {return hasUpgrade('A',31)},
        },
        33: {
        title: "Expensive boost 2",
        description: "square effect of alpha upgrade 8 again",
        cost: new Decimal(4.21e35),
        effect() {
            return upgradeEffect('A',24).pow(2)
        },
        unlocked() {return hasUpgrade('A',32)},
        },
        34: {
        title: "34",
        description: "x34 point",
        cost: new Decimal(4.22e42),
        unlocked() {return hasUpgrade('A',33)},
        },
        35: {
        title: "Another exp",
        description: "Add +0.025 to alpha exp gain",
        cost: new Decimal(8e80),
        unlocked() {return hasUpgrade('A',34)},
        },
        41: {
        title: "Exp everywhere just for you",
        description: "Add +0.05 to alpha exp gain",
        cost: new Decimal(2.5e171),
        unlocked() {return hasUpgrade('B',42) && hasUpgrade('A',35)},
        },
    },
    buyables: {
        rows: 2,
        cols: 3,
        11: {
        title: "Boost points gain <br>",
        cost(x) {
            if (x === undefined) x = getBuyableAmount(this.layer, this.id)
            x = new Decimal(x)

            const base = new Decimal(100) //Basecose

            if (x.lt(19))
                return base.mul(new Decimal(1.1).pow(x))//Multiplier = 1.1

            let costAt20 = base.mul(new Decimal(1.1).pow(19))

            if (x.lt(99))
                return costAt20.mul(new Decimal(2.5).pow(x.sub(19)))//Multiplier = 2.5

            let costAt100 = costAt20.mul(new Decimal(2.5).pow(99 - 19))

            if (x.lt(199))
                return costAt100.mul(new Decimal(14).pow(x.sub(99)))//Multiplier = 14

            let costAt200 = costAt100.mul(new Decimal(14).pow(199 - 99))


            return costAt200.mul(new Decimal(788).pow(x.sub(199))) //New Multiplier
        },
        display() {
            let amt = getBuyableAmount(this.layer, this.id)
            let originaleffect = new Decimal(100)
            if (hasUpgrade('B',35)) originaleffect = originaleffect.add(100000)
            if (hasUpgrade('B',22)) originaleffect = originaleffect.mul(player.B.upgrades.length)
            let out = `+` + format(originaleffect) + `% points gain.<br> <b>Cost:</b>` + format(this.cost()) + ' alpha points' + `\n            
            <br> <b>Effect: x</b>` + format(this.effect(amt)) + `\n            <br> <b>Amount:</b>` + format(amt)
            if (amt.lt(15)) out += '<br> <b> Need 15 buyable to unlock the next one.</b>'
            return out
        },
        canAfford() { return player[this.layer].points.gte(this.cost()) },
        buy() {
            player[this.layer].points = player[this.layer].points.sub(this.cost())
            setBuyableAmount(this.layer, this.id, getBuyableAmount(this.layer, this.id).add(1))
        },
        effect(x) {
            oeff = new Decimal(1)
            if (hasUpgrade('B',35)) oeff = oeff.add(1000)
            if (hasUpgrade('B',22)) oeff = oeff.mul(player.B.upgrades.length)
            if (hasBuyable('A',21)) return oeff.mul(x).mul(buyableEffect('A',21))
            return oeff.mul(x).add(1)
        },
        },
        12: {
        title: "Boost alpha points <br>",
        cost(x) {
            if (x === undefined) x = getBuyableAmount(this.layer, this.id)
            x = new Decimal(x)

            const base = new Decimal(500)

            if (x.lt(19))
                return base.mul(new Decimal(1.5).pow(x))

            let costAt20 = base.mul(new Decimal(1.5).pow(19))

            if (x.lt(49))
                return costAt20.mul(new Decimal(2.8).pow(x.sub(19)))

            let costAt50 = costAt20.mul(new Decimal(2.8).pow(49 - 19))

            if (x.lt(149))
                return costAt50.mul(new Decimal(29).pow(x.sub(49)))

            let costAt150 = costAt50.mul(new Decimal(29).pow(149 - 49))

            return costAt150.mul(new Decimal(2.178e3).pow(x.sub(149)))
        },
        display() {
            let amt = getBuyableAmount(this.layer, this.id)
            let text = 'x1.2 alpha points.<br> <b>Cost:</b>'
            if (hasUpgrade('B',34)) text = 'x1.25 alpha points.<br> <b>Cost:</b>'
            let out = text + format(this.cost()) + ' alpha points' + `\n            
                <br> <b>Effect: x</b>` + format(this.effect(amt)) + `\n            <br> <b>Amount:</b>` + format(amt)
            if (amt.lt(15)) out += '<br> <b> Need 15 buyable to unlock the next one.</b>'
            return out
        },
        canAfford() { return player[this.layer].points.gte(this.cost()) },
        unlocked() {return getBuyableAmount(this.layer,11).gte(new Decimal(15))},
        buy() {
            player[this.layer].points = player[this.layer].points.sub(this.cost())
            setBuyableAmount(this.layer, this.id, getBuyableAmount(this.layer, this.id).add(1))
        },
        effect(x) {
            oeff = new Decimal(1.2)
            if (hasUpgrade('B',34)) oeff = oeff.add(0.05)
            if (hasBuyable('A',22)) return oeff.pow(x).mul(buyableEffect('A',22))
            return oeff.pow(x)
        },
        },
        13: {
        title: "Boost alpha points 2 <br>",
        //cost(x){return new Decimal(1.75e5).mul(new Decimal(1.83).pow(x)) },
        cost(x) {
            if (x === undefined) x = getBuyableAmount(this.layer, this.id)
            x = new Decimal(x)

            const base = new Decimal(1.75e5)

            if (x.lt(19))
                return base.mul(new Decimal(1.83).pow(x))

            let costAt20 = base.mul(new Decimal(1.83).pow(19))

            if (x.lt(49))
                return costAt20.mul(new Decimal(4).pow(x.sub(19)))

            let costAt50 = costAt20.mul(new Decimal(4).pow(49 - 19))

            if (x.lt(124))
                return costAt50.mul(new Decimal(61).pow(x.sub(49)))

            let costAt125 = costAt50.mul(new Decimal(61).pow(124 - 49))

            return costAt125.mul(new Decimal(5.963e3).pow(x.sub(124)))
        },
        display() {
            let amt = getBuyableAmount(this.layer, this.id)
            let out = `x1.67 alpha points.<br> <b>Cost:</b>` + format(this.cost()) + ' alpha points' + `\n            
            <br> <b>Effect: x</b>` + format(this.effect(amt)) + `\n            <br> <b>Amount:</b>` + format(amt)
            if (hasUpgrade('B',13))
                if (amt.lt(20)) out += '<br> <b> Need 20 buyable to unlock the next one.</b>'
            return out
        },
        canAfford() { return player[this.layer].points.gte(this.cost()) },
        unlocked() {return getBuyableAmount(this.layer,12).gte(new Decimal(15))},
        buy() {
            player[this.layer].points = player[this.layer].points.sub(this.cost())
            setBuyableAmount(this.layer, this.id, getBuyableAmount(this.layer, this.id).add(1))
        },
        effect(x) {
            oeff = new Decimal(1.67)
            if (hasBuyable('A',23)) return oeff.pow(x).mul(buyableEffect('A',23))
            return oeff.pow(x)
        },
        },
        21: {
        title: "Boost point gain ² <br>",
        cost(x) {
            if (x === undefined) x = getBuyableAmount(this.layer, this.id)
            x = new Decimal(x)

            const base = new Decimal(2e14)

            if (x.lt(29))
                return base.mul(new Decimal(2.5).pow(x))

            let costAt30 = base.mul(new Decimal(2.5).pow(29))

            if (x.lt(99))
                return costAt30.mul(new Decimal(6).pow(x.sub(29)))//Multiplier

            let costAt100 = costAt30.mul(new Decimal(6).pow(99 - 29))

            return costAt100.mul(new Decimal(50).pow(x.sub(99)))//Multiplier
        },
        display() {
            let amt = getBuyableAmount(this.layer, this.id)
            let out = `x1.25 to Buyables 1 boosts.<br> <b>Cost:</b>` + format(this.cost()) + ' alpha points' + `\n            
            <br> <b>Effect: x</b>` + format(this.effect(amt)) + `\n            <br> <b>Amount:</b>` + format(amt)
            if (amt.lt(20)) out += '<br> <b> Need 20 buyable to unlock the next one.</b>'
            return out
        },
        canAfford() { return player[this.layer].points.gte(this.cost()) },
        unlocked() {return getBuyableAmount(this.layer,13).gte(new Decimal(20))},
        buy() {
            player[this.layer].points = player[this.layer].points.sub(this.cost())
            setBuyableAmount(this.layer, this.id, getBuyableAmount(this.layer, this.id).add(1))
        },
        effect(x) {return new Decimal(1.25).pow(x)},
        },
        22: {
        title: "Boost alpha points gain ² <br>",
        cost(x) {
            if (x === undefined) x = getBuyableAmount(this.layer, this.id)
            x = new Decimal(x)

            const base = new Decimal(1e25)

            if (x.lt(19))
                return base.mul(new Decimal(4.87).pow(x))

            let costAt20 = base.mul(new Decimal(4.87).pow(19)) //Multiplier

            if (x.lt(74))
                return costAt20.mul(new Decimal(15.9).pow(x.sub(19)))

            let costAt75 = costAt20.mul(new Decimal(15.9).pow(74 - 19)) //Muliplier

            return costAt75.mul(new Decimal(185).pow(x.sub(74)))
        },
        display() {
            let amt = getBuyableAmount(this.layer, this.id)
            let out = `x1.42 to Buyables 2 boosts.<br> <b>Cost:</b>` + format(this.cost()) + ' alpha points' + `\n            
            <br> <b>Effect: x</b>` + format(this.effect(amt)) + `\n            <br> <b>Amount:</b>` + format(amt)
            if (amt.lt(30)) out += '<br> <b> Need 30 buyable to unlock the next one.</b>'
            return out
        },
        canAfford() { return player[this.layer].points.gte(this.cost()) },
        unlocked() {return getBuyableAmount(this.layer,21).gte(new Decimal(20))},
        buy() {
            player[this.layer].points = player[this.layer].points.sub(this.cost())
            setBuyableAmount(this.layer, this.id, getBuyableAmount(this.layer, this.id).add(1))
        },
        effect(x) {return new Decimal(1.42).pow(x)},
        },
        23: {
        title: "Boost alpha points gain 2² <br>",
        cost(x) {
            if (x === undefined) x = getBuyableAmount(this.layer, this.id)
            x = new Decimal(x)

            const base = new Decimal(1e60)

            if (x.lt(14))
                return base.mul(new Decimal(8.8).pow(x))//New Muliplier

            let costAt15 = base.mul(new Decimal(8.8).pow(14)) 

            if (x.lt(44))
                return costAt15.mul(new Decimal(30).pow(x.sub(14)))//New Muliplier

            let costAt45 = costAt15.mul(new Decimal(30).pow(44 - 14))

            return costAt45.mul(new Decimal(460).pow(x.sub(44)))
        },
        display() {
            let amt = getBuyableAmount(this.layer, this.id)
            let out = `x1.8 to Buyables 3 boosts.<br> <b>Cost:</b>` + format(this.cost()) + ' alpha points' + `\n            
            <br> <b>Effect: x</b>` + format(this.effect(amt)) + `\n            <br> <b>Amount:</b>` + format(amt)
            // if (amt.lt(50)) out += '<br> <b> Need 50 buyable to unlock the next one.</b>'
            return out
        },
        canAfford() { return player[this.layer].points.gte(this.cost()) },
        unlocked() {return getBuyableAmount(this.layer,22).gte(new Decimal(30))},
        buy() {
            player[this.layer].points = player[this.layer].points.sub(this.cost())
            setBuyableAmount(this.layer, this.id, getBuyableAmount(this.layer, this.id).add(1))
        },
        effect(x) {return new Decimal(1.8).pow(x)},
        },
    },
})

addLayer("ach", {
    name: "achievements", // This is optional, only used in a few places, If absent it just uses the layer id.
    symbol: "🏆", // This appears on the layer's node. Default is the id with the first letter capitalized
    position: 0, // Horizontal position within a row. By default it uses the layer id and sorts in alphabetical order
    startData() { return {
        unlocked: true,
		points: new Decimal(0),
    }},
    color: "#FFFF00",
    nodeStyle() {return {
        "background": "radial-gradient(#FFFF00, #dce28a)" ,
    }},
    requires: new Decimal(10), // Can be a function that takes requirement increases into account
    resource: "achievements points", // Name of prestige currency
    baseResource: "achievementspoints", // Name of resource prestige is based on
    baseAmount() {return player.ach.points}, // Get the current amount of baseResource
    type: "none", // normal: cost to gain currency depends on amount gained. static: cost depends on how much you already have
    exponent: 0.75, // Prestige currency exponent
    row: 'side', // Row the layer is in on the tree (0 is the first row)
    layerShown(){return true},
    tabFormat: {
        "Achievements": {
            content: ['main-display','achievements'],
        },
        "Milestones": {
            content: ['milestones'],
        },
    },
    achievements: {
        rows: 3,
        cols: 6,
        11: {
            name: "Let's start",
            tooltip: "Get 1 alpha point. Reward: 1 AP.",
            done() {
                return player.A.points.gte(1)
            },
            onComplete() {
                addPoints("ach",1)
            }
        },
        12: {
            name: "Nice",
            tooltip: "Get 1 alpha upgrade. Reward: 1 AP.",
            done() {
                return player.A.upgrades.length > 0
            },
            onComplete() {
                addPoints("ach",1)
            }
        },
        13: {
            name: "No way you got 4 digits !",
            tooltip: "Get 1000 alpha points. Reward: 1 AP.",
            done() {
                return player.A.points.gte(1000)
            },
            onComplete() {
                addPoints("ach",1)
            }
        },
        14: {
            name: "Enough boost ?",
            tooltip: "Get 10 Bap(Buyable 2). Reward: 2 AP.",
            done() {
                return getBuyableAmount('A',12).gte(10)
            },
            onComplete() {
                addPoints("ach",2)
            }
        },
        15: {
            name: "1M ?????",
            tooltip: "Get 1M alpha points. Reward: 2 AP.",
            done() {
                return player.A.points.gte(1e6)
            },
            onComplete() {
                addPoints("ach",2)
            }
        },
        16: {
            name: "Wait... what is this thing ?",
            tooltip: "Unlock a New Layer. Reward: 3 AP.",
            done() {
                return player.A.points.gte(1e9)
            },
            onComplete() {
                addPoints("ach",3)
            }
        },
        21: {
            name: "That's more than us...",
            tooltip: "Get 1e10 alpha points. Reward: 5 AP.",
            done() {
                return player.A.points.gte(1e10)
            },
            unlocked() {return hasAchievement('ach',16)},
            onComplete() {
                addPoints("ach",5)
            }
        },
        22: {
            name: "Are we really going further ?",
            tooltip: "Get 4 beta upgrades. Reward: 5 AP.",
            done() {
                return player.B.upgrades.length >= 4
            },
            unlocked() {return hasAchievement('ach',16)},
            onComplete() {
                addPoints("ach",5)
            }
        },
        23: {
            name: "Is that a gift ?",
            tooltip: "Get 2 beta milestone. Reward: 7 AP. | And x23 points gain.",
            done() {
                return hasMilestone('B',1)
            },
            unlocked() {return hasAchievement('ach',16)},
            onComplete() {
                addPoints("ach",7)
            }
        },
        24: {
            name: "Second gift because I don't have ideas",
            tooltip: "Get 10 beta upgrades. Reward: 7 AP. | And x11 alpha gain.",
            done() {
                return player.B.upgrades.length >= 10
            },
            unlocked() {return hasAchievement('ach',16)},
            onComplete() {
                addPoints("ach",7)
            }
        },
        25: {
            name: "1De...",
            tooltip: "Get 1e33 alpha points. Reward: 7 AP",
            done() {
                return player.A.points.gte(1e33)
            },
            unlocked() {return hasAchievement('ach',16)},
            onComplete() {
                addPoints("ach",7)
            }
        },
        26: {
            name: "Oh ?",
            tooltip: "Get 1 Beta Boost Reward: 8 AP",
            done() {
                return getBuyableAmount('B',11) >= 1
            },
            unlocked() {return hasAchievement('ach',16)},
            onComplete() {
                addPoints("ach",8)
            }
        },
        31: {
            name: "...",
            tooltip: "... Reward: 10 AP",
            done() {
                return getBuyableAmount('B',11) >= 10000000000
            },
            unlocked() {return hasAchievement('ach',26)},
            onComplete() {
                addPoints("ach",10)
            }
        },
    },
    milestones: {
        0: {
            requirementDescription: "... Achievements points",
            effectDescription: "...",
            done() { return player.ach.points.gte(5000) },
            style: {'width': '750px'},
        },
    },
}),

addLayer("B", {
    name: "beta", // This is optional, only used in a few places, If absent it just uses the layer id.
    symbol: "β", // This appears on the layer's node. Default is the id with the first letter capitalized
    position: 0, // Horizontal position within a row. By default it uses the layer id and sorts in alphabetical order
    startData() { return {
        unlocked: false,
        	points: new Decimal(0),
        	autobuyA11_13: false,
    }},
    // Prevent the layer from being permanently unlocked by a prestige
    color: "#2600fc",
    requires: new Decimal(1e9), // Can be a function that takes requirement increases into account
    resource: "beta points", // Name of prestige currency
    baseResource: "alpha points", // Name of resource prestige is based on
    baseAmount() {return player.A.points}, // Get the current amount of baseResource
    type: "normal", // normal: cost to gain currency depends on amount gained. static: cost depends on how much you already have
    exponent: 0.1, // Prestige currency exponent
    gainMult() { // Calculate the multiplier for main currency from bonuses
        mult = new Decimal(1)
        if (hasUpgrade('B',21)) mult = mult.times(2)
        if (hasUpgrade('B',23)) mult = mult.times(3)
        if (hasUpgrade('B',32)) mult = mult.times(upgradeEffect('B',32))
        if (hasUpgrade('B',33)) mult = mult.times(5)
        if (hasBuyable(this.layer,11)) mult = mult.times(buyableEffect('B',11))
        if (hasBuyable(this.layer,12)) mult = mult.times(buyableEffect('B',12))
        return mult
    },
    gainExp() { // Calculate the exponent on main currency from bonuses
        return new Decimal(1)
    },
    row: 1, // Row the layer is in on the tree (0 is the first row)
    hotkeys: [
        {key: "b", description: "B: Reset for Beta points", onPress(){if (canReset(this.layer)) doReset(this.layer)}},
    ],
    layerShown() {
        if (player.A.points.gte(1e8)) player.B.unlocked = true
        return player.B.unlocked
    },
    tabFormat: {
        "Upgrades": {
            content: ['main-display','prestige-button','upgrades'],
        },
        Milestones: {
            content: ['milestones'],
        },
        Buyables: {
            content: ['main-display','prestige-button','buyables'],
            unlocked(){return (hasMilestone("B",3))}
        },
    },
    upgrades: {
        rows: 5,
        cols: 5,
        11: {
        title: "And it's beta !",
        description: "x2 alpha gain",
        cost: new Decimal(1),
        effect() {
            let eff = new Decimal(2)

            if (hasUpgrade('B', 14))
                eff = eff.mul(upgradeEffect('B', 14))

            if (hasUpgrade('B', 24))
                eff = eff.pow(1.05)

            return eff
        },

        effectDisplay() {
            return format(this.effect()) + "x"
        },
        },
        12: {
        title: "Woohoo !",
        description: "x5 points gain",
        cost: new Decimal(1),
        unlocked() {return hasUpgrade('B',11)},
        },
        13: {
        title: "And yes it's not the end :)",
        description: "Unlock more alpha upgrades & buyables",
        cost: new Decimal(3),
        unlocked() {return hasUpgrade('B',12)},
        },
        14: {
        title: "2",
        description: "Each upgrade in this row double beta upgrade 1 effect",
        cost: new Decimal(15),
        unlocked() {return hasUpgrade('B',13)},
        effect() {
            // Count owned upgrades in the first row (11..15)
            let count = 0
            for (let id = 11; id <= 15; id++) if (hasUpgrade('B', id)) count++
            // Base effect is B11's effect if owned, otherwise 1
            let base = hasUpgrade('B',11) ? new Decimal(1) : new Decimal(1)
            // For each owned upgrade in the row, multiply the base effect by 2
            // Result = base * (2^count)
            if (hasUpgrade('B',25)) return  base.times(new Decimal(2).pow(count)).pow(1.1)
            return base.times(new Decimal(2).pow(count))
        },
        effectDisplay() { return format(upgradeEffect(this.layer, this.id))+"x" },
        },
        15: {
        title: "10 + Log boost ?",
        description: "Log10() + 10 of point boost itself",
        cost: new Decimal(30),
        unlocked() {return hasUpgrade('B',14)},
        effect() {
            return player.points.max(1).log10().add(11)
        },
        effectDisplay() { return format(upgradeEffect(this.layer, this.id))+"x" },
        },
        21: {
        title: "Finally a beta boost upgrade",
        description: "boost beta gain by 2",
        cost: new Decimal(45),
        unlocked() {return hasUpgrade('B',15)},
        },
        22: {
        title: "Buyable points boost boost",
        description: "total beta upgrade boost alpha buyable 1 original effect",
        cost: new Decimal(150),
        unlocked() {return hasUpgrade('B',21)},
        },
        23: {
        title: "Another beta boost for you",
        description: "boost beta gain by 3",
        cost: new Decimal(500),
        unlocked() {return hasUpgrade('B',22)},
        },
        24: {
        title: "exp",
        description: "add +0.05 exp to beta upgrade 1",
        cost: new Decimal(1.25e3),
        unlocked() {return hasUpgrade('B',23)},
        },
        25: {
        title: "More exp",
        description: "add +0.1 exp to beta upgrade 4",
        cost: new Decimal(1.5e3),
        unlocked() {return hasUpgrade('B',24)},
        },
        31: {
        title: "Alphaxponent",
        description: "Add +0.015 to alpha exp gain",
        cost: new Decimal(5e3),
        unlocked() {return hasUpgrade('B',25)},
        },
        32: {
        title: "Milestone boost",
        description: "Milestone boost beta gain",
        cost: new Decimal(7.17e6),
        unlocked() {return hasUpgrade('B',31)},
        effect() {
            return player.ach.achievements.length
        },
        effectDisplay() { return format(upgradeEffect(this.layer, this.id))+"x" },
        },
        33: {
        title: "More Autobuy",
        description: "Double buyable autobuy speed and x5 beta gain",
        cost: new Decimal(3e7),
        unlocked() {return hasUpgrade('B',32)},
        },
        34: {
        title: "Hmmm",
        description: "alpha buyable 2 is stronger by +0.05",
        cost: new Decimal(5e8),
        unlocked() {return hasUpgrade('B',33)},
        },
        35: {
        title: "Interesting",
        description: "add +100000% to alpha buyable 1 base",
        cost: new Decimal(1.5e13),
        unlocked() {return hasUpgrade('B',34)},
        },
        41: {
        title: "Here is the help you ordered sir",
        description: "Beta Boost amount^10 boost alpha gain",
        cost: new Decimal(8e16),
        unlocked() {return getBuyableAmount('B',11) >= 5 && hasUpgrade('B',35)},
        },
        42: {
        title: "More upgrade sir ?",
        description: "Unlock more alpha upgrade",
        cost: new Decimal(2.5e22),
        unlocked() {return hasUpgrade('B',41)},
        },
    },
    milestones: {
        0: {
            requirementDescription: "Require : 10 Beta points",
            effectDescription: "Keep the first row of alpha upgrade on reset.",
            done() { return player.B.points.gte(10) },
            style: {'width': '750px'},
        },
        1: {
            requirementDescription: "Require : 250 Beta points",
            effectDescription: "Autobuy the first row of alpha buyable (1/s).",
            done() { return player.B.points.gte(250) },
            toggles: [["B","autobuyA11_13"]],
            unlocked() {return hasMilestone('B',0)},
            style: {'width': '750px'},
        },
        2: {
            requirementDescription: "Require : 2500 Beta points",
            effectDescription: "Generate 5% of alpha points per second",
            done() { return player.B.points.gte(2500) },
            unlocked() {return hasMilestone('B',1)},
            style: {'width': '750px'},
        },
        3: {
            requirementDescription: "Require : 5e13 Beta points",
            effectDescription: "Generate 50% of alpha points per second, triple buyable autobuy speed, keep second alpha row on reset, x1e10 points and unlock a new tab in beta",
            done() { return player.B.points.gte(5e13) },
            unlocked() {return hasMilestone('B',2)},
            style: {'width': '750px'},
        },
        4: {
            requirementDescription: "Require : 5e39 Beta points",
            effectDescription: "?",
            done() { return player.B.points.gte(5e39) },
            unlocked() {return hasMilestone('B',3)},
            style: {'width': '750px'},
        },
    },
    buyables: {
        rows: 2,
        cols: 3,
        11: {
        title: "Beta Boost <br>",
        cost(x) {
            if (x === undefined) x = getBuyableAmount(this.layer, this.id)
            x = new Decimal(x)

            const base = new Decimal(1e15) //Basecose

           if (x.lt(14))
                return base.mul(new Decimal(2).pow(x))

            let costAt15 = base.mul(new Decimal(2).pow(14)) //Multiplier = 2

            return costAt15.mul(new Decimal(7.85).pow(x.sub(14)))
        },
        display() {
            let amt = getBuyableAmount(this.layer, this.id)
            let out = `x1.5 beta points gain.<br> <b>Cost:</b>` + format(this.cost()) + ' beta points' + `\n            
            <br> <b>Effect: x</b>` + format(this.effect(amt)) + `\n            <br> <b>Amount:</b>` + format(amt)
            if (amt.lt(20)) out += '<br> <b> Need 20 buyable to unlock the next one.</b>'
            return out
        },
        canAfford() { return player[this.layer].points.gte(this.cost()) },
        unlocked() {return hasMilestone(this.layer, 3)},
        buy() {
            player[this.layer].points = player[this.layer].points.sub(this.cost())
            setBuyableAmount(this.layer, this.id, getBuyableAmount(this.layer, this.id).add(1))
        },
         effect(x) {return new Decimal(1.5).pow(x)},
        },
        12: {
        title: "Beta Boost 2 <br>",
        cost(x) {
            if (x === undefined) x = getBuyableAmount(this.layer, this.id)
            x = new Decimal(x)

            const base = new Decimal(5e24) //Basecose

           if (x.lt(14))
                return base.mul(new Decimal(12).pow(x))

            let costAt15 = base.mul(new Decimal(12).pow(14)) //Multiplier = 12

            return costAt15.mul(new Decimal(19).pow(x.sub(14)))
        },
        display() {
            let amt = getBuyableAmount(this.layer, this.id)
            let out = `x3 beta points gain.<br> <b>Cost:</b>` + format(this.cost()) + ' beta points' + `\n            
            <br> <b>Effect: x</b>` + format(this.effect(amt)) + `\n            <br> <b>Amount:</b>` + format(amt)
            if (amt.lt(20)) out += '<br> <b> Need 20 buyable to unlock the next one.</b>'
            return out
        },
        canAfford() { return player[this.layer].points.gte(this.cost()) },
        unlocked() {return getBuyableAmount(this.layer,11).gte(new Decimal(20))},
        buy() {
            player[this.layer].points = player[this.layer].points.sub(this.cost())
            setBuyableAmount(this.layer, this.id, getBuyableAmount(this.layer, this.id).add(1))
        },
        effect(x) {return new Decimal(3).pow(x)},
        },
    }
})