let modInfo = {
	name: "The Greek Tree",
	author: "nobody",
	pointsName: "points",
	modFiles: ["layers.js", "tree.js"],

	discordName: "",
	discordLink: "",
	initialStartPoints: new Decimal (1), // Used for hard resets and new players
	offlineLimit: 10,  // In hours
}

// Set your version in num and name
let VERSION = {
	num: "0.1",
	name: "Starting !",
}

let changelog = `<h1>Changelog:</h1><br>
	<h3>v0.1</h3><br>
		- Added 2 layer.<br>
		- And other stuff.`

let winText = `Congratulations! You have reached the end and beaten this game, but for now...`

// If you add new functions anywhere inside of a layer, and those functions have an effect when called, add them here.
// (The ones here are examples, all official functions are already taken care of)
var doNotCallTheseFunctionsEveryTick = ["blowUpEverything"]

function getStartPoints(){
    return new Decimal(modInfo.initialStartPoints)
}

// Determines if it should show points/sec
function canGenPoints(){
	return true
}

// Calculate points/sec!
function getPointGen() {
	if(!canGenPoints())
		return new Decimal(0)
	let b21 = getBuyableAmount("A", 21)
    let boost21 = new Decimal(1.25).pow(b21)

	let gain = new Decimal(1)
	if (hasUpgrade('A',11)) gain = gain.times(2)
	if (hasUpgrade('A',12)) gain = gain.times(2)
	if (hasBuyable('A',11)) gain = gain.times(buyableEffect('A',11))
	if (hasUpgrade('A',23)) gain = gain.times(upgradeEffect('A',23))
	if (hasUpgrade('B',12)) gain = gain.times(5)
	if (hasUpgrade('A',25)) gain = gain.times(upgradeEffect('A',25))
	if (hasUpgrade('A',26)) gain = gain.times(upgradeEffect('A',26))
	if (hasUpgrade('A',31)) gain = gain.times(upgradeEffect('A',31))
	if (hasUpgrade('A',34)) gain = gain.times(34)
	if (hasUpgrade('B',15)) gain = gain.times(upgradeEffect('B',15))
	if (hasMilestone('B',3)) gain = gain.times(1e10)
	

	if (hasAchievement('ach',23)) gain = gain.times(23)
	return gain
}

// You can add non-layer related variables that should to into "player" and be saved here, along with default values
function addedPlayerData() { return {
}}

// Display extra things at the top of the page
var displayThings = [
]

// Determines when the game "ends"
function isEndgame() {
	return player.points.gte(new Decimal("e280000000"))
}



// Less important things beyond this point!

// Style for the background, can be a function
var backgroundStyle = {

}

// You can change this if you have things that can be messed up by long tick lengths
function maxTickLength() {
	return(3600) // Default is 1 hour which is just arbitrarily large
}

// Use this if you need to undo inflation from an older version. If the version is older than the version that fixed the issue,
// you can cap their current resources with this.
function fixOldSave(oldVersion){
}