let targetImg;
let player;
let direction = 8;
let movementSpeed = 350;
let position = 0;

class StartRoom extends Phaser.Scene {
    constructor() {
        super({ key: "StartRoom" });
    }

    preload() {
        // load the tileset image which is just a single tile for the background room
        this.load.image("room1_img", "../../assets/images/room1.png");

        // load the tilemap exported from Tiled
        this.load.tilemapTiledJSON(
            "map",
            "../../assets/tilemaps/clickWalkingRoom.json"
        );

        // Load the player sprite sheet
        // Added 3px of empty space to each side of each frame of animation to prevent webGL pixel bleeding
        this.load.spritesheet(
            "player_sheet",
            "../../assets/images/player_sheet.png",
            { frameWidth: 78, frameHeight: 103 }
        );

        // load the target image that the camera will follow
        this.load.image("target", "../../assets/images/target.png");

        this.load.image(
            "wall_terminal_img",
            "../../assets/images/terminal_5x.png"
        );
    }

    create() {
        // parse the tilemap
        let map = this.make.tilemap({
            key: "map"
        });

        // add the tileset image to the map
        let tiles = map.addTilesetImage("room1", "room1_img");

        //const aboveLayer = map.createStaticLayer("door_layer", tileset, 0, 0);
        //aboveLayer.setDepth(10);
        //search "objects" layer of tile map for entity labled "Spawn", use this as the starting point of the image
        let spawnPoint = map.findObject("objects", obj => obj.name === "Spawn");

        //creates array of all elements in "objects" layer
        const objectslistings = map.objects[0].objects;

        //array of static physic groups called doors
        let doors = this.physics.add.staticGroup();

        //find data properties from each tilemap object and apply it to the physical object
        objectslistings.forEach(element => {
            if (element.name === "Door") {
                console.log(element);
                console.log(element.properties[0].value);
                let interactElements = doors
                    .create(element.x, element.y, "")
                    .setOrigin(0, 0)
                    .setSize(element.width, element.height)
                    //.setOffset(62/2, 52/2); // I have no idea how not to hard code this offset.  I am using the size of the sprite used for doors/switches (a red square).
                    .setVisible(false);

                for (let i = 0; i < element.properties.length; i++) {
                    interactElements.setData(
                        element.properties[i].name,
                        element.properties[i].value
                    );
                }
            } //end if
        }); //end of for each

        // add the room_map layer to the scene
        const baseLayer = map.createStaticLayer("room_map", tiles, 0, 0);

        // set the camera bounds to the edges of the room
        this.cameras.main.setBounds(0, 0, 2400, 929);

        // Camera follows the target image
        targetImg = this.physics.add.image(
            spawnPoint.x,
            spawnPoint.y,
            "target"
        );
        targetImg.setVisible(false);
        this.cameras.main.startFollow(targetImg);

        //walk config for the player
        let config = {
            key: "walk",
            frames: this.anims.generateFrameNumbers("player_sheet", {}),
            repeat: -1
        };

        // Create the walk animation
        this.anims.create(config);

        // Create the player sprite
        player = this.physics.add.sprite(spawnPoint.x, spawnPoint.y, "player");

        player.anims.play("walk");

        //create overlap trigger for player and image
        this.physics.add.overlap(
            doors,
            player,
            event => {
                for (
                    let i = 0;
                    i < this.physics.world.staticBodies.entries.length;
                    i++
                ) {
                    if (
                        this.physics.world.staticBodies.entries[i].touching
                            .none === false
                    ) {
                        console.log(
                            "You Have hit physical body number " + i + " "
                        );
                        console.log(
                            this.physics.world.staticBodies.entries[i]
                                .gameObject.data.list.Direction
                        );
                        let walkTo = this.physics.world.staticBodies.entries[i]
                            .gameObject.data.list.walkTo; //find the walkTo point
                        //this.scene.stop("StartRoom");
                        this.tweens.add({
                            targets: player,
                            x: walkTo,
                            duration: 5000,
                            onStart: function() {
                                console.log("onStart");
                                console.log(arguments);
                            },
                            onUpdate: event => {
                                /*this.cameras.main.fade(250);*/
                                this.cameras.main.setTint(0, 0, 0);
                            },
                            onComplete: event => {
                                this.scene.start(
                                    "SecondRoom",
                                    this.physics.world.staticBodies.entries[i]
                                        .gameObject.data.list.Direction
                                );
                            }
                        });
                    }
                }
                /* console.log("You have triggered the door");
        this.scene.stop("StartRoom");
        this.scene.start("SecondRoom", "THIS IS DATA THAT I WANT");*/
            },
            null,
            this
        );

        //debugging for physics elements trying to see where hit boxes are
        this.input.keyboard.once("keydown_D", event => {
            // Turn on physics debugging to show player's hitbox
            this.physics.world.createDebugGraphic();

            // Create worldLayer collision graphic above the player, but below the help text
            const graphics = this.add.graphics();
            // .setAlpha(0.70)
            //.setDepth(20);
            baseLayer.renderDebug(graphics, {
                tileColor: null, // Color of non-colliding tiles
                collidingTileColor: new Phaser.Display.Color(243, 134, 48, 255), // Color of colliding tiles
                faceColor: new Phaser.Display.Color(40, 39, 37, 255) // Color of colliding face edges
            });
        });
    }

    update() {
        if (this.input.activePointer.isDown) {
            // since the map is larger then the canvas width we need to calculate the scroll x variable
            let cameraPosition =
                this.input.activePointer.x + this.cameras.main.scrollX;
            console.log(
                "this.cameras.main.scrollX " + this.cameras.main.scrollX
            );

            //moves camera to where the user clicks
            if (targetImg.x > cameraPosition) {
                position = cameraPosition;
                targetImg.setVelocityX(-movementSpeed);
                player.setVelocityX(-movementSpeed);
                player.flipX = true;
            }
            if (targetImg.x < cameraPosition) {
                position = cameraPosition;
                targetImg.setVelocityX(movementSpeed);
                player.setVelocityX(movementSpeed);
                player.flipX = false;
            }
        }

        // check if object is moving to the right
        if (targetImg.body.velocity.x > 0) {
            if (targetImg.x > position) {
                position = 0;
                targetImg.setVelocityX(0);
                player.setVelocityX(0);
            }
        } else {
            if (targetImg.x < position) {
                position = 0;
                targetImg.setVelocityX(0);
                player.setVelocityX(0);
            }
        }
    }
}

class SecondRoom extends Phaser.Scene {
    constructor(test) {
        super({ key: "SecondRoom" });
        console.log(test);
    }

    preload() {
        // load the tileset image which is just a single tile for the background room
        this.load.image("room1_img", "../../assets/images/room1.png");
        this.load.image(
            "wall_terminal_img",
            "../../assets/images/terminal_5x.png"
        );

        // Load the player sprite sheet
        // Added 3px of empty space to each side of each frame of animation to prevent webGL pixel bleeding
        this.load.spritesheet(
            "player_sheet",
            "../../assets/images/player_sheet.png",
            { frameWidth: 78, frameHeight: 103 }
        );

        // load the tilemap exported from Tiled
        this.load.tilemapTiledJSON(
            "Animap",
            "../../assets/tilemaps/animated_room.json"
        );

        // Load the Animated Tiles Plugin: https://github.com/nkholski/phaser-animated-tiles
        this.load.scenePlugin(
            "animatedTiles",
            AnimatedTiles,
            "animatedTiles",
            "animatedTiles"
        );
    }

    create() {
        // parse the tilemap
        console.log(this.scene.settings.data);
        let Animap = this.make.tilemap({ key: "Animap" });

        // add the tileset image to the map
        let room_tileset = Animap.addTilesetImage("room1", "room1_img");
        let wall_terminal_tileset = Animap.addTilesetImage(
            "wall_terminal",
            "wall_terminal_img"
        );

        // add the room_map layer to the scene
        const baseLayer = Animap.createStaticLayer(
            "room_map",
            room_tileset,
            0,
            0
        );

        Animap.createDynamicLayer("clickable", wall_terminal_tileset, 0, 0);

        // We got the map. Tell animated tiles plugin to loop through the tileset properties and get ready.
        // We don't need to do anything beyond this point for animated tiles to work.
        this.sys.animatedTiles.init(Animap);

        let walkPoint;
        let spawnPoint;
        console.log(Animap);
        if (this.scene.settings.data === "left") {
            spawnPoint = Animap.findObject(
                "objects",
                obj => obj.name === "spawnLeft"
            );
            walkPoint = Animap.findObject(
                "objects",
                obj => obj.name === "walkLeft"
            );
        } else {
            spawnPoint = Animap.findObject(
                "objects",
                obj => obj.name === "spawnRight"
            );
            walkPoint = Animap.findObject(
                "objects",
                obj => obj.name === "walkRight"
            );
        }

        // set the camera bounds to the edges of the room
        this.cameras.main.setBounds(0, 0, 2400, 929);

        // Create the player sprite animation config
        let config = {
            frames: this.anims.generateFrameNumbers("player_sheet", {}),
            repeat: -1
        };

        // Create the walk animation
        this.anims.create(config);

        // Create the player sprite
        player = this.physics.add.sprite(spawnPoint.x, spawnPoint.y, "player");

        // Start the walking animation
        player.anims.play("walk");

        //found the spawnpoint now start animation to walk to spawn point
        this.tweens.add({
            targets: player,
            x: walkPoint.x,
            duration: 5000,
            onStart: function() {
                console.log("onStart");
                console.log(arguments);
            }
        });

        // Camera follows the target image
        this.cameras.main.startFollow(player);

        //debugging for physics elements trying to see where hit boxes are
        this.input.keyboard.once("keydown_D", event => {
            // Turn on physics debugging to show player's hitbox
            this.physics.world.createDebugGraphic();

            // Create worldLayer collision graphic above the player, but below the help text
            const graphics = this.add.graphics();
            // .setAlpha(0.70)
            //.setDepth(20);
            baseLayer.renderDebug(graphics, {
                tileColor: null, // Color of non-colliding tiles
                collidingTileColor: new Phaser.Display.Color(243, 134, 48, 255), // Color of colliding tiles
                faceColor: new Phaser.Display.Color(40, 39, 37, 255) // Color of colliding face edges
            });
        });
    }

    update() {
        if (this.input.activePointer.isDown) {
            // since the map is larger then the canvas width we need to calculate the scroll x variable
            let cameraPosition =
                this.input.activePointer.x + this.cameras.main.scrollX;
            console.log(
                "this.cameras.main.scrollX " + this.cameras.main.scrollX
            );
            console.log(player.x + " is play x");
            console.log(cameraPosition + " is camera position");
            console.log(player.x < cameraPosition);

            //moves camera to where the user clicks
            if (player.x > cameraPosition) {
                position = cameraPosition;
                player.setVelocityX(-movementSpeed);
                player.flipX = true;
            }
            if (player.x < cameraPosition) {
                position = cameraPosition;
                player.setVelocityX(movementSpeed);
                player.flipX = false;
            }
        }

        // check if object is moving to the right
        if (player.body.velocity.x > 0) {
            if (player.x > position) {
                position = 0;
                player.setVelocityX(0);
            }
        } else {
            if (player.x < position) {
                position = 0;
                player.setVelocityX(0);
            }
        }
    }
}

const config = {
    type: Phaser.AUTO,
    width: 1200,
    height: 929,
    physics: {
        default: "arcade",
        gravity: {
            x: 0
        }
    },
    scene: [StartRoom, SecondRoom]
};

new Phaser.Game(config);
