# yugioh-webmat
Playing field for the Yu-Gi-Oh trading card game. Uses WebRTC to sync status between two players.

`right click` to view a card in detail. `Left click` a field to show all cards. This only works if a field is visible to you. 
Use the scroll feature in your browser (`ctrl + scroll`) to zoom in/out.

This project includes a PHP crawler that pulls card images from [yugioh.wikia.com](http://yugioh.wikia.com).

When starting the game, paste the JSON the crawler generated. Then, exchange the prompted `peer id` with your oponent. 

## Notes
+ This project does *nothing* to enforce the game rules. It just allows you to move cards around.
+ There is no state-enforcing. All changes are send to the other player immediately, and the local state is updated on receive.
 If you happen to change the same field simultanously, the game will move out of sync.
+ You **really** should play this while using voice chat.
