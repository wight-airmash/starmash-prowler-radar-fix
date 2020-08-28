(function () {
  const radars = {};
  const radarCircleRadius = 600;
  let isEnabled = true;
  let radarsUpdateInterval = 0;

  const $radarIndicator = $(
    '<div id="prowlerAlert-fix" style="position: absolute; top: 100px; left: calc(50% - 50px); width: 100px; height: 30px; background-color: red; opacity:0.6; display:none;"></div>'
  );

  function initRadar(player) {
    const radar = new PIXI.Graphics();

    radar.clear();
    radar.beginFill(16711680, 0.125);
    radar.drawCircle(0, 0, radarCircleRadius);
    radar.endFill();

    radars[player.id] = radar;
    game.graphics.layers.groundobjects.addChild(radar);

    return radar;
  }

  function updateRadar(player, me = Players.getMe()) {
    if (isEnabled && player) {
      const radar = radars[player.id] || initRadar(player);

      radar.position.set(player.lowResPos.x, player.lowResPos.y);

      if (
        5 != player.type ||
        (player.render && !player.stealthed) ||
        player.team == me.team ||
        player.hidden ||
        player.removedFromMap
      ) {
        radar.renderable = false;
      } else {
        radar.renderable = true;
      }
    }
  }

  function updateRadars() {
    const playerIds = Players.getIDs();
    const me = Players.getMe();

    $radarIndicator.hide();

    if (isEnabled) {
      for (const playerId in playerIds) {
        const player = Players.get(playerId);

        if (
          5 == player.type &&
          player.team != me.team &&
          Tools.distance(player.lowResPos.x, player.lowResPos.y, me.pos.x, me.pos.y) <
            radarCircleRadius
        ) {
          $radarIndicator.show();
        }

        updateRadar(player, me);
      }
    }
  }

  function removeRadars() {
    for (const radarId in radars) {
      removeRadar(radarId);
    }
  }

  function removeRadar(radarId) {
    const radar = radars[radarId];

    if (radar) {
      game.graphics.layers.groundobjects.removeChild(radar);
      radar.destroy();
      delete radars[radarId];
    }
  }

  SWAM.on('playerChangedType', (msg) => {
    updateRadar(Players.get(msg.id));
  });

  SWAM.on('playerKilled', (msg, player) => {
    updateRadar(player);
  });

  SWAM.on('playerStealth', (msg) => {
    setTimeout(() => {
      updateRadar(Players.get(msg.id));
    }, 17);
  });

  SWAM.on('playerImpacted', (msg) => {
    for (let index = 0; index < msg.players.length; index += 1) {
      updateRadar(Players.get(msg.players[index].id));
    }
  });

  SWAM.on('playerDestroyed', (msg) => {
    removeRadar(msg.id);
  });

  SWAM.on('scoreboardUpdate', () => {
    updateRadars();
  });

  SWAM.on('gamePrep', () => {
    SWAM.Settings.general.useProwlerRadar = false;
    $('body').append($radarIndicator);

    updateRadars();
  });

  SWAM.on('gameWipe', () => {
    radarsUpdateInterval = clearInterval(radarsUpdateInterval);
    removeRadars();
    $radarIndicator.remove();
  });

  SWAM.registerExtension({
    name: 'Prowler Radar Fix',
    id: 'wight.prowlerradarfix',
    description: 'Prowler Radar for each aircraft type.',
    version: '1.0.0',
    author: 'wight',
  });
})();
