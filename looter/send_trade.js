const SteamUser = require('steam-user');
const SteamCommunity = require('steamcommunity');
const SteamTotp = require('steam-totp');
const TradeOfferManager = require('steam-tradeoffer-manager');
const args = process.argv;

if(args.length <= 2) process.exit(0);

const tradeOfferLink = args[3];
const account = args[2].split(':');
const [login, password, shared_secret, identity_secret] = account;

sendTrade()

function sendTrade() {
    let client = new SteamUser();
    let manager = new TradeOfferManager({
        "steam": client,
        "language": "en"
    });
    let community = new SteamCommunity();
    let logOnOptions = {
        "accountName": login,
        "password": password,
        "twoFactorCode": SteamTotp.getAuthCode(shared_secret)
    };

    client.logOn(logOnOptions);

    client.on('loggedOn', function() {
        console.log("Logged into Steam");
    });

    client.on('webSession', function(sessionID, cookies) {
        manager.setCookies(cookies, function(err) {
            errorHandler("Something went wrong while setting webSession", err)

            manager.getInventoryContents(730, 2, true, function(err, csgoInventory) {
                errorHandler("Something went wrong while getting inventory", err)

                let offer = manager.createOffer(tradeOfferLink);

                let itemsCount = 0;
                csgoInventory.forEach(item => {
                        itemsCount++;
                        offer.addMyItem(item)
                })


				console.log("Found " + itemsCount + " CS:GO items");
                    
                offer.send(function(err, status) {
                    errorHandler("Something went wrong while sending trade offer", err)

                    if (status === 'pending') {
                        console.log(`Offer #${offer.id} sent, but requires confirmation`);
                        community.acceptConfirmationForObject(identity_secret, offer.id, function(err) {
                            if (!err) {
                                console.log("Offer confirmed");
                                process.exit(1)
							}
                            errorHandler("Something went wrong during trade confirmation", err)
                        });
                    }
                });
            });
        });

        community.setCookies(cookies);
    });
}

function errorHandler(message, error){
    if (error) {
        console.log(message + '\n' + error)
        process.exit(-1);
    }
}
