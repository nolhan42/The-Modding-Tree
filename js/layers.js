addLayer("p", {
    name: "prestige", // This is optional, only used in a few places, If absent it just uses the layer id.
    symbol: "P", // This appears on the layer's node. Default is the id with the first letter capitalized
    position: 0, // Horizontal position within a row. By default it uses the layer id and sorts in alphabetical order
    startData() { return {
        unlocked: true,
		points: new Decimal(0),
    }},
    color: "#277cbb",
    requires: new Decimal(10), // Can be a function that takes requirement increases into account
    resource: "prestige points", // Name of prestige currency
    baseResource: "points", // Name of resource prestige is based on
    baseAmount() {return player.points}, // Get the current amount of baseResource
    type: "normal", // normal: cost to gain currency depends on amount gained. static: cost depends on how much you already have
    exponent: 0.5, // Prestige currency exponent
    gainMult() { // Calculate the multiplier for main currency from bonuses
        mult = new Decimal(1)
        if (hasUpgrade('p', 13)) mult = mult.times(upgradeEffect('p', 13))
        return mult
    },
    gainExp() { // Calculate the exponent on main currency from bonuses
        return new Decimal(1)
    },
    row: 0, // Row the layer is in on the tree (0 is the first row)
    hotkeys: [
        {key: "p", description: "P: Reset for prestige points", onPress(){if (canReset(this.layer)) doReset(this.layer)}},
    ],
    upgrades: {
        11: {
            title: "Everything start with 2",
            description: "Double your point gain.",
            cost: new Decimal(10),
        },
        12: {
            title: "What come after 2 ?",
            description: "Triple your point gain.",
            cost: new Decimal(25),
        },
        13: {
            title: "About time",
            description: "Gain Prestige Point based on Point.",
            cost: new Decimal(50),
            effect() {
                return player.points.add(1).pow(0.15)
            },
            effectDisplay() { return format(upgradeEffect(this.layer, this.id))+"x" },
        },
    },
    layerShown(){return true}
})

addLayer("a", {
    startData() { return {
        unlocked: true,
        points: new Decimal(0),
    }},
    color: "yellow",
    resource: "achievement power", 
    row: "side",
    tooltip() { // Optional, tooltip displays when the layer is locked
        return ("Achievements")
    },
    achievementPopups: true,
    achievements: {
        11: {
            name: "Let's begin the adventure",
            done() {return player.p.points.gte(1)},
            goalTooltip: "Get your first prestige point",
            doneTooltip: "Get your first prestige point",
        },
        12: {
            name: "What a boost !",
            done() {return player.upgrades.gte(11)},
            goalTooltip: "Get your first upgrade",
            doneTooltip: "Get your first upgrade",
        },
        13: {
            name: "What is this ?",
            done() {return player.p.points.gte(250)},
            goalTooltip: "Unlock ???",
            doneTooltip: "Unlock a Buyable",
        },
    },
    midsection: ["grid", "blank"],
},
)