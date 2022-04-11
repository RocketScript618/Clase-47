class Game {
  constructor() {
    this.resetTitle = createElement("h2");
    this.resetButton = createButton("");
    this.leaderboardTitle = createElement("h2");
    this.leader1 = createElement("h2");
    this.leader2 = createElement("h2");
    this.playerMoving = false;
    this.leftKeyActive = false;
  }

  getState() {
    var gameStateRef = database.ref("gameState");
    gameStateRef.on("value", function(data) {
      gameState = data.val();
    });
  }
  update(state) {
    database.ref("/").update({
      gameState: state
    });
  }

  start() {
    player = new Player();
    playerCount = player.getCount();

    form = new Form();
    form.display();

    car1 = createSprite(width / 2 - 50, height - 100);
    car1.addImage("car1", car1_img);
    car1.scale = 0.07;

    car2 = createSprite(width / 2 + 100, height - 100);
    car2.addImage("car2", car2_img);
    car2.scale = 0.07;

    cars = [car1, car2];

    // C38 TA
    fuels = new Group();
    powerCoins = new Group();
    obstacle1 = new Group();
    obstacle2 = new Group();

    var obstacle1Positions = [
      {x:width/2-50, y:height-1300, image: obstacle1Image},
      {x:width/2+25, y:height-1800, image: obstacle1Image},
      {x:width/2-100, y:height-3300, image: obstacle1Image},
      {x:width/2-75, y:height-4300, image: obstacle1Image},
      {x:width/2-125, y:height-5300, image: obstacle1Image}
    ];

    var obstacle2Positions = [
      {x:width/2+50, y:height-500, image: obstacle2Image},
      {x:width/2-25, y:height-2800, image: obstacle2Image},
      {x:width/2+100, y:height-3900, image: obstacle2Image},
      {x:width/2+75, y:height-5000, image: obstacle2Image},
      {x:width/2+125, y:height-5700, image: obstacle2Image},
    ]

    this.addSprites(obstacle1,obstacle1Positions.length,obstacle1Image,0.04,obstacle1Positions);
    this.addSprites(obstacle2,obstacle2Positions.length,obstacle2Image,0.04,obstacle2Positions);

    // Agregando sprite de combustible al juego
    this.addSprites(fuels, 4, fuelImage, 0.02);

    // Agregando sprite de monedas al juego
    this.addSprites(powerCoins, 18, powerCoinImage, 0.09);
  }

  // C38 TA
  addSprites(spriteGroup, numberOfSprites, spriteImage, scale,positions=[]) {
    for (var i = 0; i < numberOfSprites; i++) {
      var x, y;

      if(positions.length>0){
        x = positions[i].x;
        y = positions[i].y;
        spriteImage = positions[i].image;
      } else{
        x = random(width / 2 + 150, width / 2 - 150);
        y = random(-height * 4.5, height - 400);
      }

        var sprite = createSprite(x, y);
        sprite.addImage("sprite", spriteImage);

        sprite.scale = scale;
        spriteGroup.add(sprite);
    }
  }

  handleElements() {
    form.hide();
    form.titleImg.position(40, 50);
    form.titleImg.class("gameTitleAfterEffect");
   

    //C39
    this.resetTitle.html("Reiniciar juego");
    this.resetTitle.class("resetText");
    this.resetTitle.position(width / 2 + 200, 40);

    this.resetButton.class("resetButton");
    this.resetButton.position(width / 2 + 230, 100);

    this.leaderboardTitle.html("Tabla de puntuación");
    this.leaderboardTitle.class("leaderText");
    this.leaderboardTitle.position(width/3 -60,40);

    this.leader1.class("leaderText");
    this.leader1.position(width/3-50,80);

    this.leader2.class("leaderText");
    this.leader2.position(width/3-50,130);
  }

  play() {
    this.handleElements();
    this.handlePlayerControls();
    this.handleResetButton();
    //this.ranking();
    
    Player.getPlayersInfo();
    player.getCarsAtEnd();

    const finishLine = height*6-100;

    if(player.positionY >= finishLine){
      gameState = 2;
      player.rank += 1;
      Player.updateCarsAtEnd(player.rank);
      player.update();
      this.showRank();
    }

    if(player.positionX <= width/2-150){
      player.positionX = width/2-150;
    } else if(player.positionX >= width/2+150){
      player.positionX = width/2+150;
    }

    if (allPlayers !== undefined) {
      image(track, 0, -height * 5, width, height * 6);

      this.showLeaderboard();
      this.showLife();
      this.showFuel();

      //índice de la matriz
      var index = 0;
      for (var plr in allPlayers) {
        //agrega 1 al índice por cada bucle
        index = index + 1;

        //utiliza datos de la base de datos para mostrar los autos en la dirección x e y
        var x = allPlayers[plr].positionX;
        var y = height - allPlayers[plr].positionY;

        cars[index - 1].position.x = x;
        cars[index - 1].position.y = y;

        // C38  SA
        if (index === player.index) {
          stroke(10);
          fill("red");
          ellipse(x, y, 60, 60);

          this.handleFuel(index);
          this.handlePowerCoins(index);
          this.handleObstacleCollision(index);
          
          // Cambiando la posición de la cámara en la dirección y
          camera.position.x = cars[index - 1].position.x;
          camera.position.y = cars[index - 1].position.y;

        }
      }

      // manejando evetnso keyboard

      drawSprites();
    }
  }

  handleFuel(index) {
    // Agregando combustible
    cars[index - 1].overlap(fuels, function(collector, collected) {
      player.fuel = 185;
      
      collected.remove();
    });

    if(player.fuel > 0 && this.playerMoving == true){
      player.fuel -= 0.3;
    }
    if(player.fuel <= 0){
      gameState = 2;
      this.gameOver("fuel");
    }
  }

  handlePowerCoins(index) {
    cars[index - 1].overlap(powerCoins, function(collector, collected) {
      player.score += 21;
      player.update();
      
      collected.remove();
    });
  
}

handleObstacleCollision(index){
  if(cars[index-1].collide(obstacle1)||cars[index-1].collide(obstacle2)){

    if(this.leftKeyActive){
      player.positionX += 100;
      player.positionY -= 100;
    } else{
      player.positionX -= 100;
      player.positionY -= 100;
    }

    

    if(player.life>0){
      player.life -= 200/4;
      console.log(player.life)

      if(player.life <= 0){
        gameState = 2;
        this.gameOver("life");
      }
    }

    player.update();
    
  }
}

handleResetButton() {
  this.resetButton.mousePressed(() => {
   database.ref("/").set({
      carsAtEnd: 0,
      playerCount:0,
      gameState:0,
      players:{

      }
   })
   window.location.reload();
  });
}
handlePlayerControls() {
  if (keyIsDown(UP_ARROW)) {
    this.playerMoving = true;
    //this.leftKeyActive = true;

    player.positionY += 10;
    player.update();
    if(keyIsDown(LEFT_ARROW)){
      this.playerMoving = true;
      this.leftKeyActive = true;

      player.positionX -= 5;
      player.update();
    }
    else if(keyIsDown(RIGHT_ARROW)){
      this.playerMoving = true;
      //this.leftKeyActive = true;

      player.positionX += 5;
      player.update();
    }
  }else{
    this.playerMoving = false;
    this.leftKeyActive = false;
  }
}

showLeaderboard(){
  var leader1, leader2;
  var players = Object.values(allPlayers);

  if((players[0].rank == 0 && players[1].rank == 0)||players[0].rank == 1){

    leader1 = 

    players[0].rank + "&emsp;" + 
    players[0].name + "&emsp;" +
    players[0].score;

    leader2 = 
    
    players[1].rank + "&emsp;" +
    players[1].name + "&emsp;" +
    players[1].score;
  }
    if(players[1].rank == 1){
      leader1 = 

      players[1].rank + "&emsp;" + 
      players[1].name + "&emsp;" +
      players[1].score;

      leader2 = 
      
      players[0].rank + "&emsp;" +
      players[0].name + "&emsp;" +
      players[0].score;
      }
      this.leader1.html(leader1);
      this.leader2.html(leader2);
  }

  showRank(){
    swal({
      title: `Good game.${"\n"}Position #${"\n"}${player.rank}`,
      text: "You win, congrats",
      imageUrl: "https://raw.githubusercontent.com/vishalgaddam873/p5-multiplayer-car-race-game/master/assets/cup.png",
      imageSize: "100x100",
      confirmButtonText: "Okay"
    })
  }

  showLife() {
    push();
    image(lifeImage, width / 2 - 130, height - player.positionY - 125, 20, 20);
    fill("white");
    rect(width / 2 - 100, height - player.positionY - 125, 200, 20);
    fill("#f50057");
    rect(width / 2 - 100, height - player.positionY - 125, player.life, 20);
    noStroke();
    pop();
  }

  showFuel(){
    push();

    image(fuelImage,width/2-130, height-player.positionY-100, 20, 20);
    fill("white");
    rect(width/2-100, height-player.positionY-100, 185, 20);
    fill("crimson");
    rect(width/2-100, height-player.positionY-100, player.fuel, 20);
    noStroke();

    pop();
  }

  gameOver(reason){
    if(reason == "fuel"){
      swal({
        title: `You ran out of fuel`,
        text: "You lose",
        imageUrl: "https://cdn.shopify.com/s/files/1/1061/1924/products/Thumbs_Down_Sign_Emoji_Icon_ios10_grande.png",
        imageSize: "100x100",
        confirmButtonText: "Okay"
      })
    } else if(reason == "life"){
      swal({
        title: `Your car ran out of life`,
        text: "You lose",
        imageUrl: "https://raw.githubusercontent.com/RocketScript618/a/main/death.png",
        imageSize: "100x100",
        confirmButtonText: "Okay"
      })
    }
    

  }
}