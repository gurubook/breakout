import Phaser from 'phaser';
/*
    Based largely on phaser.io examples, with some stuff stolen here and there.
*/
var Breakout = new Phaser.Class({

    Extends: Phaser.Scene,

    initialize:

        function Breakout() {
        Phaser.Scene.call(this, { key: 'breakout' });

        this.bricks;
        this.paddle;
        this.ball;
        this.dynamic;
        this.audioEffects = [];

        this.scrollIdx = 0;
        this.scrollText = [
            "Luca Sacchi l.sacchi@lsdev.it - senior Java architect and software developer, with strong skill in finding the easiest and fastest route to solve complex problem leveraging at best the opportunity of OSS.",
            "In over 30 years of experience i designed and supervised the development of a wide range of internet based application for various industries.",
            "Since i was there from the beginning of (internet) time, the 90's, i had the opportunity to follow every development, every right (and wrong) idea, many foolish and doomed, many successful, and always learned something in doing that.",
            "I developed several custom e.commerce site, CRM, e.incentive application, e.booking portal, full stack mobile banking app, customer support app for telco giant, plus some really complicated robotics automation application.",
            "Currently i coordinate a really good team of skilled developers designing and evolving a micro service based API platform and development framework for complex enterprise environment (with an eye on mobile too).",
            "And i'm still in love with my job.",
            "While a bit rough at edges, i tend to be heard, take a clear position and be smart enough to recognize other's position.",
            "I develop strong team relationship with colleagues.",
            "I like to drive innovation searching for new technologies, but always with a look to feasibility and quick return on project schedule.",
            "Specialties: ",
            "Java software development (Spring, web, rich client)",
            "Enterprise integration patterns",
            "Strong knowledge of Cocoa framework for iOS application development",
            "Strong knowledge of Android framework",
            "Linux based embedded platform and application",
            "Software and network security expert",
            "Strong skill on Linux, OpenBSD, macOSX and other Unix based OS",
            "Deep knowledge of Java, Kotlin, C, Objective C, Swift and JS",
            "Currently like Spring, Kafka, CQRS, MongoDb, graph DB",
        ].join(' ').toUpperCase();

        this.stars = [];
        this.starDistance = 300;
        this.starSpeed = 6;
        this.starMax = 400;
        this.starXx = [];
        this.starYy = [];
        this.starZz = [];
    },

    preload: function() {
        this.load.atlas('assets', 'assets/breakout.png', 'assets/breakout.json');
        this.load.image('star_1', 'assets/star.png');
        this.load.image('star_2', 'assets/star2.png');
        this.load.image('star_3', 'assets/star3.png');
        this.load.image('star_4', 'assets/star4.png');
        this.load.image('introFont', 'assets/fonts/introfonts.png');
        for (var i = 1; i <= 12; i++) {
            this.load.audio('s' + i, ['assets/audio/Arkanoid SFX (' + i + ').wav']);
        }
    },

    create: function() {
        this.setupAudio();
        this.createStarfield();
        this.setupFont();
        this.createBreakOut();
    },
    setupAudio: function() {
        for (var i = 1; i <= 12; i++) {
            this.audioEffects[i] = this.sound.add('s' + i);
        }
    },
    update: function() {
        if (this.ball.y > 600) {
            this.resetBall();
        }
        this.warpStarfield();
        this.doScrollText();
    },
    setupFont() {
        var fontConfig = {
            image: 'introFont',
            width: 128,
            height: 128,
            chars: Phaser.GameObjects.RetroFont.TEXT_SET2,
            charsPerRow: 10
        };
        this.cache.bitmapFont.add('introFont', Phaser.GameObjects.RetroFont.Parse(this, fontConfig));
        this.dynamic = this.add.dynamicBitmapText(0, 0, 'introFont', '   LSDEV.IT   ');
        this.dynamic.setScale(0.5);
    },
    createBreakOut() {
        //  Enable world bounds, but disable the floor
        this.physics.world.setBoundsCollision(true, true, true, false);

        //  Create the bricks in a 12x6 grid
        this.bricks = this.physics.add.staticGroup({
            key: 'assets',
            frame: ['blue1', 'red1', 'green1', 'yellow1', 'silver1', 'purple1'],
            frameQuantity: 12,
            gridAlign: { width: 12, height: 6, cellWidth: 64, cellHeight: 32, x: 48, y: 100 }
        });

        this.ball = this.physics.add.image(400, 500, 'assets', 'ball2').setCollideWorldBounds(true).setBounce(1);
        this.ball.setData('onPaddle', true);

        this.paddle = this.physics.add.image(400, 550, 'assets', 'paddle2').setImmovable();

        //  Our colliders
        this.physics.add.collider(this.ball, this.bricks, this.hitBrick, null, this);
        this.physics.add.collider(this.ball, this.paddle, this.hitPaddle, null, this);

        //  Input events
        this.input.on('pointermove', function(pointer) {

            //  Keep the paddle within the game
            this.paddle.x = Phaser.Math.Clamp(pointer.x, 52, 748);

            if (this.ball.getData('onPaddle')) {
                this.ball.x = this.paddle.x;
            }

        }, this);

        this.input.on('pointerup', function(pointer) {

            if (this.ball.getData('onPaddle')) {
                this.ball.setVelocity(-75, -300);
                this.ball.setData('onPaddle', false);
            }

        }, this);
    },

    hitBrick: function(ball, brick) {
        brick.disableBody(true, true);

        if (this.bricks.countActive() === 0) {
            this.resetLevel();
        }

        this.audioEffects[7].play();
    },

    resetBall: function() {
        this.ball.setVelocity(0);
        this.ball.setPosition(this.paddle.x, 500);
        this.ball.setData('onPaddle', true);
    },

    resetLevel: function() {
        this.resetBall();

        this.bricks.children.each(function(brick) {

            brick.enableBody(false, 0, 0, true, true);

        });
    },

    hitPaddle: function(ball, paddle) {
        var diff = 0;

        if (ball.x < paddle.x) {
            //  Ball is on the left-hand side of the paddle
            diff = paddle.x - ball.x;
            ball.setVelocityX(-10 * diff);
        } else if (ball.x > paddle.x) {
            //  Ball is on the right-hand side of the paddle
            diff = ball.x - paddle.x;
            ball.setVelocityX(10 * diff);
        } else {
            //  Ball is perfectly in the middle
            //  Add a little random X to stop it bouncing straight up!
            ball.setVelocityX(2 + Math.random() * 8);
        }
        this.audioEffects[8].play();
    },

    createStarfield: function() {
        for (var i = 0; i < this.starMax; i++) {
            var starType = ((i % 10) != 0) ? 'star_2' : 'star_' + Math.floor((Math.random() * 4) + 1);
            this.stars.push(this.add.sprite(config.width / 2, config.height / 2, starType));
            this.starXx[i] = Math.floor(Math.random() * 800) - 400;
            this.starYy[i] = Math.floor(Math.random() * 600) - 300;
            this.starZz[i] = Math.floor(Math.random() * 1700) - 100;
        }
    },

    warpStarfield: function() {
        for (let i = 0; i < this.starMax; i++) {
            var perspective = this.starDistance / (this.starDistance - this.starZz[i]);
            var x = (config.width / 2) + this.starXx[i] * perspective;
            var y = (config.height / 2) + this.starYy[i] * perspective;

            this.starZz[i] += this.starSpeed;

            if (this.starZz[i] > 300) {
                this.starZz[i] -= 600;
            }

            this.stars[i].setPosition(x, y);
        }
    },
    doScrollText: function() {
        this.dynamic.scrollX += 8;
        if (this.dynamic.scrollX >= 128) {
            //  Remove first character
            var current = this.dynamic.text.substr(1);

            //  Add next character from the string
            current = current.concat(this.scrollText[this.scrollIdx]);

            this.scrollIdx++;

            if (this.scrollIdx === this.scrollText.length) {
                this.scrollIdx = 0;
            }

            //  Set it
            this.dynamic.setText(current);

            //  Reset scroller
            this.dynamic.scrollX = this.dynamic.scrollX % 128;
        }
    }
});

var config = {
    type: Phaser.WEBGL,
    width: 800,
    height: 600,
    parent: '',
    scene: [Breakout],
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    physics: {
        default: 'arcade'
    }
};

var game = new Phaser.Game(config);